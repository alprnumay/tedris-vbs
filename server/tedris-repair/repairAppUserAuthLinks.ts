import { isAdminUser, resolveAdminUser, userFromJwtPayload } from "./adminAuth";
import { resolveAuthUserForDiagnosis } from "./authLookup";
import { buildDryRunSummary, diagnoseRepairEmail } from "./diagnoseDryRun";
import {
  appUserDataFromRecord,
  getAppUserEmail,
  isDeletedOrInactive,
  normalizeEmail,
  selectPrimaryAppUserRecord,
} from "./email";
import type {
  AppUserRecordData,
  BackendRecord,
  BackendUser,
  DiagnoseOnlyReport,
  RepairAppUserAuthLinksReport,
  RepairEmailDiagnosis,
  RepairOptions,
} from "./types";
import { passwordForDistrict, VpsApiClient } from "./vpsClient";

function authAlreadyLinked(data: AppUserRecordData, email: string, authUsers: BackendUser[]): boolean {
  const authId = data.authUserId ? String(data.authUserId) : "";
  if (!authId) return false;
  const linked = authUsers.find((a) => String(a.id) === authId);
  const linkedEmail = linked && typeof linked.email === "string" ? normalizeEmail(linked.email) : "";
  return Boolean(linked && linkedEmail === normalizeEmail(email));
}

function emptyReport(dryRun: boolean): RepairAppUserAuthLinksReport {
  return {
    ok: true,
    dryRun,
    totalAppUsers: 0,
    uniqueEmails: 0,
    alreadyLinked: 0,
    emailNormalized: 0,
    emailNormalizedWouldUpdate: 0,
    authFoundAndLinked: 0,
    authFoundWouldLink: 0,
    authCreatedAndLinked: 0,
    authWouldCreate: 0,
    duplicatesDetected: 0,
    skippedDeleted: 0,
    failed: 0,
    errors: [],
  };
}

/** Yalnızca diagnoseEmails — katalog erken durur, yazma/register/PUT yok. */
export async function runDiagnoseEmailsOnly(
  client: VpsApiClient,
  diagnoseEmails: string[],
): Promise<DiagnoseOnlyReport> {
  const emails = diagnoseEmails.map((e) => normalizeEmail(e)).filter(Boolean);

  const { records, pagesFetched, stoppedEarly } = await client.fetchAppUsersForDiagnose(emails, []);

  const emailDiagnosis: RepairEmailDiagnosis[] = [];
  for (const email of emails) {
    const group = records.filter((r) => getAppUserEmail(r) === email);
    const primary = group[0] ?? null;
    const data = primary ? appUserDataFromRecord(primary) : null;
    const authResolution = await resolveAuthUserForDiagnosis(client, email, {
      district: data?.district,
      province: data?.province,
      appUserRecordExists: Boolean(primary),
    });
    emailDiagnosis.push(
      diagnoseRepairEmail(email, records, authResolution.user, authResolution.meta),
    );
  }

  console.log("[TEDRIS_REPAIR_DRY_RUN]", {
    dryRun: true,
    mode: "diagnose_emails_only",
    pagesFetched,
    recordsLoaded: records.length,
    stoppedEarly,
    emailCount: emails.length,
    emailDiagnosis,
  });
  for (const row of emailDiagnosis) {
    console.log("[TEDRIS_REPAIR_EMAIL_DIAG_LINE]", row);
  }

  return {
    ok: true,
    dryRun: true,
    dataChanged: false,
    emailDiagnosis,
    catalogMeta: {
      mode: "diagnose_emails_only",
      pagesFetched,
      recordsLoaded: records.length,
      stoppedEarly,
      targetEmailCount: emails.length,
      authLookupNote:
        "Auth kimliği: önce GET /admin/users (VPS çoğu zaman app_user kataloğu döner, auth id değil); güvenilir değilse POST /auth/login teşhis probesi (district/tedris2026 şifreleri). authWouldCreate dry-run'da kullanılmaz.",
    },
  };
}

export async function runRepairAppUserAuthLinks(
  client: VpsApiClient,
  opts: RepairOptions = {},
): Promise<RepairAppUserAuthLinksReport> {
  const dryRun = opts.dryRun === true;
  const report = emptyReport(dryRun);

  const idFilter = opts.userIds?.length ? new Set(opts.userIds.map(String)) : null;
  const [records, authUsers] = await Promise.all([client.loadAllAppUsers(), client.listAuthUsers().catch(() => [])]);

  const diagnoseEmails = (opts.diagnoseEmails ?? [])
    .map((e) => normalizeEmail(e))
    .filter(Boolean);

  if (dryRun && diagnoseEmails.length > 0 && !idFilter) {
    const scoped = await runDiagnoseEmailsOnly(client, diagnoseEmails);
    report.totalAppUsers = scoped.catalogMeta.recordsLoaded;
    report.emailDiagnosis = scoped.emailDiagnosis;
    report.dryRun = true;
    return report;
  }

  const authByEmail = new Map<string, BackendUser>();
  for (const auth of authUsers) {
    const email = typeof auth.email === "string" ? normalizeEmail(auth.email) : "";
    if (email && auth.id != null) authByEmail.set(email, auth);
  }

  const byEmail = new Map<string, BackendRecord<AppUserRecordData>[]>();
  for (const record of records) {
    if (idFilter && !idFilter.has(String(record.id))) continue;
    report.totalAppUsers += 1;
    const email = getAppUserEmail(record);
    if (!email) {
      report.failed += 1;
      report.errors.push({ appUserId: String(record.id), email: "", reason: "E-posta yok" });
      continue;
    }
    byEmail.set(email, [...(byEmail.get(email) ?? []), record]);
  }

  report.uniqueEmails = byEmail.size;

  for (const [email, group] of byEmail.entries()) {
    if (group.length > 1) report.duplicatesDetected += 1;

    const primary = selectPrimaryAppUserRecord(group) ?? group[0];
    if (!primary) continue;

    const data = appUserDataFromRecord(primary);
    if (isDeletedOrInactive(data)) {
      report.skippedDeleted += 1;
      continue;
    }

    const computedEmail = getAppUserEmail(primary);
    const wouldNormalizeEmail = !normalizeEmail(data.email) && Boolean(computedEmail);

    if (authAlreadyLinked(data, email, authUsers)) {
      report.alreadyLinked += 1;
      continue;
    }

    const existingAuth = authByEmail.get(email) ?? null;

    if (dryRun) {
      if (wouldNormalizeEmail) report.emailNormalizedWouldUpdate += 1;
      if (existingAuth?.id) {
        report.authFoundWouldLink += 1;
      } else {
        report.authWouldCreate += 1;
      }
      continue;
    }

    let nextData: AppUserRecordData = { ...data };
    if (wouldNormalizeEmail) {
      nextData.email = computedEmail;
      nextData.loginEmail = nextData.loginEmail ?? computedEmail;
      nextData.generatedEmail = nextData.generatedEmail ?? computedEmail;
      report.emailNormalized += 1;
    }

    if (!nextData.isActive && !nextData.deletedAt) {
      nextData.isActive = true;
      nextData.status = "active";
    } else if (nextData.isActive !== false && !nextData.status) {
      nextData.isActive = true;
      nextData.status = "active";
    }

    let authUser = existingAuth;
    let createdNew = false;

    if (!authUser?.id) {
      const password = passwordForDistrict(nextData.district ?? nextData.province);
      const name = String(nextData.name ?? nextData.institutionName ?? email);
      const registered = await client.registerAuth(email, password, name);
      if (registered?.id) {
        authUser = registered;
        authByEmail.set(email, authUser);
        createdNew = true;
      } else {
        authUser =
          client.findAuthUserByEmail(authUsers, email) ?? client.findAuthUserByEmail([...authByEmail.values()], email);
        if (!authUser?.id) {
          const loginUser = await client.loginAuth(email, password);
          if (loginUser?.id) authUser = loginUser;
        }
        if (authUser?.id) authByEmail.set(email, authUser);
      }
    }

    if (!authUser?.id) {
      report.failed += 1;
      report.errors.push({ appUserId: String(primary.id), email, reason: "Auth kullanıcısı bulunamadı veya oluşturulamadı" });
      continue;
    }

    nextData = {
      ...nextData,
      email: computedEmail || nextData.email,
      loginEmail: nextData.loginEmail ?? computedEmail,
      generatedEmail: nextData.generatedEmail ?? computedEmail,
      authUserId: String(authUser.id),
      name: nextData.name ?? (typeof authUser.name === "string" ? authUser.name : email),
      updatedAt: new Date().toISOString(),
    };

    try {
      await client.updateAppUser(primary.id, nextData);
      if (createdNew) report.authCreatedAndLinked += 1;
      else report.authFoundAndLinked += 1;
    } catch (error) {
      report.failed += 1;
      report.ok = false;
      report.errors.push({
        appUserId: String(primary.id),
        email,
        reason: error instanceof Error ? error.message : "Kayıt güncellenemedi",
      });
    }
  }

  if (dryRun) {
    report.summary = buildDryRunSummary(records, authUsers, {
      authFoundWouldLink: report.authFoundWouldLink,
      authWouldCreate: report.authWouldCreate,
      duplicatesDetected: report.duplicatesDetected,
      skippedDeleted: report.skippedDeleted,
      alreadyLinked: report.alreadyLinked,
    });
    if (diagnoseEmails.length) {
      const rows: RepairEmailDiagnosis[] = [];
      for (const email of diagnoseEmails) {
        const group = records.filter((r) => getAppUserEmail(r) === email);
        const primary = group[0] ?? null;
        const data = primary ? appUserDataFromRecord(primary) : null;
        const authResolution = await resolveAuthUserForDiagnosis(client, email, {
          district: data?.district,
          province: data?.province,
          appUserRecordExists: Boolean(primary),
        });
        rows.push(diagnoseRepairEmail(email, records, authResolution.user, authResolution.meta));
      }
      report.emailDiagnosis = rows;
    }
    console.log("[TEDRIS_REPAIR_DRY_RUN]", {
      dryRun: true,
      summary: report.summary,
      emailDiagnosis: report.emailDiagnosis,
    });
    for (const row of report.emailDiagnosis ?? []) {
      const foundIn =
        row.emailFields.computed != null
          ? "computed"
          : row.emailFields.dataEmail
            ? "data.email"
            : row.emailFields.loginEmail
              ? "data.loginEmail"
              : row.emailFields.generatedEmail
                ? "data.generatedEmail"
                : row.emailFields.topLevel
                  ? "topLevel.email"
                  : row.emailFields.username
                    ? "username"
                    : "none";
      console.log("[TEDRIS_REPAIR_EMAIL_DIAG_LINE]", {
        email: row.email,
        category: row.category,
        diagnosticTags: row.diagnosticTags,
        authUserId: row.authUserId,
        appUserId: row.appUserId,
        recordUserId: row.recordUserId,
        recordOwnerMatchesAuth: row.recordOwnerMatchesAuth,
        appUserFoundInEmailField: foundIn,
        authUserExists: row.authUserExists,
        authUserIdOnRecord: row.authUserIdOnRecord,
        authUserIdMatchesAuth: row.authUserIdMatchesAuth,
        institutionCode: row.institutionCode,
        institutionName: row.institutionName,
        district: row.district,
        province: row.province,
        status: row.status,
        isActive: row.isActive,
        deletedAt: row.deletedAt,
        duplicateAppUserIds: row.duplicateAppUserIds,
        adminCatalogCandidatesByEmail: row.adminCatalogCandidatesByEmail,
        adminCatalogCandidatesByAuthId: row.adminCatalogCandidatesByAuthId,
      });
    }
  }

  return report;
}

export function createVpsClientFromEnv(bearerToken?: string): VpsApiClient {
  const baseUrl = process.env.VPS_API_BASE_URL ?? "";
  const projectKey = process.env.VPS_PROJECT_API_KEY ?? "";
  if (!baseUrl || !projectKey) {
    throw new Error("VPS_API_BASE_URL ve VPS_PROJECT_API_KEY tanımlı olmalı.");
  }
  return new VpsApiClient(baseUrl, projectKey, bearerToken);
}

export async function assertAdminCaller(client: VpsApiClient, adminEmail?: string): Promise<void> {
  const configuredAdmin = (adminEmail || process.env.ADMIN_EMAIL || "").trim().toLocaleLowerCase("tr-TR");
  const token = client.getBearerToken();

  let mePayload: unknown = null;
  try {
    mePayload = await client.me();
  } catch {
    mePayload = null;
  }

  let user = resolveAdminUser(mePayload, token);
  if (!user?.id && !user?.email) {
    user = userFromJwtPayload(token);
  }

  const hasIdentity = user?.id != null || Boolean(user?.email);
  if (!hasIdentity) {
    throw new Error("401 Oturum doğrulanamadı.");
  }

  if (!isAdminUser(user!, configuredAdmin)) {
    throw new Error("403 Bu işlem için admin yetkisi gerekir.");
  }
}

export function parseDryRunFlag(query: Record<string, string | string[] | undefined>, body?: unknown): boolean {
  const q = query.dryRun ?? query.dryrun;
  const qVal = Array.isArray(q) ? q[0] : q;
  if (qVal === "true" || qVal === "1") return true;
  const b = body as { dryRun?: boolean | string; dryrun?: boolean | string; diagnoseEmails?: string[] } | undefined;
  if (b?.dryRun === true || b?.dryrun === true || b?.dryRun === "true" || b?.dryrun === "true") return true;
  if (Array.isArray(b?.diagnoseEmails) && b.diagnoseEmails.length > 0) return true;
  return false;
}

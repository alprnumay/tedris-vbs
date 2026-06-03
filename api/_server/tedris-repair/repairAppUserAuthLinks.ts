import {
  appUserDataFromRecord,
  getAppUserEmail,
  isDeletedOrInactive,
  normalizeEmail,
  selectPrimaryAppUserRecord,
} from "./email";
import type { AppUserRecordData, BackendRecord, BackendUser, RepairAppUserAuthLinksReport, RepairOptions } from "./types";
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

export async function runRepairAppUserAuthLinks(
  client: VpsApiClient,
  opts: RepairOptions = {},
): Promise<RepairAppUserAuthLinksReport> {
  const dryRun = opts.dryRun === true;
  const report = emptyReport(dryRun);

  const idFilter = opts.userIds?.length ? new Set(opts.userIds.map(String)) : null;
  const [records, authUsers] = await Promise.all([client.loadAllAppUsers(), client.listAuthUsers().catch(() => [])]);

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
  const me = await client.me();
  const user = me.user;
  if (!user?.id) throw new Error("401 Oturum doğrulanamadı.");
  const email = typeof user.email === "string" ? user.email.trim().toLocaleLowerCase("tr-TR") : "";
  const role = String(user.role ?? "").trim().toLowerCase();
  const configuredAdmin = (adminEmail || process.env.ADMIN_EMAIL || "").trim().toLocaleLowerCase("tr-TR");
  const isAdmin =
    Boolean(user.isAdmin) || role === "admin" || role === "super_admin" || (configuredAdmin && email === configuredAdmin);
  if (!isAdmin) throw new Error("403 Bu işlem için admin yetkisi gerekir.");
}

export function parseDryRunFlag(query: Record<string, string | string[] | undefined>, body?: unknown): boolean {
  const q = query.dryRun ?? query.dryrun;
  const qVal = Array.isArray(q) ? q[0] : q;
  if (qVal === "true" || qVal === "1") return true;
  const b = body as { dryRun?: boolean; dryrun?: boolean } | undefined;
  return b?.dryRun === true || b?.dryrun === true;
}

import {
  appUserDataFromRecord,
  getAppUserEmail,
  isDeletedOrInactive,
  normalizeEmail,
  selectPrimaryAppUserRecord,
} from "./email";
import type { AuthLookupMeta } from "./authLookup";
import type {
  AppUserRecordData,
  BackendRecord,
  BackendUser,
  RepairDiagnosticTag,
  RepairEmailDiagnosis,
  RepairEmailCategory,
  RepairDryRunSummary,
} from "./types";

function recordOwnerId(record: BackendRecord<AppUserRecordData>): string | null {
  const raw = record as BackendRecord<AppUserRecordData> & AppUserRecordData & { payload?: AppUserRecordData };
  const nested = raw.data ?? raw.payload ?? {};
  const nestedOwner = (nested as { userId?: string | number }).userId;
  const id = record.userId ?? nestedOwner ?? (raw as { userId?: string | number }).userId;
  return id != null && String(id).trim() !== "" ? String(id) : null;
}

function buildDiagnosticTags(
  normalized: string,
  group: BackendRecord<AppUserRecordData>[],
  authUserId: string | null,
  primary: BackendRecord<AppUserRecordData> | null,
  recordAuthId: string | null,
): RepairDiagnosticTag[] {
  const tags: RepairDiagnosticTag[] = [];
  if (!group.length) {
    tags.push("appUserMissing");
    return tags;
  }
  if (group.length > 1) tags.push("duplicateEmail");
  if (!primary) return tags;

  const data = appUserDataFromRecord(primary);
  if (isDeletedOrInactive(data)) tags.push("inactiveDeleted");

  const ownerId = recordOwnerId(primary);
  if (authUserId && ownerId && ownerId !== authUserId) tags.push("appUserOwnerMismatch");
  if (authUserId && recordAuthId && recordAuthId !== authUserId) tags.push("authUserIdMismatch");
  if (authUserId && (!recordAuthId || recordAuthId !== authUserId)) tags.push("authFoundWouldLink");

  return [...new Set(tags)];
}

function emailFieldsFromRecord(record: BackendRecord<AppUserRecordData>) {
  const raw = record as AppUserRecordData & BackendRecord<AppUserRecordData> & { payload?: AppUserRecordData };
  const nested = raw.data ?? raw.payload ?? {};
  return {
    topLevel: (raw.email as string | undefined) ?? null,
    dataEmail: (nested.email as string | undefined) ?? null,
    loginEmail: (nested.loginEmail as string | undefined) ?? (raw.loginEmail as string | undefined) ?? null,
    generatedEmail: (nested.generatedEmail as string | undefined) ?? (raw.generatedEmail as string | undefined) ?? null,
    username: (nested.username as string | undefined) ?? (raw.username as string | undefined) ?? null,
    computed: getAppUserEmail(record) || null,
  };
}

function isLoginReady(record: BackendRecord<AppUserRecordData>, authUsers: BackendUser[]): boolean {
  const data = appUserDataFromRecord(record);
  if (isDeletedOrInactive(data)) return false;
  const email = getAppUserEmail(record);
  if (!email) return false;
  if (!data.institutionCode) return false;
  const authId = data.authUserId ? String(data.authUserId) : "";
  if (!authId) return false;
  const auth = authUsers.find((a) => String(a.id) === authId);
  if (!auth) return false;
  const authEmail = typeof auth.email === "string" ? normalizeEmail(auth.email) : "";
  return authEmail === email;
}

export function buildDryRunSummary(
  records: BackendRecord<AppUserRecordData>[],
  authUsers: BackendUser[],
  counters: {
    authFoundWouldLink: number;
    authWouldCreate: number;
    duplicatesDetected: number;
    skippedDeleted: number;
    alreadyLinked: number;
  },
): RepairDryRunSummary {
  let activeAppUsers = 0;
  let missingTopLevelEmail = 0;
  let missingAnyEmail = 0;
  let missingAuthUserId = 0;
  let institutionMissing = 0;
  let loginReadyUsers = 0;

  for (const record of records) {
    const data = appUserDataFromRecord(record);
    const fields = emailFieldsFromRecord(record);
    const computed = fields.computed ?? "";

    if (!isDeletedOrInactive(data)) activeAppUsers += 1;
    if (!normalizeEmail(data.email)) missingTopLevelEmail += 1;
    if (!computed) missingAnyEmail += 1;
    if (!data.authUserId) missingAuthUserId += 1;
    if (!isDeletedOrInactive(data) && !data.institutionCode) institutionMissing += 1;
    if (isLoginReady(record, authUsers)) loginReadyUsers += 1;
  }

  const loginBlockedUsers = Math.max(0, activeAppUsers - loginReadyUsers);

  return {
    totalAppUsers: records.length,
    totalAuthUsers: authUsers.length,
    activeAppUsers,
    missingTopLevelEmail,
    missingAnyEmail,
    missingAuthUserId,
    authFoundWouldLink: counters.authFoundWouldLink,
    authWouldCreate: counters.authWouldCreate,
    duplicateEmails: counters.duplicatesDetected,
    institutionMissing,
    inactiveOrDeleted: counters.skippedDeleted,
    loginReadyUsers,
    loginBlockedUsers,
    alreadyLinked: counters.alreadyLinked,
  };
}

function resolveEmailCategory(
  email: string,
  group: BackendRecord<AppUserRecordData>[],
  authUser: BackendUser | null,
  primary: BackendRecord<AppUserRecordData> | null,
  authLookup: AuthLookupMeta,
): RepairEmailCategory {
  if (!group.length) {
    if (authUser?.id && authLookup.trustedForAuthIdentity) return "appUserMissing";
    if (authUser?.id) return "authExistsButNotResolved";
    return authLookup.trustedForAuthIdentity ? "failed" : "authLookupUnavailable";
  }
  if (group.length > 1) return "duplicateEmails";
  if (!primary) return "failed";
  const data = appUserDataFromRecord(primary);
  if (isDeletedOrInactive(data)) return "inactiveOrDeleted";
  const computed = getAppUserEmail(primary);
  if (!computed) return "missingEmail";

  const authId = authUser?.id != null ? String(authUser.id) : null;
  const recordAuthId = data.authUserId ? String(data.authUserId) : null;

  if (!authLookup.trustedForAuthIdentity || !authId) {
    return "authExistsButNotResolved";
  }

  if (recordAuthId && recordAuthId === authId) {
    const authEmail = typeof authUser?.email === "string" ? normalizeEmail(authUser.email) : "";
    if (authEmail === email) return "alreadyLinked";
  }

  if (!recordAuthId || recordAuthId !== authId) return "authFoundWouldLink";

  return "failed";
}

export function diagnoseRepairEmail(
  email: string,
  records: BackendRecord<AppUserRecordData>[],
  authUser: BackendUser | null,
  authLookup: AuthLookupMeta,
): RepairEmailDiagnosis {
  const normalized = normalizeEmail(email);
  const authUserId =
    authUser?.id != null && authLookup.trustedForAuthIdentity ? String(authUser.id) : null;

  const group = records.filter((record) => {
    const computed = getAppUserEmail(record);
    if (computed === normalized) return true;
    if (authUserId && String(record.data?.authUserId ?? "") === authUserId) return true;
    return false;
  });

  const byEmailOnly = records.filter((r) => getAppUserEmail(r) === normalized);
  const byAuthIdOnly = authUserId
    ? records.filter((r) => String(r.data?.authUserId ?? "") === authUserId)
    : [];

  const primary = selectPrimaryAppUserRecord(group, authUserId ?? undefined) ?? group[0] ?? null;
  const data = primary ? appUserDataFromRecord(primary) : null;
  const fields = primary ? emailFieldsFromRecord(primary) : emailFieldsFromRecord({ id: "", data: {} });
  const recordAuthId = data?.authUserId ? String(data.authUserId) : null;
  const category = resolveEmailCategory(normalized, group, authUser, primary, authLookup);
  const recordUserId = primary ? recordOwnerId(primary) : null;
  const diagnosticTags = buildDiagnosticTags(normalized, group, authUserId, primary, recordAuthId);
  const expectedAuthUserId = authUserId;
  const ownerMismatch = Boolean(expectedAuthUserId && recordUserId && recordUserId !== expectedAuthUserId);
  const authLinkMissing = Boolean(primary && !recordAuthId);

  return {
    email: normalized,
    category,
    authUserId,
    authUserExists: Boolean(authUserId),
    expectedAuthUserId,
    ownerMismatch,
    authLinkMissing,
    authLookup: {
      source: authLookup.source,
      catalogKind: authLookup.catalogKind,
      trustedForAuthIdentity: authLookup.trustedForAuthIdentity,
      resolvedVia: authLookup.resolvedVia,
      loginProbeUsed: authLookup.loginProbeUsed,
      loginProbeSideEffects: authLookup.loginProbeSideEffects,
      listUserCount: authLookup.listUserCount,
      attempts: authLookup.attempts,
    },
    appUserId: primary ? String(primary.id) : null,
    recordUserId,
    recordOwnerMatchesAuth: Boolean(authUserId && recordUserId && recordUserId === authUserId),
    institutionName: data?.institutionName ?? null,
    diagnosticTags,
    emailFields: fields,
    authUserIdOnRecord: recordAuthId,
    authUserIdMatchesAuth: Boolean(authUserId && recordAuthId && recordAuthId === authUserId),
    institutionCode: data?.institutionCode ?? null,
    district: data?.district ?? null,
    province: data?.province ?? null,
    status: data?.status ?? null,
    isActive: data?.isActive ?? null,
    deletedAt: data?.deletedAt ?? null,
    duplicateAppUserIds: group.length > 1 ? group.map((r) => String(r.id)) : [],
    adminCatalogCandidatesByEmail: byEmailOnly.length,
    adminCatalogCandidatesByAuthId: byAuthIdOnly.length,
    loginScopedRecordsNote:
      "Yurt JWT ile GET /records?record_type=app_user yalnızca sahibine ait kayıtları döndürür; admin katalogda kayıt olsa bile login anında ownedCount 0 olabilir. authUserId bağlama tek başına yetmeyebilir — recordUserId (owner) auth id ile eşleşmelidir.",
  };
}

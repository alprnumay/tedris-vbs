/**
 * Auth ↔ app_user ↔ institution veri bütünlüğü onarımı ve login eşleştirmesi.
 */
import { backendApi, type BackendRecord, type BackendUser } from "./backendApi";

export interface AppUserRecordData {
  id?: string;
  authUserId?: string;
  email?: string;
  loginEmail?: string;
  generatedEmail?: string;
  username?: string;
  name?: string;
  role?: string;
  isAdmin?: boolean;
  isActive?: boolean;
  status?: string;
  district?: string | null;
  province?: string | null;
  institutionName?: string | null;
  institutionCode?: string | null;
  institutionId?: string | null;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string | null;
  passwordResetAt?: string | null;
}

type AppUserRecordLike = BackendRecord<AppUserRecordData> & AppUserRecordData & {
  payload?: AppUserRecordData;
  data?: AppUserRecordData;
};

export interface ReconcileAppUsersResult {
  ok: boolean;
  scanned: number;
  emailsRepaired: number;
  statusRepaired: number;
  authUserIdLinked: number;
  ownershipTransferred: number;
  authUsersCreated: number;
  duplicates: { email: string; ids: string[]; canonicalId: string }[];
  orphanAuthOnly: string[];
  orphanAppOnly: string[];
  errors: { id: string; email: string; reason: string }[];
}

export interface AuthLoginLike {
  id: string;
  email: string;
  name: string;
}

export type AppUserEmailSource = AppUserRecordLike | AppUserRecordData | BackendRecord<AppUserRecordData>;

export function normalizeEmail(value?: string | null): string {
  return (value ?? "").trim().toLocaleLowerCase("tr-TR");
}

export function getAppUserEmail(source: AppUserEmailSource): string {
  const raw = source as AppUserRecordLike;
  const nested = raw.data ?? raw.payload ?? {};
  for (const value of [
    raw.email,
    raw.loginEmail,
    raw.generatedEmail,
    raw.username,
    nested.email,
    nested.loginEmail,
    nested.generatedEmail,
    nested.username,
  ]) {
    const normalized = normalizeEmail(value);
    if (normalized) return normalized;
  }
  return "";
}

export function appUserDataFromRecord(record: BackendRecord<AppUserRecordData>): AppUserRecordData {
  const raw = record as AppUserRecordLike;
  const payload = raw.payload ?? {};
  const data = raw.data ?? {};
  const merged = { ...payload, ...raw, ...data, id: data.id ?? raw.id };
  const email = getAppUserEmail(record);
  return {
    ...merged,
    email: email || merged.email,
    loginEmail: merged.loginEmail ?? (email || undefined),
    generatedEmail: merged.generatedEmail ?? (email || undefined),
  };
}

function isDeletedOrInactive(data: AppUserRecordData): boolean {
  const status = String(data.status ?? "").trim().toLocaleLowerCase("tr-TR");
  return Boolean(data.deletedAt || data.isActive === false || status === "inactive" || status === "deleted");
}

export function buildCanonicalAppUserData(
  record: BackendRecord<AppUserRecordData>,
  authUser?: AuthLoginLike | null,
): AppUserRecordData {
  const data = appUserDataFromRecord(record);
  const canonicalEmail = getAppUserEmail(record) || normalizeEmail(authUser?.email);
  const now = new Date().toISOString();
  const deleted = isDeletedOrInactive(data);
  return {
    ...data,
    email: canonicalEmail || data.email,
    loginEmail: data.loginEmail ?? canonicalEmail ?? data.email,
    generatedEmail: data.generatedEmail ?? canonicalEmail ?? data.email,
    authUserId: data.authUserId ?? authUser?.id,
    name: data.name ?? authUser?.name,
    isActive: deleted ? data.isActive : data.isActive ?? true,
    status: deleted ? data.status : data.status ?? (data.isActive === false ? "inactive" : "active"),
    updatedAt: now,
  };
}

export function recordMatchesAppUserEmail(
  record: BackendRecord<AppUserRecordData>,
  normalizedEmail: string,
  authUserId?: string,
): boolean {
  if (!normalizedEmail && !authUserId) return false;
  const computed = getAppUserEmail(record);
  if (normalizedEmail && computed === normalizedEmail) return true;
  if (authUserId && String(record.data?.authUserId ?? "") === authUserId) return true;
  return false;
}

export function mergeRecordsById<T>(...groups: BackendRecord<T>[][]): BackendRecord<T>[] {
  const byId = new Map<string, BackendRecord<T>>();
  for (const group of groups) {
    for (const record of group) {
      byId.set(String(record.id), record);
    }
  }
  return [...byId.values()];
}

export async function loadAllAppUserCatalog(): Promise<BackendRecord<AppUserRecordData>[]> {
  const owned = await backendApi.fetchAllRecords<AppUserRecordData>("app_user").catch(() => []);
  const adminScoped = await backendApi.fetchAllAdminRecords<AppUserRecordData>("app_user").catch(() => []);
  return mergeRecordsById(owned, adminScoped);
}

export async function findAuthUserByEmail(
  email: string,
  authUsers?: BackendUser[],
): Promise<BackendUser | null> {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  const list = authUsers ?? (await backendApi.listAuthUsers().catch(() => [] as BackendUser[]));
  return list.find((u) => normalizeEmail(typeof u.email === "string" ? u.email : "") === normalized) ?? null;
}

export function appUserMatchScoreFromData(
  data: AppUserRecordData,
  record: BackendRecord<AppUserRecordData>,
  authUserId?: string,
): number {
  let score = 0;
  if (!isDeletedOrInactive(data)) score += 10_000;
  if (data.institutionCode) score += 2_000;
  if (!data.deletedAt) score += 1_000;
  if (data.authUserId) score += 500;
  if (authUserId && String(data.authUserId) === authUserId) score += 250;
  if (data.institutionName) score += 40;
  if (data.district) score += 40;
  if (data.province) score += 20;
  return score + (Date.parse(data.updatedAt ?? data.createdAt ?? record.updatedAt ?? "") || 0) / 1e15;
}

export function selectCanonicalAppUserRecord(
  records: BackendRecord<AppUserRecordData>[],
  authUserId?: string,
): BackendRecord<AppUserRecordData> | null {
  return records
    .slice()
    .sort(
      (a, b) =>
        appUserMatchScoreFromData(appUserDataFromRecord(b), b, authUserId) -
        appUserMatchScoreFromData(appUserDataFromRecord(a), a, authUserId),
    )[0] ?? null;
}

/** Login: yalnızca oturum sahibinin görebildiği kayıtlar; admin onarım yok. */
export async function findAppUserRecordsForLoginReadOnly(
  authUser: AuthLoginLike,
): Promise<BackendRecord<AppUserRecordData>[]> {
  const normalized = normalizeEmail(authUser.email);
  const owned = await backendApi.fetchAllRecords<AppUserRecordData>("app_user", { maxPages: 15 }).catch(() => []);
  const matches = owned.filter((record) => recordMatchesAppUserEmail(record, normalized, authUser.id));
  console.log("[TEDRIS_LOGIN_LOOKUP_SOURCE]", {
    loginEmail: normalized,
    ownedCount: owned.length,
    matchCount: matches.length,
    mode: "read_only_owned",
  });
  return matches;
}

export interface ReconcileDeps {
  updateAppUserRecord: (id: string | number, data: AppUserRecordData) => Promise<BackendRecord<AppUserRecordData>>;
  registerAuthUser: (data: { email: string; password: string; name: string }) => Promise<{ user?: BackendUser } | null>;
  defaultPassword: string;
}

export async function reconcileAppUsersAndAuthUsers(deps: ReconcileDeps): Promise<ReconcileAppUsersResult> {
  const result: ReconcileAppUsersResult = {
    ok: true,
    scanned: 0,
    emailsRepaired: 0,
    statusRepaired: 0,
    authUserIdLinked: 0,
    ownershipTransferred: 0,
    authUsersCreated: 0,
    duplicates: [],
    orphanAuthOnly: [],
    orphanAppOnly: [],
    errors: [],
  };

  const [records, authUsers] = await Promise.all([
    loadAllAppUserCatalog(),
    backendApi.listAuthUsers().catch(() => [] as BackendUser[]),
  ]);

  const authByEmail = new Map<string, BackendUser>();
  for (const auth of authUsers) {
    const email = normalizeEmail(typeof auth.email === "string" ? auth.email : "");
    if (email && auth.id != null) authByEmail.set(email, auth);
  }

  const byEmail = new Map<string, BackendRecord<AppUserRecordData>[]>();
  for (const record of records) {
    result.scanned += 1;
    const email = getAppUserEmail(record);
    if (!email) {
      result.orphanAppOnly.push(String(record.id));
      continue;
    }
    byEmail.set(email, [...(byEmail.get(email) ?? []), record]);
  }

  for (const auth of authUsers) {
    const email = normalizeEmail(typeof auth.email === "string" ? auth.email : "");
    if (email && !byEmail.has(email)) result.orphanAuthOnly.push(email);
  }

  for (const [email, group] of byEmail.entries()) {
    if (group.length > 1) {
      const canonical = selectCanonicalAppUserRecord(group);
      result.duplicates.push({
        email,
        ids: group.map((r) => String(r.id)),
        canonicalId: canonical ? String(canonical.id) : String(group[0]?.id ?? ""),
      });
    }

    const auth = authByEmail.get(email);
    const canonicalRecord = selectCanonicalAppUserRecord(group, auth?.id != null ? String(auth.id) : undefined) ?? group[0];
    if (!canonicalRecord) continue;

    const data = appUserDataFromRecord(canonicalRecord);
    const deleted = isDeletedOrInactive(data);
    const authLogin: AuthLoginLike | null = auth
      ? { id: String(auth.id), email, name: String(auth.name ?? auth.email ?? email) }
      : null;

    let nextData = buildCanonicalAppUserData(canonicalRecord, authLogin ?? undefined);

    if (!normalizeEmail(data.email) && getAppUserEmail(canonicalRecord)) {
      result.emailsRepaired += 1;
    }

    if (!deleted && (data.isActive === undefined || !data.status)) {
      result.statusRepaired += 1;
      nextData = { ...nextData, isActive: true, status: "active" };
    }

    if (auth?.id && String(nextData.authUserId ?? "") !== String(auth.id)) {
      nextData.authUserId = String(auth.id);
      result.authUserIdLinked += 1;
    }

    if (!auth && !deleted) {
      const existingAuth = authByEmail.get(email);
      if (existingAuth?.id) {
        nextData.authUserId = String(existingAuth.id);
        result.authUserIdLinked += 1;
      } else {
        try {
          const created = await deps.registerAuthUser({
            email,
            password: deps.defaultPassword,
            name: String(nextData.name ?? email),
          });
          const createdId = created?.user?.id;
          if (createdId) {
            nextData.authUserId = String(createdId);
            authByEmail.set(email, created.user as BackendUser);
            result.authUsersCreated += 1;
            result.authUserIdLinked += 1;
          } else {
            const fallback = await findAuthUserByEmail(email, authUsers);
            if (fallback?.id) {
              nextData.authUserId = String(fallback.id);
              authByEmail.set(email, fallback);
              result.authUserIdLinked += 1;
            } else {
              result.orphanAppOnly.push(email);
            }
          }
        } catch (error) {
          const fallback = await findAuthUserByEmail(email, authUsers);
          if (fallback?.id) {
            nextData.authUserId = String(fallback.id);
            authByEmail.set(email, fallback);
            result.authUserIdLinked += 1;
          } else {
            result.errors.push({
              id: String(canonicalRecord.id),
              email,
              reason: error instanceof Error ? error.message : "Auth oluşturulamadı",
            });
          }
        }
      }
    }

    const targetOwner = nextData.authUserId;
    if (targetOwner && String(canonicalRecord.userId ?? "") !== String(targetOwner)) {
      try {
        await backendApi.assignRecordOwner(canonicalRecord.id, targetOwner, { recordType: "app_user", data: nextData });
        result.ownershipTransferred += 1;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        if (msg.includes("403") || msg.toLowerCase().includes("forbidden")) {
          result.errors.push({
            id: String(canonicalRecord.id),
            email,
            reason: "admin_records_forbidden",
          });
        } else {
          try {
            await deps.updateAppUserRecord(canonicalRecord.id, nextData);
            result.ownershipTransferred += 1;
          } catch (inner) {
            result.errors.push({
              id: String(canonicalRecord.id),
              email,
              reason: inner instanceof Error ? inner.message : "Sahiplik devredilemedi",
            });
          }
        }
      }
    } else {
      try {
        await deps.updateAppUserRecord(canonicalRecord.id, nextData);
      } catch (error) {
        result.errors.push({
          id: String(canonicalRecord.id),
          email,
          reason: error instanceof Error ? error.message : "Kayıt güncellenemedi",
        });
      }
    }
  }

  console.log("[TEDRIS_RECONCILE_RESULT]", result);
  return result;
}

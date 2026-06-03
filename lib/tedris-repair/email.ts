import type { AppUserRecordData, BackendRecord } from "./types";

type AppUserEmailSource = BackendRecord<AppUserRecordData> | AppUserRecordData;

export function normalizeEmail(value?: string | null): string {
  return (value ?? "").trim().toLocaleLowerCase("tr-TR");
}

export function getAppUserEmail(source: AppUserEmailSource): string {
  const raw = source as AppUserRecordData & BackendRecord<AppUserRecordData> & { payload?: AppUserRecordData };
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
  const raw = record as AppUserRecordData & BackendRecord<AppUserRecordData> & { payload?: AppUserRecordData };
  const payload = raw.payload ?? {};
  const data = raw.data ?? {};
  const merged = { ...payload, ...raw, ...data, id: data.id ?? String(raw.id) };
  const email = getAppUserEmail(record);
  return {
    ...merged,
    email: email || merged.email,
    loginEmail: merged.loginEmail ?? (email || undefined),
    generatedEmail: merged.generatedEmail ?? (email || undefined),
  };
}

export function isDeletedOrInactive(data: AppUserRecordData): boolean {
  const status = String(data.status ?? "").trim().toLocaleLowerCase("tr-TR");
  return Boolean(data.deletedAt || data.isActive === false || status === "inactive" || status === "deleted");
}

export function appUserMatchScore(data: AppUserRecordData, authUserId?: string): number {
  let score = 0;
  if (!isDeletedOrInactive(data)) score += 10_000;
  if (data.institutionCode) score += 2_000;
  if (!data.deletedAt) score += 1_000;
  if (data.authUserId) score += 500;
  if (authUserId && String(data.authUserId) === authUserId) score += 250;
  if (data.institutionName) score += 40;
  if (data.district) score += 40;
  if (data.province) score += 20;
  return score + (Date.parse(data.updatedAt ?? data.createdAt ?? "") || 0) / 1e15;
}

export function selectPrimaryAppUserRecord(
  records: BackendRecord<AppUserRecordData>[],
  authUserId?: string,
): BackendRecord<AppUserRecordData> | null {
  return records
    .slice()
    .sort(
      (a, b) =>
        appUserMatchScore(appUserDataFromRecord(b), authUserId) -
        appUserMatchScore(appUserDataFromRecord(a), authUserId),
    )[0] ?? null;
}

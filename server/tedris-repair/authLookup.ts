import { getAppUserEmail, normalizeEmail } from "./email";
import type { BackendUser } from "./types";
import { passwordForDistrict, VpsApiClient } from "./vpsClient";

export type AuthCatalogKind = "auth" | "app_user" | "mixed" | "empty" | "unknown";

export interface AuthLookupAttempt {
  endpoint: string;
  ok: boolean;
  status?: number;
  userCount?: number;
  error?: string;
  note?: string;
}

export interface AuthLookupMeta {
  source: string;
  catalogKind: AuthCatalogKind;
  /** true yalnızca auth kimlik kataloğu veya login_probe ile id doğrulandığında */
  trustedForAuthIdentity: boolean;
  resolvedVia: "admin_users_list" | "admin_users_search" | "login_probe" | "none";
  loginProbeUsed: boolean;
  loginProbeSideEffects: string[];
  attempts: AuthLookupAttempt[];
  listUserCount: number;
}

export interface AuthResolution {
  user: BackendUser | null;
  meta: AuthLookupMeta;
}

function emptyMeta(): AuthLookupMeta {
  return {
    source: "GET /admin/users",
    catalogKind: "empty",
    trustedForAuthIdentity: false,
    resolvedVia: "none",
    loginProbeUsed: false,
    loginProbeSideEffects: [],
    attempts: [],
    listUserCount: 0,
  };
}

function userEmail(u: BackendUser): string {
  const raw = u as BackendUser & { data?: { email?: string } };
  return normalizeEmail(
    typeof raw.email === "string"
      ? raw.email
      : typeof raw.data?.email === "string"
        ? raw.data.email
        : getAppUserEmail(raw as Parameters<typeof getAppUserEmail>[0]),
  );
}

function userLooksLikeAppUserRecord(u: BackendUser): boolean {
  const raw = u as BackendUser & {
    recordType?: string;
    record_type?: string;
    data?: { institutionCode?: string; institutionName?: string };
    institutionCode?: string;
    institutionName?: string;
  };
  const data = raw.data ?? {};
  if (raw.recordType === "app_user" || raw.record_type === "app_user") return true;
  if (data.institutionCode || data.institutionName || raw.institutionCode || raw.institutionName) return true;
  return false;
}

export function detectAuthCatalogKind(users: BackendUser[]): AuthCatalogKind {
  if (!users.length) return "empty";
  const appLike = users.filter(userLooksLikeAppUserRecord).length;
  if (appLike === 0) return "auth";
  if (appLike >= users.length * 0.5) return "app_user";
  return "mixed";
}

export function findAuthUserInList(users: BackendUser[], email: string, catalogKind: AuthCatalogKind): BackendUser | null {
  const normalized = normalizeEmail(email);
  if (!normalized || catalogKind === "app_user") return null;
  return users.find((u) => userEmail(u) === normalized) ?? null;
}

function loginProbePasswords(district?: string | null, province?: string | null): string[] {
  const out: string[] = [];
  for (const part of [district, province]) {
    const pw = passwordForDistrict(part);
    if (pw && !out.includes(pw)) out.push(pw);
  }
  if (!out.includes("tedris2026")) out.push("tedris2026");
  return out;
}

export async function resolveAuthUserForDiagnosis(
  client: VpsApiClient,
  email: string,
  opts?: { district?: string | null; province?: string | null; appUserRecordExists?: boolean },
): Promise<AuthResolution> {
  const meta = emptyMeta();
  const normalized = normalizeEmail(email);
  if (!normalized) return { user: null, meta };

  const listResult = await client.fetchAdminUsersCatalog();
  meta.attempts.push({
    endpoint: "GET /admin/users",
    ok: listResult.ok,
    status: listResult.status,
    userCount: listResult.users.length,
    error: listResult.error,
  });
  meta.listUserCount = listResult.users.length;
  meta.catalogKind = detectAuthCatalogKind(listResult.users);

  if (listResult.ok && meta.catalogKind !== "app_user") {
    const fromList = findAuthUserInList(listResult.users, normalized, meta.catalogKind);
    if (fromList?.id != null) {
      meta.trustedForAuthIdentity = true;
      meta.resolvedVia = "admin_users_list";
      meta.source = "GET /admin/users";
      return { user: fromList, meta };
    }
  }

  if (listResult.ok) {
    const searchResult = await client.fetchAdminUsersCatalog(normalized);
    meta.attempts.push({
      endpoint: `GET /admin/users?search=${encodeURIComponent(normalized)}`,
      ok: searchResult.ok,
      status: searchResult.status,
      userCount: searchResult.users.length,
      error: searchResult.error,
      note: meta.catalogKind === "app_user" ? "catalog_is_app_user_records_not_auth" : undefined,
    });
    const searchKind = detectAuthCatalogKind(searchResult.users);
    if (searchResult.ok && searchKind !== "app_user") {
      const fromSearch = findAuthUserInList(searchResult.users, normalized, searchKind);
      if (fromSearch?.id != null) {
        meta.trustedForAuthIdentity = true;
        meta.resolvedVia = "admin_users_search";
        meta.source = meta.attempts[meta.attempts.length - 1].endpoint;
        return { user: fromSearch, meta };
      }
    }
  }

  if (opts?.appUserRecordExists !== false) {
    const passwords = loginProbePasswords(opts?.district, opts?.province);
    for (const password of passwords) {
      const probe = await client.probeAuthLogin(normalized, password);
      meta.attempts.push({
        endpoint: "POST /auth/login",
        ok: Boolean(probe.user?.id),
        note: "diagnosis_probe_restores_admin_bearer",
      });
      if (probe.user?.id != null) {
        meta.loginProbeUsed = true;
        meta.loginProbeSideEffects = [
          "POST /auth/login başarılı olursa VPS auth.lastLoginAt güncellenebilir; veri onarımı yapılmaz.",
        ];
        meta.trustedForAuthIdentity = true;
        meta.resolvedVia = "login_probe";
        meta.source = "POST /auth/login";
        return { user: probe.user, meta };
      }
    }
  }

  if (!listResult.ok) {
    meta.catalogKind = "unknown";
  } else if (meta.catalogKind === "app_user") {
    meta.source = "GET /admin/users (app_user catalog — auth id listesi değil)";
  }

  return { user: null, meta };
}

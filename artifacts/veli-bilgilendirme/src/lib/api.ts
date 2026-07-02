import { isLocalDevApi } from "./apiBase";
import { backendApi, clearBackendToken, getBackendToken, setBackendToken, type BackendRecord, type BackendUser } from "./backendApi";
import { kurumKoduOner } from "./kurumSlug";
import { normalizeRole } from "./admin/adminRol";
import { TRACKED_DISTRICTS } from "./admin/trackedDistricts";
import { epostaAlternatif, epostaUret, kurumKoduUret, sifreUret, VARSAYILAN_SIFRE } from "./admin/adminKullaniciUret";
import {
  findAppUserRecordsForLoginReadOnly,
  logLoginRecordsScopeDiag,
  findAuthUserByEmail as findAuthUserByEmailFromAuth,
  getAppUserEmail as getAppUserEmailFromSync,
  loadAllAppUserCatalog,
  type ReconcileAppUsersResult,
  type RepairAppUserAuthLinksResult,
} from "./appUserSync";
import {
  assertBackendRepairEndpointAllowed,
  isRepairEnabled,
  logRepairDisabled,
  rejectClientSideRepair,
  repairApiUrl,
  REPAIR_MAINTENANCE_MESSAGE,
} from "./repairPolicy";
import {
  getReportAccessForUser,
  isDistrictAllowedByReportAccess,
  kullaniciRaporGorebilirMi,
  kullaniciTamRaporYetkiliMi,
  reportScopeLabel,
} from "./admin/reportAccess";

export {
  getReportAccessForUser,
  kullaniciRaporGorebilirMi,
  kullaniciTamRaporYetkiliMi,
  reportScopeLabel,
};

const SESSION_TOKEN_KEY = "tedris_session_token";
const PRIMARY_ADMIN_EMAIL = "alprn0604@gmail.com";

/** localStorage engellense bile oturum için bellek yedegi */
let memorySessionToken: string | null = null;

function getStoredSessionToken(): string | null {
  if (memorySessionToken) return memorySessionToken;
  try {
    const fromStorage = localStorage.getItem(SESSION_TOKEN_KEY);
    if (fromStorage) memorySessionToken = fromStorage;
    return fromStorage;
  } catch {
    return memorySessionToken;
  }
}

function clearStoredSessionToken() {
  memorySessionToken = null;
  try {
    localStorage.removeItem(SESSION_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

let viewerAdminCache: boolean | null = null;

function clearAuthState() {
  clearStoredSessionToken();
  clearBackendToken();
  viewerAdminCache = null;
  try {
    sessionStorage.clear();
  } catch {
    /* ignore */
  }
}

export function kullaniciAdminMi(user: KullaniciBilgisi | null | undefined): boolean {
  return isVpsAdminUser(user);
}

function normalizeAuthUser(u: KullaniciBilgisi): KullaniciBilgisi {
  const isAdmin = kullaniciAdminMi(u);
  return {
    ...u,
    isAdmin,
    role: isAdmin
      ? u.role === "super_admin"
        ? "super_admin"
        : "admin"
      : u.role,
  };
}

function backendHataMesaji(error: unknown): string {
  const raw = error instanceof Error ? error.message : "login_failed";
  return raw.replace(/^\d+\s+/, "").trim() || "Giriş başarısız.";
}

function isVpsAdminUser(user: KullaniciBilgisi | null | undefined): boolean {
  if (!user) return false;
  if (user.email?.trim().toLocaleLowerCase("tr-TR") === PRIMARY_ADMIN_EMAIL) return true;
  const role = String(user.role ?? "").trim().toLowerCase();
  return Boolean(user.isAdmin) || role === "admin" || role === "super_admin";
}

async function resolveViewerUsesAdminRecords(): Promise<boolean> {
  if (viewerAdminCache != null) return viewerAdminCache;
  if (!getBackendToken()) {
    viewerAdminCache = false;
    return false;
  }
  const me = await backendApi.me().catch(() => null);
  const user = me ? kullaniciFromBackend(me.user ?? (me as BackendUser)) : null;
  viewerAdminCache = kullaniciTamRaporYetkiliMi(user);
  return viewerAdminCache;
}

function mergeRecordsById<T>(...groups: BackendRecord<T>[][]): BackendRecord<T>[] {
  const byId = new Map<string, BackendRecord<T>>();
  for (const group of groups) {
    for (const record of group) {
      byId.set(String(record.id), record);
    }
  }
  return [...byId.values()];
}

async function loadProjectRecords<T>(recordType: string): Promise<BackendRecord<T>[]> {
  if (!getBackendToken()) {
    throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yapın.");
  }
  return backendApi.fetchAllRecords<T>(recordType, { maxPages: 100 }).catch(() => [] as BackendRecord<T>[]);
}

async function adminRepairUsers(): Promise<ReconcileAppUsersResult | null> {
  rejectClientSideRepair("api.adminRepairUsers");
}

function appUserPasswordForAuth(data: AppUserRecordData): string {
  const district = String(data.district ?? data.province ?? "").trim();
  if (district) return sifreUret(district).sifre;
  return VARSAYILAN_SIFRE;
}

async function repairAppUserAuthLinks(opts?: {
  userIds?: string[];
  dryRun?: boolean;
}): Promise<RepairAppUserAuthLinksResult & Record<string, unknown>> {
  assertBackendRepairEndpointAllowed("api.repairAppUserAuthLinks");
  const dryRun = opts?.dryRun !== false;
  const token = getBackendToken();
  if (!token) throw new Error("Bu işlem için admin oturumu gerekiyor.");
  if (!(await resolveViewerUsesAdminRecords())) {
    throw new Error("Bu işlem için admin yetkisi gerekiyor.");
  }

  const res = await fetch(repairApiUrl({ dryRun }), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      ...(opts?.userIds?.length ? { userIds: opts.userIds } : {}),
      dryRun,
    }),
  });
  const text = await res.text();
  let data: Record<string, unknown> = {};
  try {
    data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    data = { error: text };
  }
  if (!res.ok) {
    const err = typeof data.error === "string" ? data.error : typeof data.message === "string" ? data.message : text;
    throw new Error(err || `Onarım başarısız (${res.status})`);
  }

  const errors = Array.isArray(data.errors)
    ? (data.errors as { appUserId?: string; id?: string; email?: string; reason?: string }[]).map((e) => ({
        id: String(e.appUserId ?? e.id ?? ""),
        email: String(e.email ?? ""),
        reason: String(e.reason ?? ""),
      }))
    : [];

  return {
    ok: data.ok !== false,
    source: "backend",
    dryRun: data.dryRun === true || dryRun,
    totalAppUsers: Number(data.totalAppUsers ?? 0),
    alreadyLinked: Number(data.alreadyLinked ?? 0),
    authFoundAndLinked: Number(data.authFoundAndLinked ?? 0),
    authFoundWouldLink: Number(data.authFoundWouldLink ?? 0),
    authCreatedAndLinked: Number(data.authCreatedAndLinked ?? 0),
    authWouldCreate: Number(data.authWouldCreate ?? 0),
    failed: Number(data.failed ?? 0),
    errors,
    createdCredentials: [],
    uniqueEmails: Number(data.uniqueEmails ?? 0),
    emailNormalized: Number(data.emailNormalized ?? 0),
    emailNormalizedWouldUpdate: Number(data.emailNormalizedWouldUpdate ?? 0),
    duplicatesDetected: Number(data.duplicatesDetected ?? 0),
    skippedDeleted: Number(data.skippedDeleted ?? 0),
  };
}

export {
  ADMIN_PANEL_READ_ONLY_MESSAGE,
  REPAIR_MAINTENANCE_MESSAGE,
  isRepairEnabled,
  logRepairDisabled,
} from "./repairPolicy";

function logLoginFlowStop(payload: {
  email: string;
  reason: string;
  authUserFound: boolean;
  appUserFound: boolean;
  attemptedAdminRepair?: boolean;
  adminRepairStatus?: string | null;
  attemptedRegister?: boolean;
  registerStatus?: string | null;
}) {
  console.warn("[TEDRIS_LOGIN_FLOW_STOP]", payload);
}

function logLoginLoadingFinalized(email: string, success: boolean, errorCode?: string) {
  const payload = { email, success, errorCode: errorCode ?? null };
  if (isLocalDevApi()) {
    if (import.meta.env.DEV) console.debug("[TEDRIS_LOGIN] yerel oturum", payload);
    return;
  }
  console.log("[TEDRIS_LOGIN_LOADING_FINALIZED]", payload);
}

async function getAppUserRecord(id: string | number): Promise<BackendRecord<AppUserRecordData>> {
  return backendApi.getRecord<AppUserRecordData>(id);
}

async function updateAppUserRecord(id: string | number, data: AppUserRecordData): Promise<BackendRecord<AppUserRecordData>> {
  return backendApi.updateRecord<AppUserRecordData>(id, "app_user", data);
}

async function loadInstitutionRawRecords(): Promise<BackendRecord<InstitutionRecordData>[]> {
  return loadProjectRecords<InstitutionRecordData>("institution");
}

export interface KullaniciBilgisi {
  id: string;
  email: string;
  name: string;
  isAdmin?: boolean;
  appUserId?: string;
  role?: string;
  isActive?: boolean;
  district?: string | null;
  province?: string | null;
  institutionName?: string | null;
  institutionCode?: string | null;
  institutionId?: string | null;
  allowedDistricts?: string[];
  allowedCities?: string[];
  allowedInstitutions?: string[];
  reportPermissions?: ReportPermission[];
  reportScopeType?: string;
  reportScopeMintikas?: string[];
}

export interface KayitliProfil {
  id: string;
  isim: string;
  kurumAdi: string;
  rol: string;
}

interface UserProfileRecordData {
  isim?: string;
  kurumAdi?: string;
  rol?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface InstitutionRecordData {
  institutionName?: string;
  institutionCode?: string;
  districtName?: string;
  province?: string | null;
  expectedUserCount?: number | null;
  status?: string;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

type ReportPermission = "overview" | "district" | "institution" | "users" | "activity" | "excel" | "all";

interface AppUserRecordData {
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
  allowedDistricts?: string[];
  allowedCities?: string[];
  allowedInstitutions?: string[];
  reportPermissions?: ReportPermission[];
  reportScopeType?: string;
  reportScopeMintikas?: string[];
  lastLoginAt?: string | null;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  passwordResetAt?: string | null;
}

type AppUserRecordLike = BackendRecord<AppUserRecordData> & AppUserRecordData & {
  username?: string;
  payload?: AppUserRecordData;
  data?: AppUserRecordData;
};

interface ActivityLogRecordData {
  id?: string;
  userId?: string | null;
  appUserId?: string | null;
  authUserId?: string | null;
  userEmail?: string | null;
  userName?: string | null;
  action?: string;
  createdAt?: string;
  institutionId?: string | null;
  institutionName?: string | null;
  institutionCode?: string | null;
  district?: string | null;
  province?: string | null;
  metadata?: Record<string, unknown> | null;
}

type ActivityLogRecordLike = BackendRecord<ActivityLogRecordData> &
  ActivityLogRecordData & { payload?: ActivityLogRecordData };

async function loadActivityLogRecords(): Promise<BackendRecord<ActivityLogRecordData>[]> {
  if (!getBackendToken()) return [];
  const useAdmin = await resolveViewerUsesAdminRecords().catch(() => false);
  const load = () =>
    useAdmin
      ? backendApi.fetchAllAdminRecords<ActivityLogRecordData>("activity_log", { maxPages: 200 })
      : backendApi.fetchAllRecords<ActivityLogRecordData>("activity_log", { maxPages: 200 });
  try {
    return await load();
  } catch {
    if (useAdmin) {
      return backendApi.fetchAllRecords<ActivityLogRecordData>("activity_log", { maxPages: 200 }).catch(() => []);
    }
    return [];
  }
}

function activityLogDataFromRecord(record: BackendRecord<ActivityLogRecordData>): ActivityLogRecordData {
  const raw = record as ActivityLogRecordLike;
  let nested = raw.data ?? {};
  if (typeof nested === "string") {
    try {
      nested = JSON.parse(nested) as ActivityLogRecordData;
    } catch {
      nested = {};
    }
  }
  const payload = raw.payload ?? {};
  const recordUserId = record.userId != null ? String(record.userId) : undefined;
  return {
    ...payload,
    ...nested,
    action: nested.action ?? raw.action,
    userId: nested.userId ?? raw.userId ?? recordUserId ?? null,
    appUserId: nested.appUserId ?? raw.appUserId ?? null,
    authUserId: nested.authUserId ?? raw.authUserId ?? null,
    userEmail: nested.userEmail ?? raw.userEmail ?? null,
    userName: nested.userName ?? raw.userName ?? null,
    institutionId: nested.institutionId ?? raw.institutionId ?? null,
    institutionCode: nested.institutionCode ?? raw.institutionCode ?? null,
    institutionName: nested.institutionName ?? raw.institutionName ?? null,
    district: nested.district ?? raw.district ?? null,
    province: nested.province ?? raw.province ?? null,
    createdAt: nested.createdAt ?? raw.createdAt ?? record.createdAt ?? record.created_at,
    metadata: nested.metadata ?? raw.metadata ?? null,
  };
}

function logMatchesGeoFilter(log: AdminAktiviteLog, params: Record<string, string | undefined>): boolean {
  if (params.district) {
    const district = normalizeImportKey(log.district);
    if (!district || district !== normalizeImportKey(params.district)) return false;
  }
  if (params.institutionCode) {
    const code = normalizeImportKey(log.institutionCode);
    if (!code || code !== normalizeImportKey(params.institutionCode)) return false;
  }
  return true;
}

interface SupportRequestRecordData {
  userId?: string | null;
  appUserId?: string | null;
  authUserId?: string | null;
  userEmail?: string | null;
  userName?: string | null;
  institutionId?: string | null;
  subject?: string | null;
  message?: string;
  imageBase64?: string;
  status?: string;
  adminNote?: string | null;
  createdAt?: string;
  updatedAt?: string;
  province?: string | null;
  district?: string | null;
  institutionName?: string | null;
  institutionCode?: string | null;
  metadata?: Record<string, unknown> | null;
}

interface AdminSettingRecordData {
  key?: "default";
  periodStart?: string | null;
  periodEnd?: string | null;
  seasonStart?: string | null;
  seasonEnd?: string | null;
  updatedAt?: string;
}

export interface KayitliAfis {
  id: number;
  title: string;
  sablon: string;
  formData: string;
  createdAt: string;
  updatedAt: string;
}

export interface DestekMesaji {
  id: string | number;
  userId: string | null;
  appUserId?: string | null;
  authUserId?: string | null;
  userEmail: string | null;
  userName: string | null;
  subject?: string | null;
  message: string;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalPosters: number;
  totalSupport: number;
  dailyUsers: { day: string; count: number }[];
  dailyPosters: { day: string; count: number }[];
  recentUsers: { id: string; name: string; email: string; created_at: string }[];
}

export type { ReconcileAppUsersResult } from "./appUserSync";

export type KullaniciRol = "user" | "admin";
export type AktiviteDurum = "today" | "week" | "inactive" | "never";

export interface AdminKullanicilarListResponse {
  users: AdminKullanici[];
  rawCount: number;
  normalizedCount: number;
  filteredCount: number;
  loadError: string | null;
}

export interface AdminKullanici {
  id: string;
  authUserId?: string | null;
  email: string;
  name: string;
  province: string | null;
  district: string | null;
  institutionName: string | null;
  institutionCode: string | null;
  role: string;
  isActive: boolean;
  isAdmin: boolean;
  status?: string | null;
  lastLoginAt: string | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  activityStatus?: AktiviteDurum;
  daysSinceLogin?: number | null;
  login_time?: string | null;
  activeInRange?: boolean;
  institutionId?: string | null;
  allowedDistricts?: string[];
  allowedCities?: string[];
  allowedInstitutions?: string[];
  reportPermissions?: ReportPermission[];
  reportScopeType?: string;
  reportScopeMintikas?: string[];
}

export interface AdminOverview {
  totalUsers: number;
  todayLogins: number;
  activeUsers7d: number;
  totalSupport: number;
  activeInstitutions: number;
  passiveInstitutions: number;
  totalPosters: number;
  dailyLogins: { day: string; count: number }[];
  districtActivityToday: { district: string; province: string; today_count: number }[];
  recentLogins: {
    id: string;
    name: string;
    email: string;
    institution_name: string | null;
    district: string | null;
    province: string | null;
    role: string;
    last_login_at: string;
  }[];
}

export interface AdminKurum {
  institution_code: string;
  institution_name: string | null;
  province: string | null;
  district: string | null;
  user_count: number;
  today_active: number;
  active_7d: number;
  last_login_at: string | null;
  status?: string;
}

export interface AdminDestek extends DestekMesaji {
  status?: string;
  admin_note?: string | null;
  province?: string | null;
  district?: string | null;
  institution_name?: string | null;
  institution_code?: string | null;
}

export interface AdminFiltreler {
  provinces: string[];
  districts: { district: string; province: string }[];
  institutions: {
    institution_code: string;
    institution_name: string | null;
    district: string | null;
    province: string | null;
  }[];
}

function qs(params: Record<string, string | undefined>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) p.set(k, v);
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

function kullaniciFromBackend(user?: BackendUser | null): KullaniciBilgisi | null {
  if (!user) return null;
  const email = String(user.email ?? "");
  const role = typeof user.role === "string" ? user.role : "";
  const isAdmin =
    Boolean(user.isAdmin) ||
    role === "admin" ||
    role === "super_admin" ||
    isPrimaryAdminEmail(email);
  return {
    id: String(user.id ?? user.email ?? ""),
    email,
    name: String(user.name ?? user.email ?? "Kullanıcı"),
    role: role || undefined,
    isAdmin,
    isActive: user.isActive !== false,
    district: typeof user.district === "string" ? user.district : undefined,
    province: typeof user.province === "string" ? user.province : undefined,
    institutionName: typeof user.institutionName === "string" ? user.institutionName : undefined,
    institutionCode: typeof user.institutionCode === "string" ? user.institutionCode : undefined,
    institutionId: user.institutionId != null ? String(user.institutionId) : undefined,
    reportScopeType:
      typeof user.reportScopeType === "string"
        ? user.reportScopeType
        : typeof (user as Record<string, unknown>).report_scope_type === "string"
          ? String((user as Record<string, unknown>).report_scope_type)
          : undefined,
    reportScopeMintikas: Array.isArray(user.reportScopeMintikas)
      ? user.reportScopeMintikas.map(String)
      : Array.isArray((user as Record<string, unknown>).report_scope_mintikas)
        ? ((user as Record<string, unknown>).report_scope_mintikas as unknown[]).map(String)
        : undefined,
  };
}

function mergeKullaniciWithAppUser(user: KullaniciBilgisi, appUser?: AdminKullanici | null): KullaniciBilgisi {
  if (!appUser) return user;
  const isAdmin = kullaniciAdminMi({
    ...user,
    role: user.role ?? appUser.role,
    isAdmin: Boolean(user.isAdmin) || Boolean(appUser.isAdmin),
  });
  const role = isAdmin
    ? user.role === "super_admin" || appUser.role === "super_admin"
      ? "super_admin"
      : "admin"
    : appUser.role ?? user.role;
  return {
    ...user,
    appUserId: appUser.id,
    name: appUser.name || user.name,
    role,
    isAdmin,
    isActive: appUser.isActive,
    district: appUser.district,
    province: appUser.province,
    institutionName: appUser.institutionName,
    institutionCode: appUser.institutionCode,
    institutionId: appUser.institutionId,
    allowedDistricts: appUser.allowedDistricts ?? [],
    allowedCities: appUser.allowedCities ?? [],
    allowedInstitutions: appUser.allowedInstitutions ?? [],
    reportPermissions: appUser.reportPermissions ?? [],
    reportScopeType: appUser.reportScopeType ?? user.reportScopeType,
    reportScopeMintikas: appUser.reportScopeMintikas ?? user.reportScopeMintikas ?? [],
  };
}

function appUserAktifMi(user?: AdminKullanici | null): user is AdminKullanici {
  const status = String(user?.status ?? "").trim().toLocaleLowerCase("tr-TR");
  return Boolean(user && !user.deletedAt && user.isActive !== false && status !== "inactive" && status !== "deleted");
}

function logLoginDiag(authUser: KullaniciBilgisi | null, appUser: AdminKullanici | null) {
  if (isLocalDevApi()) {
    if (import.meta.env.DEV) {
      console.debug("[TEDRIS_LOGIN] yerel auth", {
        email: authUser?.email ?? null,
        authUserFound: Boolean(authUser),
        note: "Yerel geliştirmede VPS app_user aranmaz; bu normal.",
      });
    }
    return;
  }
  console.log("[TEDRIS_LOGIN_DIAG]", {
    email: authUser?.email ?? appUser?.email ?? null,
    authUserFound: Boolean(authUser),
    appUserFound: Boolean(appUser),
    appUserId: appUser?.id,
    appUserIsActive: appUser?.isActive,
    appUserStatus: appUser?.status,
    deletedAt: appUser?.deletedAt,
    institutionCode: appUser?.institutionCode,
    institutionName: appUser?.institutionName,
  });
}

function zorunluAktifAppUser(authUser: KullaniciBilgisi, appUser: AdminKullanici | null): AdminKullanici {
  logLoginDiag(authUser, appUser);
  if (!appUser) {
    console.warn("[TEDRIS_LOGIN_OWNERSHIP_HINT]", {
      email: authUser.email,
      hint: "Auth kaydı var ama app_user kaydı bu kullanıcıya devredilmemiş olabilir. Yönetici bir kez panele girip oturum açmalı.",
    });
    throw new Error(
      "Bu giriş hesabı auth sisteminde var ancak uygulama kullanıcı kaydıyla eşleşmemiş. Yönetici backend dry-run raporu sonrası kontrollü veri onarımı yapmalıdır.",
    );
  }
  if (!appUserAktifMi(appUser)) {
    throw new Error("Hesabınız pasif durumda. Lütfen yöneticinizle iletişime geçin.");
  }
  return appUser;
}

function isPrimaryAdminEmail(email?: string | null): boolean {
  return email?.trim().toLocaleLowerCase("tr-TR") === PRIMARY_ADMIN_EMAIL;
}

function primaryAdminFields(): Pick<AppUserRecordData, "role" | "isAdmin" | "isActive" | "allowedCities" | "allowedDistricts" | "allowedInstitutions" | "reportPermissions" | "deletedAt"> {
  return {
    role: "super_admin",
    isAdmin: true,
    isActive: true,
    allowedCities: [],
    allowedDistricts: [],
    allowedInstitutions: [],
    reportPermissions: ["all"],
    deletedAt: null,
  };
}

function primaryAdminEksikMi(user: AdminKullanici): boolean {
  return !(
    user.role === "super_admin" &&
    user.isAdmin &&
    user.isActive &&
    user.reportPermissions?.includes("all") &&
    !user.deletedAt
  );
}

async function ensureAppUserForAuthUser(authUser: KullaniciBilgisi): Promise<AdminKullanici | null> {
  const matches = await appUsersByEmail(authUser.email, authUser).catch(() => []);
  const existing = selectBestAppUser(matches, authUser.id);
  const now = new Date().toISOString();
  const authUserIdBefore = existing?.authUserId ?? null;

  if (existing) {
    const isPrimaryAdmin = isPrimaryAdminEmail(authUser.email);
    const needsPrimaryAdminUpdate = isPrimaryAdmin && primaryAdminEksikMi(existing);
    const needsAuthLink = !existing.authUserId && authUser.id;
    if (!needsPrimaryAdminUpdate && !needsAuthLink) {
      console.log("[TEDRIS_AUTH_APPUSER_LINK]", {
        email: existing.email,
        authUserFound: true,
        appUserFound: true,
        appUserId: existing.id,
        authUserIdBefore,
        authUserIdAfter: existing.authUserId ?? authUser.id,
        institutionCode: existing.institutionCode,
      });
      return existing;
    }

    const current = await getAppUserRecord(existing.id);
    const currentData = current.data ?? {};
    const canonicalEmail = getAppUserEmail(current) || normalizeEmail(authUser.email);
    const record = await updateAppUserRecord(existing.id, {
      ...currentData,
      id: currentData.id ?? authUser.id,
      authUserId: currentData.authUserId ?? authUser.id,
      email: canonicalEmail,
      loginEmail: currentData.loginEmail ?? canonicalEmail,
      generatedEmail: currentData.generatedEmail ?? canonicalEmail,
      name: currentData.name ?? authUser.name,
      ...(isPrimaryAdmin ? primaryAdminFields() : {}),
      updatedAt: now,
      createdAt: currentData.createdAt ?? existing.createdAt ?? now,
      lastLoginAt: currentData.lastLoginAt ?? existing.lastLoginAt ?? null,
    });
    const linked = appUserFromRecord(record);
    console.log("[TEDRIS_AUTH_APPUSER_LINK]", {
      email: linked.email,
      authUserFound: true,
      appUserFound: true,
      appUserId: linked.id,
      authUserIdBefore,
      authUserIdAfter: linked.authUserId ?? authUser.id,
      institutionCode: linked.institutionCode,
    });
    return linked;
  }

  if (!isPrimaryAdminEmail(authUser.email)) return null;

  const record = await backendApi.createRecord<AppUserRecordData>("app_user", {
    id: authUser.id,
    authUserId: authUser.id,
    email: authUser.email,
    loginEmail: authUser.email,
    generatedEmail: authUser.email,
    name: authUser.name,
    province: null,
    district: null,
    institutionName: null,
    institutionCode: null,
    institutionId: null,
    ...primaryAdminFields(),
    createdAt: now,
    updatedAt: now,
    lastLoginAt: null,
  });
  const created = appUserFromRecord(record);
  console.log("[TEDRIS_AUTH_MATCH]", {
    email: created.email,
    authUserId: authUser.id,
    appUserId: created.id,
    institutionCode: created.institutionCode,
    institutionName: created.institutionName,
    district: created.district,
    province: created.province,
  });
  return created;
}

type AppUserEmailSource = AppUserRecordLike | AppUserRecordData | AdminKullanici | BackendRecord<AppUserRecordData>;

function getAppUserEmail(source: AppUserEmailSource): string {
  return getAppUserEmailFromSync(source as Parameters<typeof getAppUserEmailFromSync>[0]);
}

function appUserDataFromRecord(record: BackendRecord<AppUserRecordData>): AppUserRecordData {
  const raw = record as AppUserRecordLike;
  const payload = raw.payload ?? {};
  const data = raw.data ?? {};
  const merged = {
    ...payload,
    ...raw,
    ...data,
    id: data.id ?? raw.id,
  };
  const email = getAppUserEmail(record);
  return {
    ...merged,
    email: email || merged.email,
    loginEmail: merged.loginEmail ?? (email || undefined),
    generatedEmail: merged.generatedEmail ?? (email || undefined),
  };
}

function appUserRecordNeedsEmailRepair(record: BackendRecord<AppUserRecordData>): boolean {
  const data = record.data ?? {};
  const canonical = getAppUserEmail(record);
  return Boolean(canonical && normalizeEmail(data.email) !== canonical);
}

async function repairAppUserRecordEmail(record: BackendRecord<AppUserRecordData>): Promise<BackendRecord<AppUserRecordData>> {
  const data = record.data ?? {};
  const canonical = getAppUserEmail(record);
  if (!canonical || normalizeEmail(data.email) === canonical) return record;
  try {
    return await updateAppUserRecord(record.id, {
      ...data,
      email: canonical,
      loginEmail: data.loginEmail ?? canonical,
      generatedEmail: data.generatedEmail ?? canonical,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return record;
  }
}

async function loadAppUserRawRecords(): Promise<BackendRecord<AppUserRecordData>[]> {
  return loadAllAppUserCatalog();
}

function appUserEmailsFromRecord(record: BackendRecord<AppUserRecordData>): string[] {
  const email = getAppUserEmail(record);
  return email ? [email] : [];
}

function appUserRawDiag(record: BackendRecord<AppUserRecordData>) {
  const raw = record as AppUserRecordLike;
  const data = appUserDataFromRecord(record);
  return {
    id: String(record.id),
    email: raw.email ?? null,
    dataEmail: raw.data?.email ?? null,
    loginEmail: raw.loginEmail ?? raw.data?.loginEmail ?? null,
    generatedEmail: raw.generatedEmail ?? raw.data?.generatedEmail ?? null,
    computedEmail: getAppUserEmail(record) || null,
    isActive: data.isActive,
    status: data.status ?? null,
    deletedAt: data.deletedAt ?? null,
    institutionName: data.institutionName ?? null,
    institutionCode: data.institutionCode ?? null,
    district: data.district ?? null,
  };
}

function appUserFromRecord(record: BackendRecord<AppUserRecordData>): AdminKullanici {
  const data = appUserDataFromRecord(record);
  const email = getAppUserEmail(record);
  const role = normalizeRole(data.role ?? null, data.isAdmin);
  const status = String(data.status ?? "").trim().toLocaleLowerCase("tr-TR");
  const isActive = data.isActive ?? (!data.deletedAt && status !== "inactive" && status !== "deleted");
  const createdAt = data.createdAt ?? record.createdAt ?? record.created_at ?? new Date().toISOString();
  const updatedAt = data.updatedAt ?? record.updatedAt ?? record.updated_at ?? createdAt;
  return {
    id: String(record.id),
    authUserId: data.authUserId ?? null,
    email,
    name: String(data.name ?? email ?? "Kullanıcı"),
    province: data.province ?? null,
    district: data.district ?? null,
    institutionName: data.institutionName ?? null,
    institutionCode: data.institutionCode ?? null,
    institutionId: data.institutionId ?? null,
    role,
    isActive,
    status: data.status ?? null,
    isAdmin: role === "admin",
    lastLoginAt: data.lastLoginAt ?? null,
    deletedAt: data.deletedAt ?? null,
    createdAt,
    updatedAt,
    activityStatus: data.lastLoginAt ? "week" : "never",
    daysSinceLogin: data.lastLoginAt ? Math.max(0, Math.floor((Date.now() - Date.parse(data.lastLoginAt)) / 86_400_000)) : null,
    allowedDistricts: data.allowedDistricts ?? [],
    allowedCities: data.allowedCities ?? [],
    allowedInstitutions: data.allowedInstitutions ?? [],
    reportPermissions: data.reportPermissions ?? [],
    reportScopeType: data.reportScopeType ?? "own",
    reportScopeMintikas: Array.isArray(data.reportScopeMintikas) ? data.reportScopeMintikas : [],
  };
}

function appUserMatchScore(user: AdminKullanici, authUserId?: string): number {
  let score = 0;
  if (appUserAktifMi(user)) score += 10_000;
  if (user.institutionCode) score += 2_000;
  if (!user.deletedAt) score += 1_000;
  if (user.authUserId) score += 500;
  if (authUserId && user.authUserId === authUserId) score += 250;
  if (user.institutionName) score += 40;
  if (user.district) score += 40;
  if (user.province) score += 20;
  if (user.role === "super_admin") score += 10;
  return score;
}

function selectBestAppUser(users: AdminKullanici[], authUserId?: string): AdminKullanici | null {
  return users
    .slice()
    .sort((a, b) =>
      appUserMatchScore(b, authUserId) - appUserMatchScore(a, authUserId) ||
      Date.parse(b.updatedAt ?? b.createdAt) - Date.parse(a.updatedAt ?? a.createdAt)
    )[0] ?? null;
}

async function appUsersByEmail(
  email: string,
  authUser?: KullaniciBilgisi | null,
  opts?: { loginLookup?: boolean },
): Promise<AdminKullanici[]> {
  if (isLocalDevApi()) return [];
  const normalized = normalizeEmail(email);
  if (!normalized) return [];
  const records = authUser && opts?.loginLookup
    ? await findAppUserRecordsForLoginReadOnly({ id: authUser.id, email: authUser.email, name: authUser.name })
    : authUser
      ? await loadAllAppUserCatalog()
      : await loadAppUserRawRecords();
  const filtered = records.filter((record) => {
    const computed = getAppUserEmail(record);
    if (computed === normalized) return true;
    if (authUser?.id && String(record.data?.authUserId ?? "") === authUser.id) return true;
    return false;
  });
  const matches = filtered;
  const users = matches.map(appUserFromRecord);
  console.log("[TEDRIS_LOGIN_APP_USER_CANDIDATES]", {
    loginEmail: normalized,
    candidateCount: users.length,
    lookupSource: authUser && opts?.loginLookup ? "login_owned_readonly" : authUser ? "admin_catalog" : "admin_catalog",
    candidates: users.map((user) => {
      const raw = matches.find((record) => String(record.id) === user.id) as AppUserRecordLike | undefined;
      return {
        id: user.id,
        rawEmail: raw?.email ?? null,
        computedEmail: getAppUserEmail(user),
        loginEmail: raw?.data?.loginEmail ?? raw?.loginEmail ?? null,
        generatedEmail: raw?.data?.generatedEmail ?? raw?.generatedEmail ?? null,
        dataEmail: raw?.data?.email ?? null,
        isActive: user.isActive,
        status: user.status ?? null,
        deletedAt: user.deletedAt ?? null,
        authUserId: user.authUserId ?? null,
        institutionCode: user.institutionCode,
        district: user.district,
        computedActive: appUserAktifMi(user),
      };
    }),
  });
  return users;
}

function filterAppUsers(users: AdminKullanici[], params: Record<string, string | undefined>): AdminKullanici[] {
  const search = params.search?.trim().toLocaleLowerCase("tr-TR");
  const activeMode = params.active ?? "all";
  const roleFilter = params.role?.trim();
  const districtFilter = params.district?.trim();
  const institutionFilter = params.institutionCode?.trim();

  return users.filter((user) => {
    if (activeMode === "active" && (user.deletedAt || !user.isActive)) return false;
    if (activeMode === "inactive" && appUserAktifMi(user)) return false;

    if (districtFilter && (user.district ?? "").trim() !== districtFilter) return false;

    if (institutionFilter) {
      const want = normalizeImportKey(institutionFilter);
      const have = normalizeImportKey(user.institutionCode);
      if (want && have !== want) return false;
    }

    if (roleFilter && normalizeRole(user.role, user.isAdmin) !== roleFilter) return false;

    if (search) {
      const haystack = [user.name, user.email, user.institutionName, user.district, user.institutionCode]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("tr-TR");
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

async function loadAppUserRawRecordsForList(): Promise<BackendRecord<AppUserRecordData>[]> {
  if (!getBackendToken()) {
    throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yapın.");
  }
  return backendApi.fetchAllRecords<AppUserRecordData>("app_user", { maxPages: 100 });
}

async function listAdminKullanicilarForPanel(
  params: Record<string, string | undefined> = {},
): Promise<AdminKullanicilarListResponse> {
  const filters = {
    district: params.district?.trim() || undefined,
    institutionCode: params.institutionCode?.trim() || undefined,
    search: params.search?.trim() || undefined,
    role: params.role?.trim() || undefined,
    active: params.active?.trim() || "all",
  };

  try {
    const records = await loadAppUserRawRecordsForList();
    const rawCount = records.length;
    const normalized = records
      .map(appUserFromRecord)
      .sort((a, b) => a.name.localeCompare(b.name, "tr") || a.email.localeCompare(b.email, "tr"));
    const filtered = filterAppUsers(normalized, filters);

    console.log("[TEDRIS_USERS_LIST_DIAG]", {
      rawCount,
      normalizedCount: normalized.length,
      filteredCount: filtered.length,
      filters,
      error: null,
    });

    return {
      users: filtered,
      rawCount,
      normalizedCount: normalized.length,
      filteredCount: filtered.length,
      loadError: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kullanıcı verisi okunamadı";
    console.log("[TEDRIS_USERS_LIST_DIAG]", {
      rawCount: 0,
      normalizedCount: 0,
      filteredCount: 0,
      filters,
      error: message,
    });
    return {
      users: [],
      rawCount: 0,
      normalizedCount: 0,
      filteredCount: 0,
      loadError: message,
    };
  }
}

function isActiveRecord(data?: { isActive?: boolean; status?: string | null; deletedAt?: string | null } | null): boolean {
  const status = String(data?.status ?? "").trim().toLocaleLowerCase("tr-TR");
  return !data?.deletedAt && data?.isActive !== false && status !== "inactive" && status !== "deleted";
}

function appUserActiveData(data: Pick<AppUserRecordData, "isActive" | "deletedAt" | "status">): boolean {
  return isActiveRecord(data);
}

function generatedInstitutionEmail(district: string, institutionName: string, existingEmails: Set<string>): string {
  const base = epostaUret(district, institutionName);
  if (!base) return "";
  if (!existingEmails.has(normalizeEmail(base))) return base;
  for (let suffix = 2; suffix < 1000; suffix += 1) {
    const candidate = epostaAlternatif(district, institutionName, suffix);
    if (candidate && !existingEmails.has(normalizeEmail(candidate))) return candidate;
  }
  return base;
}

async function appUserRecords(params: Record<string, string | undefined> = {}) {
  const records = await loadAppUserRawRecords();
  for (const record of records) {
    if (appUserRecordNeedsEmailRepair(record)) {
      console.log("[TEDRIS_USER_ROW_RAW]", appUserRawDiag(record));
    }
  }
  const users = records
    .map(appUserFromRecord)
    .sort((a, b) => a.name.localeCompare(b.name, "tr") || a.email.localeCompare(b.email, "tr"));
  return filterAppUsers(users, params);
}

async function appUserByEmail(email: string): Promise<AdminKullanici | null> {
  return selectBestAppUser(await appUsersByEmail(email));
}

async function kurumIdBul(institutionCode?: string | null): Promise<string | null> {
  if (!institutionCode) return null;
  const institutions = await institutionRecords({ institutionCode });
  return institutions[0]?.id ?? null;
}

function normalizeImportKey(value?: string | null): string {
  return (value ?? "")
    .trim()
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/\s+/g, " ");
}

function normalizeEmail(value?: string | null): string {
  return (value ?? "").trim().toLocaleLowerCase("tr-TR");
}

function institutionCompositeKey(data: { institutionName?: string | null; districtName?: string | null; district?: string | null; province?: string | null }): string {
  return [
    normalizeImportKey(data.institutionName),
    normalizeImportKey(data.districtName ?? data.district),
    normalizeImportKey(data.province),
  ].join("|");
}

function activeInstitutionRecord(record: BackendRecord<InstitutionRecordData>): boolean {
  return isActiveRecord(record.data);
}

function institutionCompletenessScore(institution: AdminYurtKayit): number {
  return [
    institution.institutionCode,
    institution.institutionName,
    institution.districtName,
    institution.province,
    institution.expectedUserCount,
    institution.notes,
  ].filter((value) => value != null && String(value).trim()).length;
}

function canonicalInstitution(a: AdminYurtKayit, b: AdminYurtKayit): AdminYurtKayit {
  const scoreDiff = institutionCompletenessScore(b) - institutionCompletenessScore(a);
  if (scoreDiff !== 0) return scoreDiff > 0 ? b : a;
  return Date.parse(a.createdAt) <= Date.parse(b.createdAt) ? a : b;
}

function permissionDefaults(
  role?: string,
  isAdmin?: boolean,
  reportScopeType?: string,
): Pick<AppUserRecordData, "allowedCities" | "allowedDistricts" | "allowedInstitutions" | "reportPermissions" | "reportScopeType" | "reportScopeMintikas"> {
  if (isAdmin || role === "admin" || role === "super_admin") {
    return {
      allowedCities: [],
      allowedDistricts: [],
      allowedInstitutions: [],
      reportPermissions: ["overview", "district", "institution", "users", "activity", "excel"],
      reportScopeType: "all",
      reportScopeMintikas: [],
    };
  }
  if (reportScopeType === "mintika") {
    return {
      allowedCities: [],
      allowedDistricts: [],
      allowedInstitutions: [],
      reportPermissions: ["overview", "district", "institution", "users", "activity", "excel"],
      reportScopeType: "mintika",
      reportScopeMintikas: [],
    };
  }
  return {
    allowedCities: [],
    allowedDistricts: [],
    allowedInstitutions: [],
    reportPermissions: [],
    reportScopeType: "own",
    reportScopeMintikas: [],
  };
}

async function registerAuthUserSafely(data: { email: string; password: string; name: string }) {
  const currentToken = getBackendToken();
  try {
    return await backendApi.register(data);
  } catch (error) {
    const msg = (error instanceof Error ? error.message : String(error)).toLocaleLowerCase("tr-TR");
    if (msg.includes("409") || msg.includes("conflict") || msg.includes("zaten") || msg.includes("already")) {
      const existing = await findAuthUserByEmailFromAuth(data.email, undefined, { allowAdminUsersList: true }).catch(() => null);
      if (existing) return { user: existing };
    }
    return null;
  } finally {
    if (currentToken) setBackendToken(currentToken);
    else clearBackendToken();
  }
}

/** 409 veya admin/users 403 sonrası auth id çözümlemesi (login dene, sonra liste). */
async function registerOrResolveAuthUser(data: { email: string; password: string; name: string }) {
  const registered = await registerAuthUserSafely(data);
  if (registered?.user?.id) return registered;

  const currentToken = getBackendToken();
  try {
    const loginRes = await backendApi.login({ email: data.email, password: data.password });
    const loginUser = loginRes?.user;
    if (loginUser?.id) return { user: loginUser };
  } catch {
    /* mevcut hesap farklı şifreyle olabilir */
  } finally {
    if (currentToken) setBackendToken(currentToken);
    else clearBackendToken();
  }

  const existing = await findAuthUserByEmailFromAuth(data.email, undefined, { allowAdminUsersList: true }).catch(() => null);
  if (existing?.id) return { user: existing };

  return null;
}

function tarihAraligi(params: Record<string, string | undefined> = {}): AdminRange {
  const now = new Date();
  const end = new Date(now);
  const range = params.range || "7d";
  let start = new Date(now);
  let label = "Son 7 gün";

  if (range === "today") {
    start = new Date(now);
    start.setHours(0, 0, 0, 0);
    label = "Bugün";
  } else if (range === "yesterday") {
    start = new Date(now);
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    end.setTime(start.getTime());
    end.setHours(23, 59, 59, 999);
    label = "Dün";
  } else if (range === "30d") {
    start.setDate(start.getDate() - 30);
    label = "Son 30 gün";
  } else if (range === "this_month" || range === "period" || range === "season") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    label = range === "this_month" ? "Bu ay" : range === "period" ? "Bu dönem" : "Bu sezon";
  } else if (range === "last_month") {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    end.setTime(new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).getTime());
    label = "Geçen ay";
  } else if (range === "custom") {
    start = params.from ? new Date(`${params.from}T00:00:00`) : start;
    end.setTime(params.to ? new Date(`${params.to}T23:59:59`).getTime() : end.getTime());
    label = "Özel aralık";
  } else {
    start.setDate(start.getDate() - 7);
  }

  return {
    preset: range,
    label,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

function activityFromRecord(record: BackendRecord<ActivityLogRecordData>): AdminAktiviteLog {
  const data = activityLogDataFromRecord(record);
  const createdAt = data.createdAt ?? record.createdAt ?? record.created_at ?? new Date().toISOString();
  return {
    id: String(record.id),
    createdAt,
    action: String(data.action ?? ""),
    userId: data.userId != null ? String(data.userId) : null,
    appUserId: data.appUserId != null ? String(data.appUserId) : null,
    authUserId: data.authUserId != null ? String(data.authUserId) : null,
    userEmail: data.userEmail ?? null,
    userName: data.userName ?? data.userEmail ?? null,
    institutionId: data.institutionId != null ? String(data.institutionId) : null,
    institutionCode: data.institutionCode ?? null,
    institutionName: data.institutionName ?? null,
    district: data.district ?? null,
    province: data.province ?? null,
    metadata: data.metadata ?? null,
  };
}

function institutionByCodeMap(institutions: AdminYurtKayit[]) {
  return new Map(institutions.map((institution) => [normalizeImportKey(institution.institutionCode), institution]));
}

function appUserByEmailMap(users: AdminKullanici[]) {
  const map = new Map<string, AdminKullanici>();
  for (const user of users) {
    const email = getAppUserEmail(user);
    if (!email) continue;
    const existing = map.get(email);
    map.set(email, existing ? selectBestAppUser([existing, user]) ?? user : user);
  }
  return map;
}

function appUserByIdMap(users: AdminKullanici[]) {
  const map = new Map<string, AdminKullanici>();
  for (const user of users) {
    map.set(String(user.id), user);
    if (user.authUserId) map.set(String(user.authUserId), user);
  }
  return map;
}

function enrichActivityLog(
  log: AdminAktiviteLog,
  usersByEmail: Map<string, AdminKullanici>,
  institutionsByCode: Map<string, AdminYurtKayit>,
  usersById: Map<string, AdminKullanici>,
): AdminAktiviteLog {
  const user =
    (log.userEmail ? usersByEmail.get(normalizeEmail(log.userEmail)) : undefined) ??
    (log.authUserId ? usersById.get(String(log.authUserId)) : undefined) ??
    (log.appUserId ? usersById.get(String(log.appUserId)) : undefined) ??
    (log.userId ? usersById.get(String(log.userId)) : undefined);
  const code = log.institutionCode ?? user?.institutionCode ?? null;
  const institution = code ? institutionsByCode.get(normalizeImportKey(code)) : undefined;
  return {
    ...log,
    userId: log.userId ?? log.appUserId ?? user?.id ?? null,
    appUserId: log.appUserId ?? user?.id ?? null,
    authUserId: log.authUserId ?? user?.authUserId ?? null,
    userEmail: log.userEmail ?? user?.email ?? null,
    userName: log.userName ?? user?.name ?? null,
    institutionId: log.institutionId ?? user?.institutionId ?? institution?.id ?? null,
    institutionName: log.institutionName ?? user?.institutionName ?? institution?.institutionName ?? null,
    institutionCode: code ?? institution?.institutionCode ?? null,
    district: log.district ?? user?.district ?? institution?.districtName ?? null,
    province: log.province ?? user?.province ?? institution?.province ?? null,
  };
}

async function findAppUserForAuthUserReadOnly(
  authUser: KullaniciBilgisi,
  opts?: { loginLookup?: boolean },
): Promise<AdminKullanici | null> {
  const matches = await appUsersByEmail(authUser.email, authUser, { loginLookup: opts?.loginLookup }).catch(() => []);
  return selectBestAppUser(matches, authUser.id);
}

async function aktifKullaniciBaglami(): Promise<AdminKullanici | null> {
  const me = await backendApi.me().catch(() => null);
  const user = me ? kullaniciFromBackend(me.user ?? (me as BackendUser)) : null;
  if (!user?.email) return null;
  const appUser = await findAppUserForAuthUserReadOnly(user, { loginLookup: true }).catch(() => null);
  if (!appUserAktifMi(appUser)) {
    return null;
  }
  return appUser;
}

function activityYetkiFiltresi(logs: AdminAktiviteLog[], viewer: AdminKullanici | null): AdminAktiviteLog[] {
  const access = getReportAccessForUser(viewer);
  if (access.type === "all") return logs;
  if (access.type === "mintika") {
    return logs.filter((log) => isDistrictAllowedByReportAccess(access, log.district));
  }
  if (!viewer) return [];
  const cities = viewer.allowedCities ?? [];
  const districts = viewer.allowedDistricts ?? [];
  const institutions = viewer.allowedInstitutions ?? [];
  const institutionKeys = new Set(institutions.map((code) => normalizeImportKey(code)));
  return logs.filter((log) => {
    if (cities.length && (!log.province || !cities.includes(log.province))) return false;
    if (districts.length && (!log.district || !districts.includes(log.district))) return false;
    if (institutionKeys.size) {
      const code = normalizeImportKey(log.institutionCode);
      if (!code || !institutionKeys.has(code)) return false;
    }
    return true;
  });
}

async function activityRecordOlustur(action: string, metadata?: Record<string, unknown>) {
  const now = new Date().toISOString();
  const me = await backendApi.me().catch(() => null);
  const authUser = me ? kullaniciFromBackend(me.user ?? (me as BackendUser)) : null;
  const appUser = authUser ? await aktifKullaniciBaglami() : null;
  if (authUser && !appUser) return;
  const institution = appUser?.institutionCode
    ? (await institutionRecords({ institutionCode: appUser.institutionCode }).catch(() => []))[0] ?? null
    : null;
  const userId = appUser?.id ?? authUser?.id ?? null;
  const institutionId = appUser?.institutionId ?? institution?.id ?? await kurumIdBul(appUser?.institutionCode);
  const institutionName = appUser?.institutionName ?? institution?.institutionName ?? null;
  const institutionCode = appUser?.institutionCode ?? institution?.institutionCode ?? null;
  const district = appUser?.district ?? institution?.districtName ?? null;
  const province = appUser?.province ?? institution?.province ?? null;
  await backendApi.createRecord<ActivityLogRecordData>("activity_log", {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId,
    appUserId: appUser?.id ?? null,
    authUserId: authUser?.id ?? appUser?.authUserId ?? null,
    userEmail: appUser?.email ?? authUser?.email ?? null,
    userName: appUser?.name ?? authUser?.name ?? null,
    action,
    createdAt: now,
    institutionId,
    institutionName,
    institutionCode,
    district,
    province,
    metadata: {
      ...(metadata ?? {}),
      missingInstitutionContext: !institutionCode || !district || !institutionName,
      authUserId: authUser?.id ?? null,
      appUserId: appUser?.id ?? null,
    },
  });
  console.log("[TEDRIS_ACTIVITY_DIAG]", {
    action,
    userEmail: appUser?.email ?? authUser?.email ?? null,
    appUserId: appUser?.id ?? null,
    institutionCode,
    created: true,
  });
  console.log("[TEDRIS_ACTIVITY_LOG_CREATED]", {
    action,
    userEmail: appUser?.email ?? authUser?.email ?? null,
    institutionCode,
    district,
    province,
  });
  await backendApi.usageEvent(action, { source: "activity_log", ...metadata }).catch(() => {});
}

function tamYetkiliMi(user: AdminKullanici | null): boolean {
  return kullaniciTamRaporYetkiliMi(user);
}

function scopeInstitutionAllowed(institution: AdminYurtKayit, viewer: AdminKullanici | null): boolean {
  const access = getReportAccessForUser(viewer);
  if (access.type === "all") return true;
  if (access.type === "mintika") {
    return isDistrictAllowedByReportAccess(access, institution.districtName);
  }
  if (!viewer) return false;
  const cities = viewer.allowedCities ?? [];
  const districts = viewer.allowedDistricts ?? [];
  const institutions = viewer.allowedInstitutions ?? [];
  if (cities.length && institution.province && !cities.includes(institution.province)) return false;
  if (districts.length && !districts.includes(institution.districtName)) return false;
  if (institutions.length && !institutions.includes(institution.institutionCode)) return false;
  if (!cities.length && !districts.length && !institutions.length) {
    return Boolean(viewer.institutionCode && institution.institutionCode === viewer.institutionCode);
  }
  return true;
}

function scopeUserAllowed(user: AdminKullanici, viewer: AdminKullanici | null): boolean {
  const access = getReportAccessForUser(viewer);
  if (access.type === "all") return true;
  if (access.type === "mintika") {
    return isDistrictAllowedByReportAccess(access, user.district);
  }
  if (!viewer) return false;
  const cities = viewer.allowedCities ?? [];
  const districts = viewer.allowedDistricts ?? [];
  const institutions = viewer.allowedInstitutions ?? [];
  if (cities.length && user.province && !cities.includes(user.province)) return false;
  if (districts.length && user.district && !districts.includes(user.district)) return false;
  if (institutions.length && user.institutionCode && !institutions.includes(user.institutionCode)) return false;
  if (!cities.length && !districts.length && !institutions.length) {
    return Boolean(viewer.institutionCode && user.institutionCode === viewer.institutionCode);
  }
  return true;
}

function logFiltrele(logs: AdminAktiviteLog[], params: Record<string, string | undefined>, range?: AdminRange) {
  const start = range ? Date.parse(range.startIso) : Number.NEGATIVE_INFINITY;
  const end = range ? Date.parse(range.endIso) : Number.POSITIVE_INFINITY;
  return logs.filter((log) => {
    const time = Date.parse(log.createdAt);
    if (!Number.isFinite(time) || time < start || time > end) return false;
    return logMatchesGeoFilter(log, params);
  });
}

function yurtDurumu(lastLoginAt: string | null): string {
  if (!lastLoginAt) return "hic_giris_yok";
  const days = Math.floor((Date.now() - Date.parse(lastLoginAt)) / 86_400_000);
  if (days <= 0) return "bugun_aktif";
  if (days <= 7) return "son_7_gun_aktif";
  if (days <= 30) return "pasif_7";
  return "pasif_30";
}

function yurtMetrikleriUret(
  institutions: AdminYurtKayit[],
  users: AdminKullanici[],
  allLogs: AdminAktiviteLog[],
  rangeLogs: AdminAktiviteLog[],
  supportRequests: AdminDestek[] = [],
  params: Record<string, string | undefined> = {},
): AdminYurtMetrik[] {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const sevenDaysAgo = Date.now() - 7 * 86_400_000;
  const thirtyDaysAgo = Date.now() - 30 * 86_400_000;

  const yurts = institutions.map((institution) => {
    const institutionCodeKey = normalizeImportKey(institution.institutionCode);
    const institutionUsers = users.filter((user) => normalizeImportKey(user.institutionCode) === institutionCodeKey);
    const logs = allLogs.filter((log) => normalizeImportKey(log.institutionCode) === institutionCodeKey);
    const currentLogs = rangeLogs.filter((log) => normalizeImportKey(log.institutionCode) === institutionCodeKey);
    const openSupport = supportRequests.filter((request) => {
      if (normalizeImportKey(request.institution_code) !== institutionCodeKey) return false;
      return request.status !== "cozuldu" && request.status !== "closed";
    }).length;
    const loginLogs = logs.filter((log) => log.action === "login");
    const lastLoginAt = loginLogs.map((log) => log.createdAt).sort().at(-1) ?? null;
    const lastActivityAt = logs.map((log) => log.createdAt).sort().at(-1) ?? null;
    const todayLoginUsers = new Set(loginLogs.filter((log) => Date.parse(log.createdAt) >= todayStart.getTime()).map((log) => log.userId || log.userName)).size;
    const logins7d = loginLogs.filter((log) => Date.parse(log.createdAt) >= sevenDaysAgo).length;
    const logins30d = loginLogs.filter((log) => Date.parse(log.createdAt) >= thirtyDaysAgo).length;
    return {
      id: institution.id,
      institutionCode: institution.institutionCode,
      institutionName: institution.institutionName,
      districtName: institution.districtName,
      province: institution.province,
      userCount: institutionUsers.length,
      todayLoginUsers,
      loginsInRange: currentLogs.filter((log) => log.action === "login").length,
      logins7d,
      logins30d,
      lastLoginAt,
      lastActivityAt,
      openSupport,
      activityStatus: yurtDurumu(lastLoginAt),
      registryStatus: institution.status,
      inRegistry: true,
      notes: institution.notes,
      hasDataGap: institutionUsers.length === 0,
      exportPng: currentLogs.filter((log) => log.action === "export_png").length,
      exportPdf: currentLogs.filter((log) => log.action === "export_pdf").length,
      shareWhatsapp: currentLogs.filter((log) => log.action === "share_whatsapp").length,
    } satisfies AdminYurtMetrik;
  });

  return yurts.filter((yurt) => {
    if (params.preset === "today_active") return yurt.todayLoginUsers > 0;
    if (params.preset === "week_active") return yurt.logins7d > 0;
    if (params.preset === "passive7") return yurt.activityStatus === "pasif_7" || yurt.activityStatus === "pasif_30";
    if (params.preset === "passive30") return yurt.activityStatus === "pasif_30";
    if (params.preset === "never") return yurt.activityStatus === "hic_giris_yok";
    return true;
  });
}

function mintikaMetrikleriUret(yurts: AdminYurtMetrik[], users: AdminKullanici[]): AdminMintikaMetrik[] {
  const districts = [...new Set(yurts.map((y) => y.districtName).filter(Boolean))].sort((a, b) => a.localeCompare(b, "tr"));
  return districts.map((districtName) => {
    const districtYurts = yurts.filter((y) => y.districtName === districtName);
    const districtUsers = users.filter((u) => u.district === districtName);
    const active7dYurts = districtYurts.filter((y) => y.logins7d > 0).length;
    const usageRate = districtYurts.length ? Math.round((active7dYurts / districtYurts.length) * 100) : null;
    const healthScore = usageRate;
    return {
      districtName,
      totalYurts: districtYurts.length,
      totalUsers: districtUsers.length,
      todayActiveYurts: districtYurts.filter((y) => y.todayLoginUsers > 0).length,
      todayActiveUsers: districtYurts.reduce((sum, y) => sum + y.todayLoginUsers, 0),
      active7dYurts,
      passive7dYurts: districtYurts.filter((y) => y.activityStatus === "pasif_7" || y.activityStatus === "pasif_30").length,
      neverLoginYurts: districtYurts.filter((y) => y.activityStatus === "hic_giris_yok").length,
      openSupport: districtYurts.reduce((sum, y) => sum + y.openSupport, 0),
      lastMovementAt: districtYurts.map((y) => y.lastActivityAt).filter((v): v is string => Boolean(v)).sort().at(-1) ?? null,
      usageRate,
      healthScore,
      healthLabel: healthScore == null ? "Veri yok" : healthScore >= 80 ? "İyi" : healthScore >= 50 ? "Dikkat" : "Riskli",
    };
  });
}

async function raporVerisi(params: Record<string, string | undefined> = {}) {
  const range = tarihAraligi(params);
  const viewer = await aktifKullaniciBaglami();
  if (!kullaniciRaporGorebilirMi(viewer)) {
    throw new Error("Yönetim raporlarına erişim yetkiniz yok.");
  }
  const access = getReportAccessForUser(viewer);
  if (access.type === "mintika" && params.district) {
    if (!isDistrictAllowedByReportAccess(access, params.district)) {
      throw new Error("Bu mıntıka için rapor erişiminiz yok.");
    }
  }
  const institutions = (await institutionRecords(params)).filter((institution) => scopeInstitutionAllowed(institution, viewer));
  const users = (await appUserRecords({ ...params, active: params.active ?? "active" })).filter((user) =>
    scopeUserAllowed(user, viewer),
  );
  const usersByEmail = appUserByEmailMap(users);
  const usersById = appUserByIdMap(users);
  const institutionsByCode = institutionByCodeMap(institutions);
  const scopedInstitutionCodes = new Set(institutions.map((institution) => normalizeImportKey(institution.institutionCode)));
  const allLogs = activityYetkiFiltresi(
    (await loadActivityLogRecords())
      .map(activityFromRecord)
      .map((log) => enrichActivityLog(log, usersByEmail, institutionsByCode, usersById)),
    viewer,
  ).filter((log) => logMatchesGeoFilter(log, params));
  const rangeLogs = logFiltrele(allLogs, params, range);
  const supportRequests = (await destekKayitlari()).filter((request) => {
    const time = Date.parse(request.createdAt);
    if (Number.isFinite(time) && (time < Date.parse(range.startIso) || time > Date.parse(range.endIso))) return false;
    if (params.district && normalizeImportKey(request.district) !== normalizeImportKey(params.district)) return false;
    if (params.institutionCode && normalizeImportKey(request.institution_code) !== normalizeImportKey(params.institutionCode)) {
      return false;
    }
    if (request.institution_code && !scopedInstitutionCodes.has(normalizeImportKey(request.institution_code))) return false;
    return true;
  });
  console.log("[TEDRIS_REPORT_COUNTS]", {
    activeInstitutions: institutions.length,
    activeUsers: users.length,
    logs: allLogs.length,
    noLoginCount: institutions.length - new Set(allLogs.filter((log) => log.action === "login").map((log) => log.institutionCode).filter(Boolean)).size,
  });
  const yurts = yurtMetrikleriUret(institutions, users, allLogs, rangeLogs, supportRequests, params);
  const mintikalar = mintikaMetrikleriUret(yurts, users);
  return { range, institutions, users, allLogs, rangeLogs, supportRequests, yurts, mintikalar };
}

function destekFromRecord(record: BackendRecord<SupportRequestRecordData>): AdminDestek {
  const data = record.data ?? {};
  return {
    id: record.id,
    userId: data.userId ?? null,
    appUserId: data.appUserId ?? null,
    authUserId: data.authUserId ?? null,
    userEmail: data.userEmail ?? null,
    userName: data.userName ?? null,
    subject: data.subject ?? null,
    message: String(data.message ?? ""),
    createdAt: data.createdAt ?? record.createdAt ?? record.created_at ?? new Date().toISOString(),
    status: data.status ?? "yeni",
    admin_note: data.adminNote ?? null,
    province: data.province ?? null,
    district: data.district ?? null,
    institution_name: data.institutionName ?? null,
    institution_code: data.institutionCode ?? null,
  };
}

async function destekKayitlari() {
  const [records, users, institutions] = await Promise.all([
    backendApi.listRecords<SupportRequestRecordData>("support_request"),
    appUserRecords(),
    institutionRecords(),
  ]);
  const usersByEmail = appUserByEmailMap(users);
  const institutionsByCode = institutionByCodeMap(institutions);
  return records.map((record) => {
    const request = destekFromRecord(record);
    const user = request.userEmail ? usersByEmail.get(normalizeEmail(request.userEmail)) : undefined;
    const code = request.institution_code ?? user?.institutionCode ?? null;
    const institution = code ? institutionsByCode.get(normalizeImportKey(code)) : undefined;
    return {
      ...request,
      userId: request.userId ?? user?.id ?? null,
      appUserId: request.appUserId ?? user?.id ?? null,
      authUserId: request.authUserId ?? user?.authUserId ?? null,
      userEmail: request.userEmail ?? user?.email ?? null,
      userName: request.userName ?? user?.name ?? null,
      province: request.province ?? user?.province ?? institution?.province ?? null,
      district: request.district ?? user?.district ?? institution?.districtName ?? null,
      institution_name: request.institution_name ?? user?.institutionName ?? institution?.institutionName ?? null,
      institution_code: code ?? institution?.institutionCode ?? null,
    };
  }).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

async function adminSettingsRecord() {
  const records = await backendApi.listRecords<AdminSettingRecordData>("admin_setting");
  return records.find((record) => record.data?.key === "default") ?? records[0] ?? null;
}

async function veriSagligiUret(): Promise<AdminVeriSagligi> {
  const [users, institutions, rawInstitutionRecords, rawUserRecords, rawLogs, supportRequests] = await Promise.all([
    appUserRecords(),
    institutionRecords(),
    loadInstitutionRawRecords(),
    loadAppUserRawRecords(),
    loadActivityLogRecords().then((records) => records.map(activityFromRecord)),
    destekKayitlari(),
  ]);
  const usersByEmail = appUserByEmailMap(users);
  const usersById = appUserByIdMap(users);
  const institutionsByCodeForLogs = institutionByCodeMap(institutions);
  const logs = rawLogs.map((log) => enrichActivityLog(log, usersByEmail, institutionsByCodeForLogs, usersById));
  const institutionCodes = new Set(institutions.map((i) => normalizeImportKey(i.institutionCode)));
  const inactiveInstitutionCodes = new Set(
    rawInstitutionRecords
      .filter((record) => !activeInstitutionRecord(record))
      .map((record) => normalizeImportKey(record.data?.institutionCode)),
  );
  const userIds = new Set(users.map((u) => u.id));
  const issues: AdminDataHealthIssue[] = [];
  const activeRawInstitutions = rawInstitutionRecords.filter(activeInstitutionRecord).map(institutionFromRecord);
  const institutionsByComposite = new Map<string, AdminYurtKayit[]>();
  const institutionsByCode = new Map<string, AdminYurtKayit[]>();
  const usersByEmailGroups = new Map<string, AdminKullanici[]>();

  for (const institution of activeRawInstitutions) {
    const compositeKey = institutionCompositeKey(institution);
    institutionsByComposite.set(compositeKey, [...(institutionsByComposite.get(compositeKey) ?? []), institution]);
    const codeKey = normalizeImportKey(institution.institutionCode);
    if (codeKey) institutionsByCode.set(codeKey, [...(institutionsByCode.get(codeKey) ?? []), institution]);
  }

  for (const group of institutionsByComposite.values()) {
    if (group.length <= 1) continue;
    const canonical = group.reduce(canonicalInstitution);
    issues.push({
      id: `institution-duplicate-${canonical.id}`,
      type: "institution_duplicate",
      targetKind: "institution",
      targetId: canonical.id,
      record: `${canonical.institutionName} (${canonical.districtName})`,
      description: `${group.length} aktif kurum kaydı aynı normalize kurum bilgisiyle tekrarlanıyor.`,
      suggestion: "Duplicate kurumları pasifleştirin ve kullanıcıları canonical kuruma bağlayın.",
    });
  }

  for (const [codeKey, group] of institutionsByCode.entries()) {
    if (group.length <= 1) continue;
    issues.push({
      id: `institution-code-duplicate-${codeKey}`,
      type: "institution_duplicate_code",
      targetKind: "institution",
      targetId: group[0]?.id ?? null,
      record: group[0]?.institutionCode ?? codeKey,
      description: `${group.length} aktif kurum aynı kurum kodunu kullanıyor.`,
      suggestion: "Aynı kurum koduyla duran duplicate kurum kayıtlarını pasifleştirin.",
    });
  }

  const activeUserInstitutionCodes = new Set(users.map((user) => normalizeImportKey(user.institutionCode)).filter(Boolean));
  for (const institution of institutions) {
    if (!activeUserInstitutionCodes.has(normalizeImportKey(institution.institutionCode))) {
      issues.push({
        id: `institution-without-user-${institution.id}`,
        type: "institution_without_active_user",
        targetKind: "institution",
        targetId: institution.id,
        record: `${institution.institutionName} (${institution.institutionCode})`,
        description: "Aktif kurum kaydına bağlı aktif app_user bulunmuyor.",
        suggestion: "Bu kurum takip edilecekse aktif kullanıcı oluşturun; değilse kurumu pasifleştirin.",
      });
    }
  }

  for (const user of users) {
    const emailKey = getAppUserEmail(user);
    if (emailKey) usersByEmailGroups.set(emailKey, [...(usersByEmailGroups.get(emailKey) ?? []), user]);

    if (!emailKey) {
      issues.push({
        id: `user-missing-email-${user.id}`,
        type: "user_missing_email",
        targetKind: "user",
        targetId: user.id,
        record: user.name,
        description: "Kullanıcının e-posta bilgisi eksik.",
        suggestion: "Kullanıcı e-postasını tamamlayın veya kaydı pasifleştirin.",
      });
    }

    if (!user.authUserId) {
      issues.push({
        id: `user-missing-auth-${user.id}`,
        type: "app_user_no_auth",
        targetKind: "user",
        targetId: user.id,
        record: `${user.name} (${user.email})`,
        description: "app_user var fakat authUserId boş (backend onarım gerekir).",
        suggestion: "Backend repair endpointi hazır olduğunda yönetici onarımı çalıştırılmalıdır.",
      });
    }

    if (user.isActive && !user.deletedAt && user.role !== "super_admin" && !user.isAdmin && !user.institutionCode) {
      issues.push({
        id: `user-missing-institution-code-${user.id}`,
        type: "app_user_missing_institution_code",
        targetKind: "user",
        targetId: user.id,
        record: `${user.name} (${user.email})`,
        description: "Aktif yurt/kurum hesabında institutionCode boş.",
        suggestion: "Kullanıcıyı kurum envanterine bağlayın.",
      });
    }

    const userInstitutionCode = normalizeImportKey(user.institutionCode);
    if (!user.district || !user.institutionCode) {
      issues.push({
        id: `user-missing-${user.id}`,
        type: "user_missing_institution",
        targetKind: "user",
        targetId: user.id,
        record: `${user.name} (${user.email})`,
        description: "Kullanıcının mıntıka veya kurum eşleşmesi eksik.",
        suggestion: "Kullanıcıyı bir mıntıka ve kuruma eşleştirin.",
      });
    } else if (!institutionCodes.has(userInstitutionCode)) {
      const inactiveMatch = inactiveInstitutionCodes.has(userInstitutionCode);
      issues.push({
        id: inactiveMatch ? `user-inactive-institution-${user.id}` : `user-orphan-${user.id}`,
        type: inactiveMatch ? "user_inactive_institution" : "user_orphan_institution",
        targetKind: "user",
        targetId: user.id,
        record: `${user.name} (${user.institutionCode})`,
        description: inactiveMatch
          ? "Kullanıcı pasif/silinmiş bir kurum kaydına bağlı."
          : "Kullanıcının kurum kodu aktif envanterde bulunamadı.",
        suggestion: inactiveMatch
          ? "Kullanıcıyı aktif canonical kurum kaydına bağlayın."
          : "Kurum kodunu düzeltin veya kurum kaydını oluşturun.",
      });
    }
  }

  for (const record of rawUserRecords) {
    if (!appUserRecordNeedsEmailRepair(record)) continue;
    const user = appUserFromRecord(record);
    const canonical = getAppUserEmail(record);
    issues.push({
      id: `user-repairable-email-${record.id}`,
      type: "user_repairable_email",
      targetKind: "user",
      targetId: String(record.id),
      record: `${user.name} (${canonical})`,
      description: "E-posta alanı boş ama loginEmail/generatedEmail/data.email dolu; kayıt onarılabilir.",
      suggestion: "Veri Onar işlemini çalıştırın veya kullanıcı bir kez giriş yaptığında email alanı otomatik tamamlanır.",
    });
  }

  for (const [email, group] of usersByEmailGroups.entries()) {
    if (group.length <= 1) continue;
    const activeGroup = group.filter((u) => u.isActive && !u.deletedAt);
    if (activeGroup.length > 1) {
      issues.push({
        id: `user-duplicate-active-email-${email}`,
        type: "duplicate_app_user_email",
        targetKind: "user",
        targetId: activeGroup[0]?.id ?? null,
        record: email,
        description: `${activeGroup.length} aktif app_user aynı e-postayı kullanıyor (login candidateCount karışabilir).`,
        suggestion: "Fazla kayıtları pasifleştirin; kurum bilgisi dolu olanı birincil bırakın.",
      });
    }
    issues.push({
      id: `user-duplicate-email-${email}`,
      type: "user_duplicate_email",
      targetKind: "user",
      targetId: group[0]?.id ?? null,
      record: email,
      description: `${group.length} aktif kullanıcı aynı e-posta adresini kullanıyor.`,
      suggestion: "Aynı e-postaya sahip kullanıcı kayıtlarını kontrol edip fazla olanları pasifleştirin.",
    });
  }

  for (const log of logs) {
    if (!log.institutionCode || !log.institutionName || !log.district) {
      issues.push({
        id: `activity-missing-institution-${log.id}`,
        type: "activity_missing_institution",
        targetKind: "activity",
        targetId: log.id,
        record: `${log.action} (${log.userName ?? log.userEmail ?? log.userId ?? "Kullanıcı"})`,
        description: "Aktivite kaydında kurum, yurt veya mıntıka bilgisi eksik.",
        suggestion: "Kullanıcının app_user kurum eşleşmesini kontrol edin; yeni aktiviteler app_user üzerinden otomatik tamamlanır.",
      });
    }
    if (log.userId && !userIds.has(log.userId)) {
      issues.push({
        id: `activity-user-${log.id}`,
        type: "activity_unmatched_user",
        targetKind: "activity",
        targetId: log.id,
        record: `${log.action} (${log.userName ?? log.userId})`,
        description: "Aktivite kaydı app_user kaydıyla eşleşmiyor.",
        suggestion: "Kullanıcı kayıtlarını kontrol edin.",
      });
    }
  }

  for (const request of supportRequests) {
    if (!request.institution_code || !request.district || !request.province) {
      issues.push({
        id: `support-missing-institution-${request.id}`,
        type: "support_missing_institution",
        targetKind: "registry",
        targetId: String(request.id),
        record: `${request.subject ?? "Destek"} (${request.userEmail ?? request.userName ?? "Kullanıcı"})`,
        description: "Destek mesajında kurum, mıntıka veya şehir bilgisi eksik.",
        suggestion: "Kullanıcının app_user kurum eşleşmesini kontrol edin; yeni destek kayıtları app_user üzerinden otomatik tamamlanır.",
      });
    }
  }

  const unmatchedUsers = users
    .filter((u) => !u.district || !u.institutionCode || !institutionCodes.has(normalizeImportKey(u.institutionCode)))
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      institutionCode: u.institutionCode,
      institutionName: u.institutionName,
      district: u.district,
    }));

  const score = issues.length === 0 ? 100 : Math.max(0, 100 - Math.min(100, issues.length * 8));
  return {
    score,
    issueCount: issues.length,
    summary: {
      users: users.length,
      institutions: institutions.length,
      activityLogs: logs.length,
      supportRequests: supportRequests.length,
      duplicateInstitutions: [...institutionsByComposite.values()].filter((group) => group.length > 1).length,
      duplicateUsers: [...usersByEmailGroups.values()].filter((group) => group.length > 1).length,
    },
    issues,
    unmatchedUsers,
  };
}

async function adminVeriSagligiAksiyonUygula(data: AdminVeriSagligiAksiyonRequest) {
  rejectClientSideRepair(`api.adminVeriSagligiAksiyon.${data.action}`);
}

async function deactivateInstitutionIfNoActiveUsers(institutionCode?: string | null) {
  if (!institutionCode) return;
  const activeUsers = (await appUserRecords({ active: "active" })).filter((user) => user.institutionCode === institutionCode);
  if (activeUsers.length > 0) return;
  const institutions = await institutionRecords({ institutionCode });
  const institution = institutions[0];
  if (!institution) return;
  const current = await backendApi.getRecord<InstitutionRecordData>(institution.id).catch(() => null);
  if (!current) return;
  await backendApi.updateRecord<InstitutionRecordData>(institution.id, "institution", {
    ...(current.data ?? {}),
    status: "inactive",
    deletedAt: current.data?.deletedAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

function profilFromRecord(record: BackendRecord<UserProfileRecordData>): KayitliProfil {
  const data = record.data ?? {};
  return {
    id: String(record.id),
    isim: String(data.isim ?? ""),
    kurumAdi: String(data.kurumAdi ?? ""),
    rol: String(data.rol ?? ""),
  };
}

function profilFromLocal(profile: { id: string; isim?: string; kurumAdi?: string; rol?: string }): KayitliProfil {
  return {
    id: String(profile.id),
    isim: String(profile.isim ?? ""),
    kurumAdi: String(profile.kurumAdi ?? ""),
    rol: String(profile.rol ?? ""),
  };
}

function institutionFromRecord(record: BackendRecord<InstitutionRecordData>): AdminYurtKayit {
  const data = record.data ?? {};
  const createdAt = data.createdAt ?? record.createdAt ?? record.created_at ?? new Date().toISOString();
  const updatedAt = data.updatedAt ?? record.updatedAt ?? record.updated_at ?? createdAt;
  return {
    id: String(record.id),
    institutionName: String(data.institutionName ?? ""),
    institutionCode: String(data.institutionCode ?? record.id),
    districtName: String(data.districtName ?? ""),
    province: data.province ?? null,
    expectedUserCount: typeof data.expectedUserCount === "number" ? data.expectedUserCount : null,
    status: String(data.status ?? "active"),
    notes: data.notes ?? null,
    createdAt,
    updatedAt,
  };
}

function kurumFromInstitution(institution: AdminYurtKayit): AdminKurum {
  return {
    institution_code: institution.institutionCode,
    institution_name: institution.institutionName,
    province: institution.province,
    district: institution.districtName,
    user_count: 0,
    today_active: 0,
    active_7d: 0,
    last_login_at: null,
    status: institution.status,
  };
}

function filterInstitutions<T extends { districtName: string; institutionCode: string; status?: string }>(
  institutions: T[],
  params: Record<string, string | undefined>,
): T[] {
  return institutions.filter((institution) => {
    if (params.district && normalizeImportKey(institution.districtName) !== normalizeImportKey(params.district)) {
      return false;
    }
    if (
      params.institutionCode &&
      normalizeImportKey(institution.institutionCode) !== normalizeImportKey(params.institutionCode)
    ) {
      return false;
    }
    if (params.status && institution.status !== params.status) return false;
    return true;
  });
}

async function institutionRecords(params: Record<string, string | undefined> = {}) {
  const records = await loadInstitutionRawRecords();
  const byKey = new Map<string, AdminYurtKayit>();
  for (const record of records.filter(activeInstitutionRecord)) {
    const institution = institutionFromRecord(record);
    const key = institutionCompositeKey(institution);
    const existing = byKey.get(key);
    byKey.set(key, existing ? canonicalInstitution(existing, institution) : institution);
  }
  const institutions = [...byKey.values()].sort((a, b) =>
    a.districtName.localeCompare(b.districtName, "tr") || a.institutionName.localeCompare(b.institutionName, "tr"),
  );
  return filterInstitutions(institutions, params);
}

export const api = {
  me: async () => {
    const r = await backendApi.me().catch((error) => {
      clearAuthState();
      throw error;
    });
    const user = kullaniciFromBackend(r.user ?? (r as BackendUser));
    if (!user) {
      clearAuthState();
      return { user: null };
    }
    if (isLocalDevApi()) {
      if (user.isActive === false) {
        clearAuthState();
        return { user: null };
      }
      return { user: normalizeAuthUser(user) };
    }
    if (user.isActive === false) {
      await backendApi.logout().catch(() => null);
      clearAuthState();
      return { user: null };
    }
    if (kullaniciAdminMi(user)) {
      return { user: normalizeAuthUser(user) };
    }
    const appUser = await findAppUserForAuthUserReadOnly(user, { loginLookup: true }).catch(() => null);
    if (!appUser || !appUser.authUserId || String(appUser.authUserId) !== String(user.id) || !appUserAktifMi(appUser)) {
      await backendApi.logout().catch(() => null);
      clearAuthState();
      return { user: null };
    }
    return { user: normalizeAuthUser(mergeKullaniciWithAppUser(user, appUser)) };
  },

  girisYap: async (email: string, password: string) => {
    const loginEmail = normalizeEmail(email);
    clearAuthState();
    let authUserFound = false;
    let appUserFound = false;
    try {
      const r = await backendApi.login({ email, password });
      const user = kullaniciFromBackend(r.user);
      if (!user) {
        throw new Error("Kullanıcı bilgisi alınamadı.");
      }
      authUserFound = true;

      if (isLocalDevApi()) {
        if (user.isActive === false) {
          throw new Error("Hesabınız pasif durumda. Lütfen yöneticinizle iletişime geçin.");
        }
        logLoginDiag(user, null);
        await activityRecordOlustur("login", { source: "local_auth_login" }).catch(() => null);
        logLoginLoadingFinalized(loginEmail, true);
        return { user: normalizeAuthUser(user) };
      }

      if (kullaniciAdminMi(user)) {
        logLoginDiag(user, null);
        await activityRecordOlustur("login", { source: "auth_login_admin" }).catch(() => null);
        logLoginLoadingFinalized(loginEmail, true);
        return { user: normalizeAuthUser(user) };
      }

      await logLoginRecordsScopeDiag({ id: user.id, email: user.email, name: user.name });

      const appUser = await findAppUserForAuthUserReadOnly(user, { loginLookup: true });
      appUserFound = Boolean(appUser);

      if (!appUser) {
        logLoginFlowStop({
          email: loginEmail,
          reason: "auth_ok_app_user_missing",
          authUserFound: true,
          appUserFound: false,
          attemptedAdminRepair: false,
          adminRepairStatus: "skipped_login",
          attemptedRegister: false,
          registerStatus: "skipped_login",
        });
        throw new Error(
          "Bu giriş hesabı auth sisteminde var ancak uygulama kullanıcı kaydıyla eşleşmemiş. Yönetici backend dry-run raporu sonrası kontrollü veri onarımı yapmalıdır.",
        );
      }

      if (!appUser.authUserId) {
        logLoginFlowStop({
          email: loginEmail,
          reason: "app_user_missing_auth_link",
          authUserFound: true,
          appUserFound: true,
          attemptedAdminRepair: false,
          adminRepairStatus: "skipped_login",
          attemptedRegister: false,
          registerStatus: "skipped_login",
        });
        throw new Error(
          "Bu kullanıcı için giriş hesabı henüz bağlanmamış. Yönetici backend veri onarım endpointini çalıştırmalı.",
        );
      }

      if (String(appUser.authUserId) !== String(user.id)) {
        logLoginFlowStop({
          email: loginEmail,
          reason: "app_user_auth_id_mismatch",
          authUserFound: true,
          appUserFound: true,
          attemptedAdminRepair: false,
          adminRepairStatus: "skipped_login",
          attemptedRegister: false,
          registerStatus: "skipped_login",
        });
        throw new Error(
          "Uygulama kullanıcı kaydı ile giriş hesabı eşleşmiyor. Yönetici backend veri onarım endpointini çalıştırmalı.",
        );
      }

      if (!appUserAktifMi(appUser)) {
        logLoginFlowStop({
          email: loginEmail,
          reason: "app_user_inactive",
          authUserFound: true,
          appUserFound: true,
          attemptedAdminRepair: false,
          adminRepairStatus: "skipped_login",
          attemptedRegister: false,
          registerStatus: "skipped_login",
        });
        throw new Error("Hesabınız pasif durumda. Lütfen yöneticinizle iletişime geçin.");
      }

      logLoginDiag(user, appUser);
      await activityRecordOlustur("login", { source: "auth_login" }).catch(() => null);
      logLoginLoadingFinalized(loginEmail, true);
      return { user: normalizeAuthUser(mergeKullaniciWithAppUser(user, appUser)) };
    } catch (error) {
      clearAuthState();
      const raw = error instanceof Error ? error.message : "login_failed";
      const lower = raw.toLocaleLowerCase("tr-TR");
      const looksLikeBadCredentials =
        lower.includes("401") ||
        lower.includes("403") ||
        lower.includes("invalid") ||
        lower.includes("hatalı") ||
        lower.includes("yanlış") ||
        lower.includes("credentials") ||
        lower.includes("unauthorized");
      const errorCode = raw;
      if (!authUserFound && looksLikeBadCredentials) {
        logLoginFlowStop({
          email: loginEmail,
          reason: "auth_login_failed",
          authUserFound: false,
          appUserFound: false,
          attemptedAdminRepair: false,
          adminRepairStatus: "skipped_login",
          attemptedRegister: false,
          registerStatus: "skipped_login",
        });
        logLoginLoadingFinalized(loginEmail, false, "auth_login_failed");
        throw new Error(backendHataMesaji(error));
      }
      logLoginLoadingFinalized(loginEmail, false, errorCode);
      throw error;
    }
  },

  kayitOl: async (email: string, password: string, name: string) => {
    clearAuthState();
    try {
      const r = await backendApi.register({ email, password, name });
      const user = kullaniciFromBackend(r.user);
      if (!user) {
        throw new Error("Kullanıcı bilgisi alınamadı.");
      }
      const appUser = zorunluAktifAppUser(user, await ensureAppUserForAuthUser(user).catch(() => null));
      await activityRecordOlustur("login", { source: "auth_register" }).catch(() => null);
      return { user: mergeKullaniciWithAppUser(user, appUser) };
    } catch (error) {
      clearAuthState();
      throw error;
    }
  },

  cikisYap: async () => {
    try {
      await backendApi.logout();
    } catch {
      /* yerel state yine de temizlenir */
    } finally {
      clearAuthState();
    }
    return { ok: true };
  },

  profilleriGetir: async () => {
    if (isLocalDevApi()) {
      const r = await backendApi.listProfiles().catch(() => ({ profiles: [] }));
      return { profiles: r.profiles.map(profilFromLocal) };
    }
    const records = await backendApi.listRecords<UserProfileRecordData>("user_profile");
    return { profiles: records.map(profilFromRecord) };
  },

  profilKaydet: async (data: { isim: string; kurumAdi: string; rol: string }) => {
    if (isLocalDevApi()) {
      const r = await backendApi.saveProfile(data);
      await activityRecordOlustur("profile_saved", { source: "local_profiles" }).catch(() => null);
      return { profile: profilFromLocal(r.profile) };
    }
    const now = new Date().toISOString();
    const me = await backendApi.me().catch(() => null);
    const user = me ? kullaniciFromBackend(me.user ?? (me as BackendUser)) : null;
    const record = await backendApi.createRecord<UserProfileRecordData>("user_profile", {
      ...data,
      userId: user?.id,
      updatedAt: now,
      createdAt: now,
    });
    await activityRecordOlustur("profile_saved", { source: "user_profile" }).catch(() => null);
    return { profile: profilFromRecord(record) };
  },

  profilSil: async (id: string) => {
    if (isLocalDevApi()) {
      return backendApi.deleteProfile(id);
    }
    return backendApi.deleteRecord(id);
  },

  /** @deprecated Afiş kaydı devre dışı — sunucu 410 döner. UI çağırmamalı. */
  afisleriGetir: async () => ({ posters: [] as KayitliAfis[] }),

  /** @deprecated Afiş kaydı devre dışı — sunucu 410 döner. UI çağırmamalı. */
  afisKaydet: async () => {
    throw new Error("Afiş kaydı devre dışı.");
  },

  /** @deprecated Afiş kaydı devre dışı — sunucu 410 döner. UI çağırmamalı. */
  afisGuncelle: async () => {
    throw new Error("Afiş kaydı devre dışı.");
  },

  /** @deprecated Afiş kaydı devre dışı — sunucu 410 döner. UI çağırmamalı. */
  afisSil: async () => ({ ok: true }),

  destekGonder: async (mesaj: string, imageBase64?: string) => {
    const appUser = await aktifKullaniciBaglami();
    const me = await backendApi.me().catch(() => null);
    const authUser = me ? kullaniciFromBackend(me.user ?? (me as BackendUser)) : null;
    const institution = appUser?.institutionCode
      ? (await institutionRecords({ institutionCode: appUser.institutionCode }).catch(() => []))[0] ?? null
      : null;
    const subject = "Destek Talebi";
    const now = new Date().toISOString();
    await backendApi.createRecord<SupportRequestRecordData>("support_request", {
      userId: appUser?.id ?? null,
      appUserId: appUser?.id ?? null,
      authUserId: authUser?.id ?? appUser?.authUserId ?? null,
      userEmail: appUser?.email ?? null,
      userName: appUser?.name ?? null,
      institutionId: appUser?.institutionId ?? institution?.id ?? null,
      subject,
      message: mesaj,
      imageBase64,
      status: "open",
      adminNote: null,
      createdAt: now,
      updatedAt: now,
      province: appUser?.province ?? institution?.province ?? null,
      district: appUser?.district ?? institution?.districtName ?? null,
      institutionName: appUser?.institutionName ?? institution?.institutionName ?? null,
      institutionCode: appUser?.institutionCode ?? institution?.institutionCode ?? null,
      metadata: {
        hasImage: Boolean(imageBase64),
        missingInstitutionContext: !appUser?.institutionCode || !appUser?.district || !appUser?.institutionName,
      },
    });
    console.log("[TEDRIS_SUPPORT_CREATED]", {
      userEmail: appUser?.email ?? authUser?.email ?? null,
      institutionCode: appUser?.institutionCode ?? institution?.institutionCode ?? null,
      subject,
    });
    await activityRecordOlustur("support_message_sent", { source: "support_request", subject }).catch(() => null);
    return { ok: true };
  },

  destekMesajlari: () =>
    destekKayitlari().then((requests) => ({ requests })),

  adminStats: async () => {
    const [users, support, logs] = await Promise.all([
      appUserRecords(),
      destekKayitlari(),
      loadActivityLogRecords().then((records) => records.map(activityFromRecord)),
    ]);
    return {
      totalUsers: users.length,
      totalPosters: logs.filter((l) => l.action === "export_png" || l.action === "export_pdf").length,
      totalSupport: support.length,
      dailyUsers: [],
      dailyPosters: [],
      recentUsers: users.slice(0, 5).map((u) => ({ id: u.id, name: u.name, email: u.email, created_at: u.createdAt })),
    };
  },

  adminOverview: async () => {
    const dashboard = await api.adminDashboard();
    const activity = await api.adminAktivite({ range: "7d" });
    return {
      totalUsers: dashboard.summary.totalUsers,
      todayLogins: dashboard.summary.todayActiveUsers,
      activeUsers7d: activity.summary.activeUsers,
      totalSupport: dashboard.summary.openSupport,
      activeInstitutions: dashboard.summary.active7dYurts,
      passiveInstitutions: dashboard.summary.passive7dYurts,
      totalPosters: activity.summary.exportPng + activity.summary.exportPdf,
      dailyLogins: [],
      districtActivityToday: dashboard.mintikaSummary.map((m) => ({
        district: m.districtName,
        province: "",
        today_count: m.todayActiveUsers,
      })),
      recentLogins: activity.logs.filter((l) => l.action === "login").slice(0, 10).map((l) => ({
        id: l.id,
        name: l.userName ?? "Kullanıcı",
        email: l.userEmail ?? "",
        institution_name: l.institutionName,
        district: l.district,
        province: l.province,
        role: "user",
        last_login_at: l.createdAt,
      })),
    };
  },

  adminFiltreler: async () => {
    const institutions = await institutionRecords();
    const viewer = await aktifKullaniciBaglami();
    const access = getReportAccessForUser(viewer);
    const scopedInstitutions =
      access.type === "mintika"
        ? institutions.filter((i) => isDistrictAllowedByReportAccess(access, i.districtName))
        : institutions;
    const provinces = [...new Set(scopedInstitutions.map((i) => i.province).filter((p): p is string => Boolean(p)))].sort((a, b) =>
      a.localeCompare(b, "tr"),
    );
    const districts = [...new Map(scopedInstitutions.map((i) => [i.districtName, {
      district: i.districtName,
      province: i.province ?? "",
    }])).values()].filter((d) => d.district).sort((a, b) => a.district.localeCompare(b.district, "tr"));
    return {
      provinces,
      districts,
      institutions: scopedInstitutions.map((i) => ({
        institution_code: i.institutionCode,
        institution_name: i.institutionName,
        district: i.districtName,
        province: i.province,
      })),
    };
  },

  adminMintikas: async (): Promise<string[]> => {
    const token = getBackendToken();
    if (!token) return [...TRACKED_DISTRICTS];
    const res = await fetch("/api/admin/mintikas", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [...TRACKED_DISTRICTS];
    const data = await res.json();
    return Array.isArray(data) ? data.map(String) : [...TRACKED_DISTRICTS];
  },

  adminKullanicilar: (params: Record<string, string | undefined> = {}) => listAdminKullanicilarForPanel(params),

  adminKullaniciOlustur: async (data: {
    email: string;
    password: string;
    name: string;
    province?: string;
    district?: string;
    institutionName?: string;
    institutionCode?: string;
    role?: KullaniciRol;
    isActive?: boolean;
    isAdmin?: boolean;
    reportScopeType?: string;
    reportScopeMintikas?: string[];
  }) => {
    const canonicalEmail = normalizeEmail(data.email);
    if (!canonicalEmail) throw new Error("Geçerli bir e-posta adresi girin.");

    const existing = await appUserByEmail(canonicalEmail);
    if (existing && !existing.deletedAt) throw new Error("Bu e-posta ile kullanıcı zaten var.");

    let authUser = kullaniciFromBackend((await registerAuthUserSafely({
      email: canonicalEmail,
      password: data.password,
      name: data.name,
    }))?.user);
    let authUserCreated = Boolean(authUser?.id);

    if (!authUser?.id) {
      const authFromList = await findAuthUserByEmailFromAuth(canonicalEmail, undefined, { allowAdminUsersList: true });
      if (authFromList?.id) {
        authUser = {
          id: String(authFromList.id),
          email: canonicalEmail,
          name: String(authFromList.name ?? data.name),
          isAdmin: Boolean(authFromList.isAdmin),
          role: typeof authFromList.role === "string" ? authFromList.role : undefined,
        };
        authUserCreated = false;
      }
    }

    const now = new Date().toISOString();
    const institutionId = await kurumIdBul(data.institutionCode);
    const role = data.role ?? (data.isAdmin ? "admin" : "user");
    const permissions = permissionDefaults(role, data.isAdmin, data.reportScopeType);
    const payload: AppUserRecordData = {
      id: authUser?.id ?? canonicalEmail,
      authUserId: authUser?.id,
      email: canonicalEmail,
      loginEmail: canonicalEmail,
      generatedEmail: canonicalEmail,
      name: data.name,
      role,
      isAdmin: data.isAdmin ?? role === "admin",
      isActive: data.isActive ?? true,
      status: data.isActive === false ? "inactive" : "active",
      district: data.district ?? null,
      province: data.province ?? null,
      institutionName: data.institutionName ?? null,
      institutionCode: data.institutionCode ?? null,
      institutionId,
      allowedDistricts: permissions.allowedDistricts,
      allowedCities: permissions.allowedCities,
      allowedInstitutions: data.institutionCode ? [data.institutionCode] : permissions.allowedInstitutions,
      reportPermissions: permissions.reportPermissions,
      reportScopeType: data.reportScopeType ?? permissions.reportScopeType,
      reportScopeMintikas: data.reportScopeMintikas ?? permissions.reportScopeMintikas,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: null,
      deletedAt: null,
    };
    const record = existing?.deletedAt
      ? await updateAppUserRecord(existing.id, payload)
      : await backendApi.createRecord<AppUserRecordData>("app_user", payload);
    let authUserLinked = false;
    if (authUser?.id && !payload.authUserId) {
      await updateAppUserRecord(record.id, { ...payload, authUserId: authUser.id }).catch(() => null);
      authUserLinked = true;
    } else if (authUser?.id) {
      authUserLinked = true;
    }
    const created = appUserFromRecord(record);
    console.log("[TEDRIS_USER_CREATE_FLOW]", {
      email: canonicalEmail,
      appUserCreated: true,
      appUserId: created.id,
      authUserCreated,
      authUserLinked,
      authUserId: authUser?.id ?? null,
      institutionCode: created.institutionCode,
      district: created.district,
    });
    return { user: created };
  },

  adminKullaniciGuncelle: async (id: string, data: Partial<AdminKullanici>) => {
    const current = await getAppUserRecord(id);
    const currentData = current.data ?? {};
    const role = data.role ?? currentData.role ?? (data.isAdmin || currentData.isAdmin ? "admin" : "user");
    const scopeType =
      data.reportScopeType ??
      currentData.reportScopeType ??
      (data.isAdmin ?? currentData.isAdmin ? "all" : "own");
    const permissions = permissionDefaults(role, data.isAdmin ?? currentData.isAdmin, scopeType);
    const institutionCode = data.institutionCode ?? currentData.institutionCode ?? null;
    const nextData: AppUserRecordData = {
      ...currentData,
      email: data.email ?? currentData.email ?? currentData.loginEmail ?? currentData.generatedEmail,
      loginEmail: data.email ?? currentData.loginEmail ?? currentData.email ?? currentData.generatedEmail,
      generatedEmail: data.email ?? currentData.generatedEmail ?? currentData.email ?? currentData.loginEmail,
      name: data.name ?? currentData.name,
      role,
      isAdmin: (data.isAdmin ?? currentData.isAdmin ?? role === "admin") || scopeType === "all",
      isActive: data.isActive ?? currentData.isActive ?? true,
      status: data.status ?? currentData.status ?? ((data.isActive ?? currentData.isActive) === false ? "inactive" : "active"),
      district: data.district ?? currentData.district ?? null,
      province: data.province ?? currentData.province ?? null,
      institutionName: data.institutionName ?? currentData.institutionName ?? null,
      institutionCode,
      institutionId: data.institutionId ?? currentData.institutionId ?? await kurumIdBul(institutionCode),
      allowedDistricts: data.allowedDistricts ?? currentData.allowedDistricts ?? permissions.allowedDistricts,
      allowedCities: data.allowedCities ?? currentData.allowedCities ?? permissions.allowedCities,
      allowedInstitutions: data.allowedInstitutions ?? currentData.allowedInstitutions ?? (institutionCode ? [institutionCode] : permissions.allowedInstitutions),
      reportPermissions: data.reportPermissions ?? currentData.reportPermissions ?? permissions.reportPermissions,
      reportScopeType: data.reportScopeType ?? permissions.reportScopeType ?? scopeType,
      reportScopeMintikas: data.reportScopeMintikas ?? currentData.reportScopeMintikas ?? permissions.reportScopeMintikas,
      updatedAt: new Date().toISOString(),
    };
    const record = await updateAppUserRecord(id, nextData);
    return { user: appUserFromRecord(record) };
  },

  adminSifreSifirla: async (id: string, opts?: { password?: string; generate?: boolean }) => {
    const current = await getAppUserRecord(id);
    const currentData = current.data ?? {};
    const appUser = appUserFromRecord(current);
    const email = getAppUserEmail(current) || appUser.email;
    let authUserId = currentData.authUserId ?? appUser.authUserId ?? null;
    let authUserFoundByEmail = false;

    if (!authUserId && email) {
      const auth = await findAuthUserByEmailFromAuth(email);
      if (auth?.id) {
        authUserId = String(auth.id);
        authUserFoundByEmail = true;
        await updateAppUserRecord(id, {
          ...currentData,
          authUserId,
          email,
          loginEmail: currentData.loginEmail ?? email,
          generatedEmail: currentData.generatedEmail ?? email,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    if (!authUserId) {
      console.log("[TEDRIS_PASSWORD_RESET_DIAG]", {
        email,
        appUserId: id,
        authUserId: null,
        authUserFoundByEmail: false,
        authUserUpdated: false,
        reason: "auth_user_missing",
      });
      throw new Error("Bu kullanıcı için gerçek giriş hesabı bulunamadı. Önce auth hesabı oluşturulmalı.");
    }

    let reset: { ok?: boolean; password?: string };
    try {
      reset = await backendApi.resetAuthPassword(authUserId, opts ?? { generate: true });
    } catch (error) {
      console.log("[TEDRIS_PASSWORD_RESET_DIAG]", {
        email,
        appUserId: id,
        authUserId,
        authUserFoundByEmail,
        authUserUpdated: false,
        reason: error instanceof Error ? error.message : "reset_failed",
      });
      throw new Error("Şifre değiştirilemedi. Auth sunucusu şifre güncellemesini reddetti.");
    }

    if (!reset?.ok && !reset?.password) {
      console.log("[TEDRIS_PASSWORD_RESET_DIAG]", {
        email,
        appUserId: id,
        authUserId,
        authUserFoundByEmail,
        authUserUpdated: false,
        reason: "empty_reset_response",
      });
      throw new Error("Şifre sıfırlama yanıtı alınamadı. İşlem tamamlanmadı.");
    }

    await updateAppUserRecord(id, {
      ...currentData,
      authUserId,
      email,
      passwordResetAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log("[TEDRIS_PASSWORD_RESET_DIAG]", {
      email,
      appUserId: id,
      authUserId,
      authUserFoundByEmail,
      authUserUpdated: true,
      reason: "ok",
    });
    return { ok: true, password: reset.password };
  },

  adminKullaniciSil: async (id: string) => {
    const userBeforeDelete = await getAppUserRecord(id).then(appUserFromRecord).catch(() => null);
    const r = await api.adminKullaniciGuncelle(id, {
      isActive: false,
      status: "deleted",
      deletedAt: new Date().toISOString(),
    } as Partial<AdminKullanici>);
    await deactivateInstitutionIfNoActiveUsers(userBeforeDelete?.institutionCode ?? r.user.institutionCode).catch(() => null);
    console.log("[TEDRIS_DISABLE_USER_DIAG]", {
      email: r.user.email,
      appUserUpdated: true,
      authUserDisabled: false,
      isActive: r.user.isActive,
      status: r.user.status ?? "deleted",
    });
    console.log("[TEDRIS_USER_DELETE]", {
      email: r.user.email,
      institutionCode: r.user.institutionCode,
      userStatus: r.user.status ?? "deleted",
      institutionStatus: "inactive_if_no_active_users",
    });
    return { ok: true, user: r.user };
  },

  adminTopluKurumImport: async (data: AdminImportCommitRequest) => {
    const institutions = await institutionRecords();
    const institutionCodes = new Set(institutions.map((i) => normalizeImportKey(i.institutionCode)));
    const institutionKeys = new Set(institutions.map((i) => institutionCompositeKey(i)));
    const rawUserRecords = await loadAppUserRawRecords();
    const users = rawUserRecords.map(appUserFromRecord);
    const emails = new Set(users.map((u) => getAppUserEmail(u)).filter(Boolean));
    const usersByEmail = new Map<string, AdminKullanici>(
      users.flatMap((u) => {
        const email = getAppUserEmail(u);
        return email ? [[email, u] as const] : [];
      }),
    );
    const byDistrict: Record<string, number> = {};
    const errors: AdminImportCommitResponse["errors"] = [];
    let addedInstitutions = 0;
    let existingInstitutions = 0;
    let skippedRows = 0;
    let createdUsers = 0;
    let existingUsers = 0;
    const seenCodes = new Set<string>();
    const seenKeys = new Set<string>();
    const shouldCreateUsers = data.createUsers !== false;

    for (const row of data.rows) {
      const district = row.district?.trim();
      const institutionName = row.institutionName?.trim();
      if (!district || !institutionName) {
        skippedRows += 1;
        errors.push({ rowNumber: row.rowNumber, district, institutionName, email: row.email, reason: "Mıntıka veya kurum adı eksik." });
        continue;
      }
      const institutionCode = row.institutionCode?.trim() || kurumKoduUret(district, institutionName) || kurumKoduOner(district, institutionName);
      const codeKey = normalizeImportKey(institutionCode);
      const compositeKey = institutionCompositeKey({ institutionName, districtName: district, province: row.province });
      if (seenCodes.has(codeKey) || seenKeys.has(compositeKey)) {
        skippedRows += 1;
        errors.push({ rowNumber: row.rowNumber, district, institutionName, institutionCode, email: row.email, reason: "Dosya içinde mükerrer kurum satırı." });
        continue;
      }
      seenCodes.add(codeKey);
      seenKeys.add(compositeKey);
      byDistrict[district] = (byDistrict[district] ?? 0) + 1;
      if (institutionCodes.has(codeKey) || institutionKeys.has(compositeKey)) {
        existingInstitutions += 1;
      } else {
        await api.adminYurtKayitOlustur({
          institutionName,
          districtName: district,
          province: row.province,
          institutionCode,
          status: "active",
        });
        institutionCodes.add(codeKey);
        institutionKeys.add(compositeKey);
        addedInstitutions += 1;
      }

      if (shouldCreateUsers) {
        const generatedEmail = row.email?.trim() || generatedInstitutionEmail(district, institutionName, emails);
        const email = normalizeEmail(generatedEmail);
        if (!email) {
          skippedRows += 1;
          errors.push({ rowNumber: row.rowNumber, district, institutionName, institutionCode, reason: "Otomatik e-posta üretilemedi." });
          continue;
        }
        const existingUser = usersByEmail.get(email);
        if (existingUser && existingUser.isActive && !existingUser.deletedAt && existingUser.status !== "inactive" && existingUser.status !== "deleted") {
          existingUsers += 1;
        } else if (existingUser) {
          await api.adminKullaniciGuncelle(existingUser.id, {
            email,
            name: existingUser.name || institutionName,
            district,
            province: row.province,
            institutionName,
            institutionCode,
            isActive: true,
            status: "active",
            deletedAt: null,
          } as Partial<AdminKullanici>);
          existingUsers += 1;
        } else {
          await api.adminKullaniciOlustur({
            email,
            password: data.defaultPassword || "Nehari2026",
            name: row.name || institutionName,
            district,
            province: row.province,
            institutionName,
            institutionCode,
            role: "user",
            isActive: true,
            isAdmin: false,
          });
          emails.add(email);
          usersByEmail.set(email, {
            id: email,
            email,
            name: row.name || institutionName,
            role: "user",
            isAdmin: false,
            isActive: true,
            status: "active",
            district,
            province: row.province ?? null,
            institutionName,
            institutionCode,
            institutionId: null,
            lastLoginAt: null,
            createdAt: new Date().toISOString(),
          });
          createdUsers += 1;
        }
      }
    }

    return {
      ok: true,
      readRows: data.totalRows ?? data.rows.length,
      validRows: (data.totalRows ?? data.rows.length) - skippedRows,
      addedInstitutions,
      existingInstitutions,
      skippedRows,
      createdUsers,
      existingUsers,
      byDistrict,
      errors,
    };
  },

  adminBugunGirisler: async (params: Record<string, string | undefined> = {}) => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const users = await appUserRecords();
    const usersByEmail = appUserByEmailMap(users);
    const usersById = appUserByIdMap(users);
    const institutionsByCode = institutionByCodeMap(await institutionRecords());
    const logs = (await loadActivityLogRecords())
      .map(activityFromRecord)
      .map((log) => enrichActivityLog(log, usersByEmail, institutionsByCode, usersById))
      .filter((log) => {
        if (log.action !== "login") return false;
        if (Date.parse(log.createdAt) < todayStart.getTime()) return false;
        return logMatchesGeoFilter(log, params);
      })
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    const logins = logs.map((log) => {
      const user = log.userEmail ? usersByEmail.get(normalizeEmail(log.userEmail)) : undefined;
      return {
        id: log.userId ?? log.id,
        email: log.userEmail ?? user?.email ?? "",
        name: log.userName ?? user?.name ?? "Kullanıcı",
        province: log.province,
        district: log.district,
        institutionName: log.institutionName,
        institutionCode: log.institutionCode,
        role: user?.role ?? "user",
        isActive: user?.isActive ?? true,
        isAdmin: user?.isAdmin ?? false,
        lastLoginAt: log.createdAt,
        createdAt: user?.createdAt ?? log.createdAt,
        login_time: log.createdAt,
      } satisfies AdminKullanici;
    });
    return { count: logins.length, logins };
  },

  adminKurumlar: async (params: Record<string, string | undefined> = {}) => {
    const institutions = await institutionRecords(params);
    return { institutions: institutions.map(kurumFromInstitution) };
  },

  adminKullanimTakibi: async (_type: string, params: Record<string, string | undefined> = {}) => ({
    users: await appUserRecords(params),
    inactiveInstitutions: (await api.adminYurtTakibi(params)).yurts.filter((y) => y.activityStatus !== "bugun_aktif"),
  }),

  adminBolgeRaporu: async (params: Record<string, string | undefined> = {}) => {
    const dashboard = await api.adminDashboard(params);
    return {
      summary: dashboard.summary as unknown as Record<string, number>,
      users: await appUserRecords(params),
    };
  },

  adminDestek: async () => ({ requests: await destekKayitlari() }),

  adminDestekGuncelle: async (id: string | number, data: { status?: string; adminNote?: string }) => {
    const current = await backendApi.getRecord<SupportRequestRecordData>(id);
    await backendApi.updateRecord<SupportRequestRecordData>(id, "support_request", {
      ...(current.data ?? {}),
      status: data.status ?? current.data?.status ?? "open",
      adminNote: data.adminNote ?? current.data?.adminNote ?? null,
      updatedAt: new Date().toISOString(),
    });
    return { ok: true };
  },

  adminSlugOner: async (district: string, institutionName: string) => ({
    code: kurumKoduOner(district, institutionName),
  }),

  adminTrackedDistricts: async () => {
    const records = await backendApi.listRecords<InstitutionRecordData>("institution").catch(() => []);
    const districts = new Set<string>(TRACKED_DISTRICTS);
    for (const record of records) {
      const district = record.data?.districtName?.trim();
      if (district) districts.add(district);
    }
    return { districts: [...districts].sort((a, b) => a.localeCompare(b, "tr")) };
  },

  adminSettings: async () => {
    const record = await adminSettingsRecord();
    return {
      settings: {
        periodStart: record?.data?.periodStart ?? null,
        periodEnd: record?.data?.periodEnd ?? null,
        seasonStart: record?.data?.seasonStart ?? null,
        seasonEnd: record?.data?.seasonEnd ?? null,
      },
    };
  },

  adminSettingsKaydet: (data: {
    periodStart?: string;
    periodEnd?: string;
    seasonStart?: string;
    seasonEnd?: string;
  }) => adminSettingsRecord().then(async (record) => {
    const payload: AdminSettingRecordData = {
      key: "default",
      periodStart: data.periodStart || null,
      periodEnd: data.periodEnd || null,
      seasonStart: data.seasonStart || null,
      seasonEnd: data.seasonEnd || null,
      updatedAt: new Date().toISOString(),
    };
    const saved = record
      ? await backendApi.updateRecord<AdminSettingRecordData>(record.id, "admin_setting", payload)
      : await backendApi.createRecord<AdminSettingRecordData>("admin_setting", payload);
    return { ok: true, settings: saved.data ?? payload };
  }),

  adminDashboard: async (params: Record<string, string | undefined> = {}) => {
    const data = await raporVerisi(params);
    const summary = {
      totalDistricts: data.mintikalar.length,
      totalYurts: data.institutions.length,
      totalUsers: data.users.length,
      todayActiveYurts: data.yurts.filter((y) => y.todayLoginUsers > 0).length,
      todayActiveUsers: new Set(data.allLogs.filter((l) => l.action === "login" && Date.parse(l.createdAt) >= new Date().setHours(0, 0, 0, 0)).map((l) => l.userId || l.userName).filter(Boolean)).size,
      active7dYurts: data.yurts.filter((y) => y.logins7d > 0).length,
      passive7dYurts: data.yurts.filter((y) => y.activityStatus === "pasif_7" || y.activityStatus === "pasif_30").length,
      neverLoginYurts: data.yurts.filter((y) => y.activityStatus === "hic_giris_yok").length,
      openSupport: data.yurts.reduce((sum, y) => sum + y.openSupport, 0),
      dataIssueCount: data.users.filter((u) => !u.institutionCode || !u.district).length,
      unmatchedUsers: data.users.filter((u) => !u.institutionCode || !u.district).length,
    };
    return {
      range: data.range,
      hasActivityLogs: data.allLogs.length > 0,
      summary,
      mintikaSummary: data.mintikalar,
      attentionYurts: data.yurts
        .filter((y) => y.activityStatus === "pasif_7" || y.activityStatus === "pasif_30" || y.activityStatus === "hic_giris_yok")
        .slice(0, 12),
    };
  },

  adminMintikaBoard: async (params: Record<string, string | undefined> = {}) => {
    const data = await raporVerisi(params);
    return {
      range: data.range,
      hasActivityLogs: data.allLogs.length > 0,
      mintikalar: data.mintikalar,
    };
  },

  adminYurtTakibi: async (params: Record<string, string | undefined> = {}) => {
    const data = await raporVerisi(params);
    return {
      range: data.range,
      hasActivityLogs: data.allLogs.length > 0,
      yurts: data.yurts,
      total: data.yurts.length,
    };
  },

  adminRepairUsers,
  repairAppUserAuthLinks,
  reconcileAppUsersAndAuthUsers: () => adminRepairUsers(),

  adminVeriSagligi: () => veriSagligiUret(),

  adminVeriSagligiAksiyon: (data: AdminVeriSagligiAksiyonRequest) =>
    adminVeriSagligiAksiyonUygula(data),

  adminAktivite: async (params: Record<string, string | undefined> = {}) => {
    const range = tarihAraligi(params);
    const start = Date.parse(range.startIso);
    const end = Date.parse(range.endIso);
    const [records, users, institutions] = await Promise.all([
      loadActivityLogRecords(),
      appUserRecords(),
      institutionRecords(),
    ]);
    const usersByEmail = appUserByEmailMap(users);
    const usersById = appUserByIdMap(users);
    const institutionsByCode = institutionByCodeMap(institutions);
    let logs = records
      .map(activityFromRecord)
      .map((log) => enrichActivityLog(log, usersByEmail, institutionsByCode, usersById))
      .filter((log) => {
        const time = Date.parse(log.createdAt);
        if (!Number.isFinite(time) || time < start || time > end) return false;
        if (params.action && log.action !== params.action) return false;
        return logMatchesGeoFilter(log, params);
      });
    logs = activityYetkiFiltresi(logs, await aktifKullaniciBaglami());
    logs.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    const activeUsers = new Set(logs.map((l) => l.userId || l.userName).filter(Boolean)).size;
    const activeYurts = new Set(logs.map((l) => normalizeImportKey(l.institutionCode)).filter(Boolean)).size;
    return {
      range,
      hasActivityLogs: logs.length > 0,
      logs,
      summary: {
        loginCount: logs.filter((l) => l.action === "login").length,
        activeYurts,
        activeUsers,
        exportPng: logs.filter((l) => l.action === "export_png").length,
        exportPdf: logs.filter((l) => l.action === "export_pdf").length,
        shareWhatsapp: logs.filter((l) => l.action === "share_whatsapp").length,
        supportCreated: logs.filter((l) => l.action === "support_message_sent" || l.action === "support_created").length,
      },
    };
  },

  adminYurtKayitlari: async (params: Record<string, string | undefined> = {}) => ({
    institutions: await institutionRecords(params),
  }),

  adminYurtKayitOlustur: async (data: {
    institutionName: string;
    districtName: string;
    province?: string;
    institutionCode?: string;
    expectedUserCount?: number;
    status?: string;
    notes?: string;
  }) => {
    const now = new Date().toISOString();
    const record = await backendApi.createRecord<InstitutionRecordData>("institution", {
      institutionName: data.institutionName,
      institutionCode: data.institutionCode?.trim() || kurumKoduOner(data.districtName, data.institutionName),
      districtName: data.districtName,
      province: data.province ?? null,
      expectedUserCount: data.expectedUserCount ?? null,
      status: data.status ?? "active",
      notes: data.notes ?? null,
      createdAt: now,
      updatedAt: now,
    });
    return { institution: institutionFromRecord(record) };
  },

  adminYurtKayitGuncelle: (
    id: string,
    data: Partial<{
      institutionName: string;
      districtName: string;
      province: string;
      institutionCode: string;
      expectedUserCount: number;
      status: string;
      notes: string;
    }>,
  ) => backendApi.getRecord<InstitutionRecordData>(id).then(async (current) => {
    const currentData = current.data ?? {};
    const nextData: InstitutionRecordData = {
      ...currentData,
      ...data,
      province: data.province ?? currentData.province ?? null,
      expectedUserCount: data.expectedUserCount ?? currentData.expectedUserCount ?? null,
      notes: data.notes ?? currentData.notes ?? null,
      updatedAt: new Date().toISOString(),
    };
    if (!nextData.institutionCode && nextData.districtName && nextData.institutionName) {
      nextData.institutionCode = kurumKoduOner(nextData.districtName, nextData.institutionName);
    }
    const record = await backendApi.updateRecord<InstitutionRecordData>(id, "institution", nextData);
    return { institution: institutionFromRecord(record) };
  }),

  activityLog: async (action: string) => {
    await activityRecordOlustur(action);
    return { ok: true };
  },

  adminReconcile: async () => {
    rejectClientSideRepair("api.adminReconcile");
  },
};

export interface AdminRange {
  preset: string;
  label: string;
  startIso: string;
  endIso: string;
  warning?: string;
}

export interface AdminYurtMetrik {
  id: string | null;
  institutionCode: string;
  institutionName: string;
  districtName: string;
  province: string | null;
  userCount: number;
  todayLoginUsers: number;
  loginsInRange: number;
  logins7d: number;
  logins30d: number;
  lastLoginAt: string | null;
  lastActivityAt: string | null;
  openSupport: number;
  activityStatus: string;
  registryStatus: string;
  inRegistry: boolean;
  notes: string | null;
  hasDataGap: boolean;
  exportPng?: number;
  exportPdf?: number;
  shareWhatsapp?: number;
}

export interface AdminMintikaMetrik {
  districtName: string;
  totalYurts: number;
  totalUsers: number;
  todayActiveYurts: number;
  todayActiveUsers: number;
  active7dYurts: number;
  passive7dYurts: number;
  neverLoginYurts: number;
  openSupport: number;
  lastMovementAt: string | null;
  usageRate: number | null;
  healthScore: number | null;
  healthLabel: string;
}

export interface AdminDashboard {
  range: AdminRange;
  hasActivityLogs: boolean;
  activityWarning?: string;
  dataQualityWarning?: string;
  summary: {
    totalDistricts: number;
    totalYurts: number;
    totalUsers: number;
    todayActiveYurts: number;
    todayActiveUsers: number;
    active7dYurts: number;
    passive7dYurts: number;
    neverLoginYurts: number;
    openSupport: number;
    dataIssueCount: number;
    unmatchedUsers: number;
  };
  mintikaSummary: AdminMintikaMetrik[];
  attentionYurts: AdminYurtMetrik[];
}

export interface AdminDataHealthIssue {
  id: string;
  type: string;
  targetKind?: "user" | "institution" | "activity" | "registry";
  targetId?: string | null;
  record: string;
  description: string;
  suggestion: string;
}

export interface AdminImportCommitRequest {
  rows: {
    rowNumber?: number;
    district: string;
    institutionName: string;
    institutionCode?: string;
    email?: string;
    name?: string;
    province?: string;
  }[];
  totalRows?: number;
  createUsers?: boolean;
  defaultPassword?: string;
}

export interface AdminImportCommitResponse {
  ok: boolean;
  readRows: number;
  validRows?: number;
  addedInstitutions: number;
  existingInstitutions: number;
  skippedRows: number;
  createdUsers: number;
  existingUsers: number;
  byDistrict: Record<string, number>;
  errors: { rowNumber?: number; district?: string; institutionName?: string; institutionCode?: string; email?: string; reason: string }[];
}

export interface AdminVeriSagligiAksiyonRequest {
  action: "match" | "deactivate" | "ignore" | "repair_auth";
  userIds?: string[];
  issueIds?: string[];
  district?: string;
  institutionName?: string;
  institutionCode?: string;
}

export interface AdminVeriSagligi {
  score: number | null;
  issueCount: number;
  summary?: {
    users: number;
    institutions: number;
    activityLogs: number;
    supportRequests?: number;
    duplicateInstitutions: number;
    duplicateUsers: number;
  };
  issues: AdminDataHealthIssue[];
  unmatchedUsers: {
    id: string;
    name: string;
    email: string;
    institutionCode: string | null;
    institutionName: string | null;
    district: string | null;
  }[];
}

export interface AdminAktiviteLog {
  id: string;
  createdAt: string;
  action: string;
  userId: string | null;
  appUserId?: string | null;
  authUserId?: string | null;
  userEmail?: string | null;
  userName: string | null;
  institutionId?: string | null;
  institutionCode: string | null;
  institutionName: string | null;
  district: string | null;
  province: string | null;
  metadata: unknown;
}

export interface AdminAktiviteResponse {
  range: AdminRange;
  hasActivityLogs: boolean;
  warning?: string;
  logs: AdminAktiviteLog[];
  summary: {
    loginCount: number;
    activeYurts: number;
    activeUsers: number;
    exportPng: number;
    exportPdf: number;
    shareWhatsapp: number;
    supportCreated: number;
  };
}

export interface AdminYurtKayit {
  id: string;
  institutionName: string;
  institutionCode: string;
  districtName: string;
  province: string | null;
  expectedUserCount: number | null;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
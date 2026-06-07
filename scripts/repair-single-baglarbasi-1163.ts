/**
 * Bağlarbaşı tek kayıt onarımı — yalnızca app_user 1163, auth id 31.
 *
 * Kullanım:
 *   DRY_RUN=true  pnpm run repair:baglarbasi
 *   DRY_RUN=false pnpm run repair:baglarbasi
 *
 * Gerekli env: VPS_API_BASE_URL, VPS_PROJECT_API_KEY, ADMIN_JWT, ADMIN_API_KEY
 * (.env.local içinde VITE_* alias'ları da okunur)
 *
 * GET yedek: /records/1163 (JWT + X-Project-Key)
 * PUT onarım: /admin/records/1163 (+ X-Admin-Key, yalnızca DRY_RUN=false)
 */
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

interface AppUserRecordData {
  id?: string;
  authUserId?: string;
  email?: string;
  loginEmail?: string;
  generatedEmail?: string;
  institutionCode?: string | null;
  institutionName?: string | null;
  district?: string | null;
  province?: string | null;
  status?: string;
  isActive?: boolean;
  deletedAt?: string | null;
  name?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

interface BackendRecord<T = AppUserRecordData> {
  id: string | number;
  userId?: string | number;
  data?: T;
  payload?: T;
}

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function normalizeEmail(value?: string | null): string {
  return (value ?? "").trim().toLocaleLowerCase("tr-TR");
}

function appUserDataFromRecord(record: BackendRecord<AppUserRecordData>): AppUserRecordData {
  const payload = record.data ?? record.payload ?? {};
  const inner = (payload as { data?: AppUserRecordData }).data ?? {};
  const merged: AppUserRecordData = { ...inner, ...payload };
  delete (merged as { data?: unknown }).data;
  const email =
    normalizeEmail(merged.email) ||
    normalizeEmail(merged.loginEmail) ||
    normalizeEmail(merged.generatedEmail);
  return {
    ...merged,
    email: email || merged.email,
    loginEmail: (merged.loginEmail as string) ?? email,
    generatedEmail: (merged.generatedEmail as string) ?? email,
  };
}

const APP_USER_ID = "1163";
const AUTH_USER_ID = 31;
const TARGET_EMAIL = "burdurbaglarbasi@gmail.com";
const INSTITUTION_CODE = "burdur-baglarbasi";

function loadEnvFile(path: string) {
  const raw = readFileSync(path, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const k = m[1].trim();
    const v = m[2].trim().replace(/^["']|["']$/g, "");
    if (!process.env[k]) process.env[k] = v;
  }
}

function loadLocalEnv() {
  for (const path of [join(process.cwd(), ".env.local"), join(REPO_ROOT, ".env.local")]) {
    try {
      loadEnvFile(path);
    } catch {
      /* optional */
    }
  }
  if (!process.env.VPS_API_BASE_URL && process.env.VITE_API_BASE_URL) {
    process.env.VPS_API_BASE_URL = process.env.VITE_API_BASE_URL;
  }
  if (!process.env.VPS_PROJECT_API_KEY && process.env.VITE_PROJECT_API_KEY) {
    process.env.VPS_PROJECT_API_KEY = process.env.VITE_PROJECT_API_KEY;
  }
}

function requireEnv(name: string, ...aliases: string[]): string {
  const keys = [name, ...aliases];
  for (const key of keys) {
    const v = process.env[key]?.trim();
    if (v) return v;
  }
  console.error(`[repair-1163] Eksik env: ${keys.join(" veya ")}`);
  process.exit(1);
}

function isDryRun(): boolean {
  const raw = (process.env.DRY_RUN ?? "true").trim().toLowerCase();
  return raw === "true" || raw === "1" || raw === "yes";
}

function backupDir(): string {
  const dir = join(REPO_ROOT, "backups", "repair-baglarbasi-1163");
  mkdirSync(dir, { recursive: true });
  return dir;
}

function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function writeJson(path: string, payload: unknown) {
  writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`[repair-1163] wrote ${path}`);
}

async function vpsRequest<T>(
  baseUrl: string,
  projectKey: string,
  bearer: string,
  method: string,
  path: string,
  body?: unknown,
  opts?: { adminApiKey?: string },
): Promise<{ ok: boolean; status: number; data: T; text: string }> {
  const url = `${baseUrl.replace(/\/+$/, "")}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
    "X-Project-Key": projectKey,
    Authorization: `Bearer ${bearer}`,
  };
  if (opts?.adminApiKey) {
    headers["X-Admin-Key"] = opts.adminApiKey;
  }
  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: T = {} as T;
  try {
    data = text ? (JSON.parse(text) as T) : ({} as T);
  } catch {
    data = { message: text } as T;
  }
  return { ok: res.ok, status: res.status, data, text };
}

function normalizeRecord<T>(payload: unknown): BackendRecord<T> {
  if (!payload || typeof payload !== "object") {
    throw new Error("Geçersiz kayıt yanıtı");
  }
  const p = payload as { record?: BackendRecord<T> } & BackendRecord<T>;
  if (p.record && typeof p.record === "object") return p.record;
  const id = p.id;
  const isRecordId = typeof id === "number" || (typeof id === "string" && /^\d+$/.test(id));
  if (isRecordId && (p.data != null || p.recordType != null || p.record_type != null)) {
    return p as BackendRecord<T>;
  }
  throw new Error("Kayıt id bulunamadı (VPS yanıtı beklenen formatta değil)");
}

function buildMergedData(existing: AppUserRecordData): AppUserRecordData {
  const email = normalizeEmail(TARGET_EMAIL);
  const now = new Date().toISOString();
  return {
    ...existing,
    authUserId: String(AUTH_USER_ID),
    email,
    loginEmail: email,
    generatedEmail: email,
    institutionCode: existing.institutionCode ?? INSTITUTION_CODE,
    district: existing.district ?? "Burdur",
    province: existing.province ?? "Burdur",
    name: "Bağlarbaşı",
    institutionName: "Bağlarbaşı",
    updatedAt: now,
  };
}

function buildPutBody(mergedData: AppUserRecordData) {
  return {
    userId: AUTH_USER_ID,
    record_type: "app_user",
    data: mergedData,
  };
}

function recordUserId(record: BackendRecord<AppUserRecordData>): string | null {
  const raw = record as BackendRecord<AppUserRecordData> & { userId?: string | number };
  const nested = record.data as { userId?: string | number } | undefined;
  const id = record.userId ?? nested?.userId ?? raw.userId;
  return id != null ? String(id) : null;
}

function printChecks(
  label: string,
  record: BackendRecord<AppUserRecordData>,
  dataChanged: boolean,
) {
  const data = appUserDataFromRecord(record);
  const owner = recordUserId(record);
  const checks = {
    label,
    userIdIs31: owner === String(AUTH_USER_ID),
    dataAuthUserIdIs31: String(data.authUserId ?? "") === String(AUTH_USER_ID),
    institutionCodeOk: (data.institutionCode ?? "") === INSTITUTION_CODE,
    emailOk: normalizeEmail(getEmailFromData(data)) === normalizeEmail(TARGET_EMAIL),
    dataChanged,
    observed: {
      userId: owner,
      authUserId: data.authUserId ?? null,
      institutionCode: data.institutionCode ?? null,
      district: data.district ?? null,
      province: data.province ?? null,
      email: data.email ?? null,
    },
  };
  console.log("[repair-1163] CHECK", JSON.stringify(checks, null, 2));
  return checks;
}

function getEmailFromData(data: AppUserRecordData): string {
  return data.email ?? data.loginEmail ?? data.generatedEmail ?? "";
}

/** Salt okunur snapshot — VPS'te GET /admin/records/:id yok; yalnızca /records/1163 */
async function fetchRecordSnapshot(
  baseUrl: string,
  projectKey: string,
  bearer: string,
): Promise<{ record: BackendRecord<AppUserRecordData>; via: string }> {
  const recordsPath = `/records/${encodeURIComponent(APP_USER_ID)}`;
  const res = await vpsRequest<unknown>(baseUrl, projectKey, bearer, "GET", recordsPath);
  if (res.ok) {
    return { record: normalizeRecord<AppUserRecordData>(res.data), via: recordsPath };
  }
  console.error("[repair-1163] GET snapshot failed", res.status, res.text);
  process.exit(1);
}

/** Onarım sonrası doğrulama — önce admin+Key, yoksa /records */
async function fetchRecordAfterRepair(
  baseUrl: string,
  projectKey: string,
  bearer: string,
  adminApiKey: string,
): Promise<{ record: BackendRecord<AppUserRecordData>; via: string }> {
  const adminPath = `/admin/records/${encodeURIComponent(APP_USER_ID)}`;
  const adminRes = await vpsRequest<unknown>(baseUrl, projectKey, bearer, "GET", adminPath, undefined, {
    adminApiKey,
  });
  if (adminRes.ok) {
    return { record: normalizeRecord<AppUserRecordData>(adminRes.data), via: adminPath };
  }
  const recordsPath = `/records/${encodeURIComponent(APP_USER_ID)}`;
  const ownedRes = await vpsRequest<unknown>(baseUrl, projectKey, bearer, "GET", recordsPath);
  if (ownedRes.ok) {
    console.log("[repair-1163] GET after: admin route yok/403 — GET /records kullanıldı.");
    return { record: normalizeRecord<AppUserRecordData>(ownedRes.data), via: recordsPath };
  }
  console.error("[repair-1163] GET after failed", { admin: adminRes.status, records: ownedRes.status });
  console.error(adminRes.text || ownedRes.text);
  process.exit(1);
}

async function putRecord(
  baseUrl: string,
  projectKey: string,
  bearer: string,
  adminApiKey: string,
  body: ReturnType<typeof buildPutBody>,
): Promise<void> {
  const adminPath = `/admin/records/${encodeURIComponent(APP_USER_ID)}`;
  const res = await vpsRequest<unknown>(baseUrl, projectKey, bearer, "PUT", adminPath, body, {
    adminApiKey,
  });
  if (res.ok) return;
  console.error("[repair-1163] PUT failed", res.status, res.text);
  if (res.status === 403) {
    console.error(
      "[repair-1163] 403: JWT (role:admin önerilir) ve X-Admin-Key (ADMIN_API_KEY) gerekir. " +
        "authMiddleware: x-admin-key === ADMIN_API_KEY.",
    );
  }
  process.exit(1);
}

async function main() {
  loadLocalEnv();

  const baseUrl = requireEnv("VPS_API_BASE_URL", "VITE_API_BASE_URL");
  const projectKey = requireEnv("VPS_PROJECT_API_KEY", "VITE_PROJECT_API_KEY");
  const bearer = requireEnv("ADMIN_JWT", "ADMIN_BEARER");
  const adminApiKey = requireEnv("ADMIN_API_KEY");
  const dryRun = isDryRun();
  const ts = timestamp();
  const dir = backupDir();

  console.log("[repair-1163] start", {
    appUserId: APP_USER_ID,
    authUserId: AUTH_USER_ID,
    email: TARGET_EMAIL,
    dryRun,
    baseUrl,
    hasAdminApiKey: Boolean(adminApiKey),
  });

  const { record: beforeRecord, via: fetchVia } = await fetchRecordSnapshot(baseUrl, projectKey, bearer);
  const beforePath = join(dir, `before-${ts}.json`);
  writeJson(beforePath, { fetchedAt: new Date().toISOString(), fetchedVia: fetchVia, record: beforeRecord });

  const existingData = appUserDataFromRecord(beforeRecord);
  const mergedData = buildMergedData(existingData);
  const putBody = buildPutBody(mergedData);
  const plannedPath = join(dir, `planned-put-${ts}.json`);
  writeJson(plannedPath, {
    dryRun,
    endpoint: `PUT /admin/records/${APP_USER_ID}`,
    headers: ["Authorization: Bearer", "X-Project-Key", "X-Admin-Key"],
    body: putBody,
    notes: [
      "Top-level userId auth owner (31); data.authUserId login bağlantısı.",
      "register / yeni auth yok; yalnızca kayıt 1163.",
      "Admin PUT: X-Admin-Key = ADMIN_API_KEY (authMiddleware).",
      "Before GET: /records/1163 only.",
    ],
  });

  console.log("[repair-1163] before snapshot", {
    recordUserId: recordUserId(beforeRecord),
    dataAuthUserId: existingData.authUserId ?? null,
    institutionCode: existingData.institutionCode ?? null,
  });

  if (dryRun) {
    console.log("[repair-1163] DRY_RUN=true — PUT atlandı.");
    printChecks("planned (no PUT)", beforeRecord, false);
    process.exit(0);
  }

  await putRecord(baseUrl, projectKey, bearer, adminApiKey, putBody);
  writeJson(join(dir, `put-response-${ts}.json`), {
    endpoint: `PUT /admin/records/${APP_USER_ID}`,
    headers: ["Authorization: Bearer", "X-Project-Key", "X-Admin-Key"],
    body: putBody,
  });

  const { record: afterRecord, via: afterVia } = await fetchRecordAfterRepair(
    baseUrl,
    projectKey,
    bearer,
    adminApiKey,
  );
  const afterPath = join(dir, `after-${ts}.json`);
  writeJson(afterPath, { fetchedAt: new Date().toISOString(), fetchedVia: afterVia, record: afterRecord });

  const checks = printChecks("after PUT", afterRecord, true);
  const allOk =
    checks.userIdIs31 &&
    checks.dataAuthUserIdIs31 &&
    checks.institutionCodeOk &&
    checks.dataChanged;

  if (!allOk) {
    console.error("[repair-1163] Kabul testleri başarısız — rollback için before dosyası:", beforePath);
    process.exit(1);
  }

  console.log("[repair-1163] done — tek kayıt onarımı tamamlandı.");
}

main().catch((err) => {
  console.error("[repair-1163] fatal", err);
  process.exit(1);
});

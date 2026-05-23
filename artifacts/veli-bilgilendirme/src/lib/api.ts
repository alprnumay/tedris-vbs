const PROD_API_BASE = "https://workspaceapi-server-production-c211.up.railway.app/api";

/** Geliştirmede Vite proxy (`/api` → Railway); canlıda tam URL. */
const BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "/api" : PROD_API_BASE);

const SESSION_TOKEN_KEY = "tedris_session_token";

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

function setStoredSessionToken(token: string) {
  const trimmed = token.trim();
  if (!trimmed) return;
  memorySessionToken = trimmed;
  try {
    localStorage.setItem(SESSION_TOKEN_KEY, trimmed);
  } catch {
    /* private mode / storage disabled — memory fallback yeterli */
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

function extractSessionToken(data: {
  sessionToken?: string;
  session_token?: string;
}): string | undefined {
  const raw = data.sessionToken ?? data.session_token;
  return typeof raw === "string" && raw.trim() ? raw.trim() : undefined;
}

function requestHeaders(): Headers {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  const token = getStoredSessionToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return headers;
}

async function istek<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: requestHeaders(),
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();

  let data: unknown = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text || "Geçersiz sunucu cevabı." };
  }

  if (!res.ok) {
    if (res.status === 401 && !path.includes("/auth/login") && !path.includes("/auth/register")) {
      clearStoredSessionToken();
    }
    const err = data as { error?: string; message?: string };
    throw new Error(err.error || err.message || "Bir hata oluştu.");
  }

  return data as T;
}

export interface KullaniciBilgisi {
  id: string;
  email: string;
  name: string;
  isAdmin?: boolean;
}

export interface KayitliProfil {
  id: string;
  isim: string;
  kurumAdi: string;
  rol: string;
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
  id: number;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
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

export type KullaniciRol = "user" | "admin";
export type AktiviteDurum = "today" | "week" | "inactive" | "never";

export interface AdminKullanici {
  id: string;
  email: string;
  name: string;
  province: string | null;
  district: string | null;
  institutionName: string | null;
  institutionCode: string | null;
  role: string;
  isActive: boolean;
  isAdmin: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  activityStatus?: AktiviteDurum;
  daysSinceLogin?: number | null;
  login_time?: string | null;
  activeInRange?: boolean;
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

export const api = {
  me: () => istek<{ user: KullaniciBilgisi | null }>("GET", "/auth/me"),

  girisYap: async (email: string, password: string) => {
    clearStoredSessionToken();
    const r = await istek<{ user: KullaniciBilgisi; sessionToken?: string; session_token?: string }>(
      "POST",
      "/auth/login",
      { email, password },
    );
    const token = extractSessionToken(r);
    if (token) setStoredSessionToken(token);
    return { user: r.user };
  },

  kayitOl: async (email: string, password: string, name: string) => {
    clearStoredSessionToken();
    const r = await istek<{ user: KullaniciBilgisi; sessionToken?: string; session_token?: string }>(
      "POST",
      "/auth/register",
      { email, password, name },
    );
    const token = extractSessionToken(r);
    if (token) setStoredSessionToken(token);
    return { user: r.user };
  },

  cikisYap: async () => {
    try {
      return await istek<{ ok: boolean }>("POST", "/auth/logout");
    } finally {
      clearStoredSessionToken();
    }
  },

  profilleriGetir: () => istek<{ profiles: KayitliProfil[] }>("GET", "/profiles"),

  profilKaydet: (data: { isim: string; kurumAdi: string; rol: string }) =>
    istek<{ profile: KayitliProfil }>("POST", "/profiles", data),

  profilSil: (id: string) => istek<{ ok: boolean }>("DELETE", `/profiles/${id}`),

  /** @deprecated Afiş kaydı devre dışı — sunucu 410 döner. UI çağırmamalı. */
  afisleriGetir: () => istek<{ posters: KayitliAfis[] }>("GET", "/posters"),

  /** @deprecated Afiş kaydı devre dışı — sunucu 410 döner. UI çağırmamalı. */
  afisKaydet: (title: string, sablon: string, formData: unknown) =>
    istek<{ poster: KayitliAfis }>("POST", "/posters", {
      title,
      sablon,
      formData: JSON.stringify(formData),
    }),

  /** @deprecated Afiş kaydı devre dışı — sunucu 410 döner. UI çağırmamalı. */
  afisGuncelle: (id: number, title: string, sablon: string, formData: unknown) =>
    istek<{ poster: KayitliAfis }>("PUT", `/posters/${id}`, {
      title,
      sablon,
      formData: JSON.stringify(formData),
    }),

  /** @deprecated Afiş kaydı devre dışı — sunucu 410 döner. UI çağırmamalı. */
  afisSil: (id: number) => istek<{ ok: boolean }>("DELETE", `/posters/${id}`),

  destekGonder: (mesaj: string, imageBase64?: string) =>
    istek<{ ok: boolean }>("POST", "/support", { message: mesaj, imageBase64 }),

  destekMesajlari: () =>
    istek<{ requests: DestekMesaji[] }>("GET", "/support/admin"),

  adminStats: () => istek<AdminStats>("GET", "/support/stats"),

  adminOverview: () => istek<AdminOverview>("GET", "/admin/overview"),

  adminFiltreler: () => istek<AdminFiltreler>("GET", "/admin/filters"),

  adminKullanicilar: (params: Record<string, string | undefined> = {}) =>
    istek<{ users: AdminKullanici[] }>("GET", `/admin/users${qs(params)}`),

  adminKullaniciOlustur: (data: {
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
  }) => istek<{ user: AdminKullanici }>("POST", "/admin/users", data),

  adminKullaniciGuncelle: (id: string, data: Partial<AdminKullanici>) =>
    istek<{ user: AdminKullanici }>("PATCH", `/admin/users/${id}`, data),

  adminSifreSifirla: (id: string, opts?: { password?: string; generate?: boolean }) =>
    istek<{ ok: boolean; password?: string }>("POST", `/admin/users/${id}/reset-password`, {
      password: opts?.password,
      generate: opts?.generate ?? !opts?.password,
    }),

  adminBugunGirisler: (params: Record<string, string | undefined> = {}) =>
    istek<{ count: number; logins: AdminKullanici[] }>("GET", `/admin/today-logins${qs(params)}`),

  adminKurumlar: (params: Record<string, string | undefined> = {}) =>
    istek<{ institutions: AdminKurum[] }>("GET", `/admin/institutions${qs(params)}`),

  adminKullanimTakibi: (type: string, params: Record<string, string | undefined> = {}) =>
    istek<{ users: AdminKullanici[]; inactiveInstitutions: unknown[] }>(
      "GET",
      `/admin/usage-tracking${qs({ type, ...params })}`,
    ),

  adminBolgeRaporu: (params: Record<string, string | undefined> = {}) =>
    istek<{
      summary: Record<string, number>;
      users: AdminKullanici[];
    }>("GET", `/admin/region-report${qs(params)}`),

  adminDestek: () => istek<{ requests: AdminDestek[] }>("GET", "/admin/support"),

  adminDestekGuncelle: (id: number, data: { status?: string; adminNote?: string }) =>
    istek<{ ok: boolean }>("PATCH", `/admin/support/${id}`, data),

  adminSlugOner: (district: string, institutionName: string) =>
    istek<{ code: string }>(
      "GET",
      `/admin/slug-suggest?district=${encodeURIComponent(district)}&institutionName=${encodeURIComponent(institutionName)}`,
    ),
};
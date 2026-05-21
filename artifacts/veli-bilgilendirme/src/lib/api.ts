const BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://workspaceapi-server-production-c211.up.railway.app/api";

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
};
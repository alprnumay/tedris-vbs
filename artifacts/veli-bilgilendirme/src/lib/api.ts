const BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://workspaceapi-server-production-c211.up.railway.app/api";

const SESSION_TOKEN_KEY = "tedris_session_token";

function getStoredSessionToken(): string | null {
  try {
    return localStorage.getItem(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

function setStoredSessionToken(token: string) {
  try {
    localStorage.setItem(SESSION_TOKEN_KEY, token);
  } catch {
    /* private mode / storage disabled */
  }
}

function clearStoredSessionToken() {
  try {
    localStorage.removeItem(SESSION_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

function requestHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getStoredSessionToken();
  if (token) headers.Authorization = `Bearer ${token}`;
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
    const r = await istek<{ user: KullaniciBilgisi; sessionToken?: string }>(
      "POST",
      "/auth/login",
      { email, password },
    );
    if (r.sessionToken) setStoredSessionToken(r.sessionToken);
    return { user: r.user };
  },

  kayitOl: async (email: string, password: string, name: string) => {
    const r = await istek<{ user: KullaniciBilgisi; sessionToken?: string }>(
      "POST",
      "/auth/register",
      { email, password, name },
    );
    if (r.sessionToken) setStoredSessionToken(r.sessionToken);
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
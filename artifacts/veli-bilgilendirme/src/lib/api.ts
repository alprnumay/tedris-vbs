const BASE = "http://localhost:3001/api";

async function istek<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : {};

  if (!res.ok) {
    throw new Error(
      (data as { error?: string; message?: string }).error ||
        (data as { error?: string; message?: string }).message ||
        "Bir hata oluştu.",
    );
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

  girisYap: (email: string, password: string) =>
    istek<{ user: KullaniciBilgisi }>("POST", "/auth/login", { email, password }),

  kayitOl: (email: string, password: string, name: string) =>
    istek<{ user: KullaniciBilgisi }>("POST", "/auth/register", { email, password, name }),

  cikisYap: () => istek<{ ok: boolean }>("POST", "/auth/logout"),

  profilleriGetir: () => istek<{ profiles: KayitliProfil[] }>("GET", "/profiles"),

  profilKaydet: (data: { isim: string; kurumAdi: string; rol: string }) =>
    istek<{ profile: KayitliProfil }>("POST", "/profiles", data),

  profilSil: (id: string) => istek<{ ok: boolean }>("DELETE", `/profiles/${id}`),

  afisleriGetir: () => istek<{ posters: KayitliAfis[] }>("GET", "/posters"),

  afisKaydet: (title: string, sablon: string, formData: unknown) =>
    istek<{ poster: KayitliAfis }>("POST", "/posters", {
      title,
      sablon,
      formData: JSON.stringify(formData),
    }),

  afisGuncelle: (id: number, title: string, sablon: string, formData: unknown) =>
    istek<{ poster: KayitliAfis }>("PUT", `/posters/${id}`, {
      title,
      sablon,
      formData: JSON.stringify(formData),
    }),

  afisSil: (id: number) => istek<{ ok: boolean }>("DELETE", `/posters/${id}`),

  destekGonder: (mesaj: string, imageBase64?: string) =>
    istek<{ ok: boolean }>("POST", "/support", { message: mesaj, imageBase64 }),

  destekMesajlari: () =>
    istek<{ requests: DestekMesaji[] }>("GET", "/support/admin"),

  adminStats: () => istek<AdminStats>("GET", "/support/stats"),
};
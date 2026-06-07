import type { ApprovalStatus, ShowcasePost } from "@/modules/davet/types";
import { getBackendToken } from "@/lib/backendApi";
import { resolveApiBaseUrl, resolveApiOrigin } from "@/lib/apiBase";

type ApiShowcaseStatus = "pending" | "published" | "revision_requested" | "rejected";

interface ApiShowcaseRow {
  id: string;
  institution_id?: string | null;
  institution_name: string;
  district_name?: string | null;
  category: string;
  title: string;
  image_url?: string | null;
  purpose?: string | null;
  student_activity?: string | null;
  target_gain?: string | null;
  teacher_method?: string | null;
  how_to_apply?: string | null;
  result_note?: string | null;
  generated_text?: string | null;
  tags?: string[] | null;
  teacher_name?: string | null;
  status: ApiShowcaseStatus;
  revision_note?: string | null;
  created_at?: string;
  updated_at?: string;
  approved_at?: string | null;
}

const STATUS_FROM_API: Record<ApiShowcaseStatus, ApprovalStatus> = {
  pending: "onay-bekliyor",
  published: "yayinda",
  revision_requested: "revize-istendi",
  rejected: "reddedildi",
};

/** VBS ile aynı env; yerel dev'de Vite proxy üzerinden /api/davet */
const API_BASE_URL = resolveApiBaseUrl();
const DAVET_API_ROOT = `${API_BASE_URL.replace(/\/+$/, "")}/davet`;

const SESSION_TOKEN_KEY = "tedris_session_token";

export class ShowcaseAuthError extends Error {
  constructor(message = "AUTH_REQUIRED") {
    super(message);
    this.name = "ShowcaseAuthError";
  }
}

export interface CreateShowcasePayload {
  yurtAdi: string;
  mintika: string;
  kategori: string;
  baslik: string;
  amac: string;
  talebelerNeYapti: string;
  kazanim: string;
  uygulamaYontemi: string;
  digerYurtlarNasil: string;
  sonuc: string;
  hocaAdi: string;
  etiketler: string[];
  imageUrl: string;
  otomatikMetin?: string;
}

/** API sunucusu kökü (ör. http://localhost:3001) — /uploads görselleri için */
export function getApiOrigin(): string {
  return resolveApiOrigin(API_BASE_URL);
}

/** /uploads/... yollarını tam URL yapar */
export function resolveAssetUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  const origin = getApiOrigin();
  return `${origin}${url.startsWith("/") ? url : `/${url}`}`;
}

function getDavetAuthToken(): string | null {
  const backend = getBackendToken();
  if (backend) return backend;
  try {
    return localStorage.getItem(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

function buildAuthHeaders(init: RequestInit): Headers {
  const headers = new Headers(init.headers);
  const token = getDavetAuthToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return headers;
}

async function davetFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${DAVET_API_ROOT}${path}`;

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      credentials: "include",
      headers: buildAuthHeaders(init),
    });
  } catch {
    throw new Error(
      `Sunucuya bağlanılamadı (${url}). API sunucusunun çalıştığından ve VITE_API_BASE_URL ayarının doğru olduğundan emin olun.`,
    );
  }

  const text = await res.text();
  let data: unknown = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text };
  }

  if (!res.ok) {
    if (res.status === 401) {
      throw new ShowcaseAuthError();
    }
    const err = data as { error?: string; message?: string };
    throw new Error(err.error || err.message || `İstek başarısız (${res.status})`);
  }

  return data as T;
}

export function mapApiShowcaseToPost(row: ApiShowcaseRow): ShowcasePost {
  const created = row.created_at ?? new Date().toISOString();
  const approved = row.approved_at ?? created;
  return {
    id: row.id,
    yurtAdi: row.institution_name,
    mintika: row.district_name ?? "",
    kategori: row.category,
    baslik: row.title,
    fotografUrl: resolveAssetUrl(row.image_url),
    amac: row.purpose ?? "",
    talebelerNeYapti: row.student_activity ?? "",
    kazanim: row.target_gain ?? "",
    uygulamaYontemi: row.teacher_method ?? "",
    digerYurtlarNasil: row.how_to_apply ?? "",
    sonuc: row.result_note ?? "",
    etiketler: Array.isArray(row.tags) ? row.tags : [],
    hocaAdi: row.teacher_name ?? "",
    tarih: approved,
    durum: STATUS_FROM_API[row.status] ?? "onay-bekliyor",
    revizeNotu: row.revision_note ?? undefined,
    begeniSayisi: 0,
    otomatikMetin: row.generated_text ?? undefined,
    createdAt: created,
  };
}

export async function uploadShowcaseImage(file: File): Promise<{ url: string }> {
  const body = new FormData();
  body.append("file", file);
  const res = await davetFetch<{ url: string }>("/upload", { method: "POST", body });
  return { url: res.url };
}

export async function createShowcasePost(data: CreateShowcasePayload): Promise<ShowcasePost> {
  const payload = {
    institution_name: data.yurtAdi,
    district_name: data.mintika,
    category: data.kategori,
    title: data.baslik,
    image_url: data.imageUrl,
    purpose: data.amac,
    student_activity: data.talebelerNeYapti,
    target_gain: data.kazanim,
    teacher_method: data.uygulamaYontemi,
    how_to_apply: data.digerYurtlarNasil,
    result_note: data.sonuc,
    generated_text: data.otomatikMetin,
    tags: data.etiketler,
    teacher_name: data.hocaAdi,
  };
  const res = await davetFetch<{ post: ApiShowcaseRow }>("/showcase", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return mapApiShowcaseToPost(res.post);
}

export async function getPublishedShowcases(): Promise<ShowcasePost[]> {
  const res = await davetFetch<{ posts: ApiShowcaseRow[] }>("/showcase/published");
  return (res.posts ?? []).map(mapApiShowcaseToPost);
}

export async function getAdminShowcases(): Promise<ShowcasePost[]> {
  const res = await davetFetch<{ posts: ApiShowcaseRow[] }>("/showcase/admin");
  return (res.posts ?? []).map(mapApiShowcaseToPost);
}

export async function approveShowcasePost(id: string): Promise<ShowcasePost> {
  const res = await davetFetch<{ post: ApiShowcaseRow }>(`/showcase/${encodeURIComponent(id)}/approve`, {
    method: "PATCH",
  });
  return mapApiShowcaseToPost(res.post);
}

export async function rejectShowcasePost(id: string, note?: string): Promise<ShowcasePost> {
  const res = await davetFetch<{ post: ApiShowcaseRow }>(`/showcase/${encodeURIComponent(id)}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ revision_note: note ?? "" }),
  });
  return mapApiShowcaseToPost(res.post);
}

export async function requestRevisionShowcasePost(id: string, note: string): Promise<ShowcasePost> {
  const res = await davetFetch<{ post: ApiShowcaseRow }>(`/showcase/${encodeURIComponent(id)}/revision`, {
    method: "PATCH",
    body: JSON.stringify({ revision_note: note }),
  });
  return mapApiShowcaseToPost(res.post);
}

export async function deleteShowcasePost(id: string): Promise<void> {
  await davetFetch<{ ok: boolean }>(`/showcase/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

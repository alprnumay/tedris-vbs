import type { FormData as VeliFormData, SablonTuru } from "../types";

const TOKEN_KEY = "tedris_backend_token";
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
const PROJECT_API_KEY = import.meta.env.VITE_PROJECT_API_KEY || "";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export interface BackendUser {
  id?: string;
  email?: string;
  name?: string;
  [key: string]: unknown;
}

export interface BackendRecord<T = unknown> {
  id: string | number;
  recordType?: string;
  record_type?: string;
  type?: string;
  data?: T;
  updatedAt?: string;
  updated_at?: string;
  createdAt?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface PosterDraftData {
  source: "veli_bilgilendirme";
  app: "nehari_veli_bilgilendirme";
  form: VeliFormData;
  seciliSablon: SablonTuru;
  metinDuzenlendi: boolean;
  savedAt: string;
}

export function getBackendToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setBackendToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* localStorage kapalıysa oturum kalıcı saklanamaz */
  }
}

export function clearBackendToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

function headers(json = true): Headers {
  const h = new Headers();
  if (json) h.set("Content-Type", "application/json");
  if (PROJECT_API_KEY) h.set("X-Project-Key", PROJECT_API_KEY);
  const token = getBackendToken();
  if (token) h.set("Authorization", `Bearer ${token}`);
  return h;
}

function tokenFrom(data: unknown): string | undefined {
  const d = data as { token?: unknown; jwt?: unknown; accessToken?: unknown; access_token?: unknown };
  const raw = d.token ?? d.jwt ?? d.accessToken ?? d.access_token;
  return typeof raw === "string" && raw.trim() ? raw.trim() : undefined;
}

async function request<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
  if (!API_BASE || !PROJECT_API_KEY) {
    throw new Error("Sunucu bağlantı ayarları eksik.");
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: headers(body !== undefined),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Sunucuya bağlanılamadı. Lütfen daha sonra tekrar deneyin.");
  }

  const text = await res.text();
  let data: unknown = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }

  if (!res.ok) {
    const err = data as { message?: unknown; error?: unknown };
    const message = typeof err.message === "string"
      ? err.message
      : typeof err.error === "string"
        ? err.error
        : "Sunucuya bağlanılamadı. Lütfen daha sonra tekrar deneyin.";
    throw new Error(message);
  }

  return data as T;
}

function normalizeRecords<T>(payload: unknown): BackendRecord<T>[] {
  if (Array.isArray(payload)) return payload as BackendRecord<T>[];
  const p = payload as { records?: unknown; data?: unknown; items?: unknown };
  if (Array.isArray(p.records)) return p.records as BackendRecord<T>[];
  if (Array.isArray(p.data)) return p.data as BackendRecord<T>[];
  if (Array.isArray(p.items)) return p.items as BackendRecord<T>[];
  if ((payload as { id?: unknown }).id != null) return [payload as BackendRecord<T>];
  if (p.data && (p.data as { id?: unknown }).id != null) return [p.data as BackendRecord<T>];
  return [];
}

function normalizeRecord<T>(payload: unknown): BackendRecord<T> {
  const p = payload as { record?: unknown; data?: unknown };
  return (p.record || p.data || payload) as BackendRecord<T>;
}

function updatedTime(record: BackendRecord): number {
  const raw = record.updatedAt || record.updated_at || record.createdAt || record.created_at || "";
  const time = Date.parse(raw);
  return Number.isFinite(time) ? time : 0;
}

export const backendApi = {
  health: () => request<{ ok?: boolean; status?: string }>("GET", "/healthz"),

  register: async (body: { email: string; password: string; name?: string }) => {
    const data = await request<{ user?: BackendUser }>("POST", "/auth/register", body);
    const token = tokenFrom(data);
    if (token) setBackendToken(token);
    return data;
  },

  login: async (body: { email: string; password: string }) => {
    const data = await request<{ user?: BackendUser }>("POST", "/auth/login", body);
    const token = tokenFrom(data);
    if (token) setBackendToken(token);
    return data;
  },

  me: () => request<{ user?: BackendUser }>("GET", "/auth/me"),

  createRecord: async <T>(recordType: string, data: T) =>
    normalizeRecord<T>(await request("POST", "/records", { record_type: recordType, data })),

  listRecords: async <T>(recordType?: string) => {
    const query = recordType ? `?record_type=${encodeURIComponent(recordType)}` : "";
    return normalizeRecords<T>(await request("GET", `/records${query}`));
  },

  getRecord: async <T>(id: string | number) =>
    normalizeRecord<T>(await request("GET", `/records/${encodeURIComponent(id)}`)),

  updateRecord: async <T>(id: string | number, recordType: string, data: T) =>
    normalizeRecord<T>(await request("PUT", `/records/${encodeURIComponent(id)}`, { record_type: recordType, data })),

  deleteRecord: (id: string | number) =>
    request<{ ok?: boolean }>("DELETE", `/records/${encodeURIComponent(id)}`),

  latestPosterDraft: async () => {
    const records = await backendApi.listRecords<PosterDraftData>("poster_draft");
    return records.sort((a, b) => updatedTime(b) - updatedTime(a))[0] ?? null;
  },

  savePosterDraft: async (data: PosterDraftData, existingId?: string | number | null) => {
    const current = existingId ? null : await backendApi.latestPosterDraft();
    const id = existingId || current?.id;
    return id
      ? backendApi.updateRecord(id, "poster_draft", data)
      : backendApi.createRecord("poster_draft", data);
  },

  uploadFile: async (file: File, metadata?: Record<string, unknown>) => {
    if (!API_BASE || !PROJECT_API_KEY) throw new Error("Sunucu bağlantı ayarları eksik.");
    const body = new FormData();
    body.append("file", file);
    if (metadata) body.append("metadata", JSON.stringify(metadata));
    const res = await fetch(`${API_BASE}/files/upload`, {
      method: "POST",
      headers: headers(false),
      body,
    });
    if (!res.ok) throw new Error("Sunucuya bağlanılamadı. Lütfen daha sonra tekrar deneyin.");
    return res.json();
  },

  listFiles: () => request<{ files?: unknown[] }>("GET", "/files"),

  deleteFile: (id: string) =>
    request<{ ok?: boolean }>("DELETE", `/files/${encodeURIComponent(id)}`),

  usageEvent: (eventType: string, metadata?: Record<string, unknown>) =>
    request<{ ok?: boolean }>("POST", "/usage/event", { event_type: eventType, metadata }),
};

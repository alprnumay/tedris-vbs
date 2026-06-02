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

function headers(json = true, includeAuth = true): Headers {
  const h = new Headers();
  if (json) h.set("Content-Type", "application/json");
  if (PROJECT_API_KEY) h.set("X-Project-Key", PROJECT_API_KEY);
  const token = getBackendToken();
  if (includeAuth && token) h.set("Authorization", `Bearer ${token}`);
  return h;
}

function tokenFrom(data: unknown): string | undefined {
  const d = data as { token?: unknown; jwt?: unknown; accessToken?: unknown; access_token?: unknown };
  const raw = d.token ?? d.jwt ?? d.accessToken ?? d.access_token;
  return typeof raw === "string" && raw.trim() ? raw.trim() : undefined;
}

async function request<T>(method: HttpMethod, path: string, body?: unknown, opts: { includeAuth?: boolean } = {}): Promise<T> {
  if (!API_BASE || !PROJECT_API_KEY) {
    throw new Error("Sunucu bağlantı ayarları eksik.");
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: headers(body !== undefined, opts.includeAuth ?? true),
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
  const p = payload as { records?: unknown; data?: unknown; items?: unknown; record?: unknown };
  const d = p.data as { records?: unknown; items?: unknown; data?: unknown; id?: unknown } | undefined;
  if (Array.isArray(p.records)) return p.records as BackendRecord<T>[];
  if (Array.isArray(p.items)) return p.items as BackendRecord<T>[];
  if (Array.isArray(p.data)) return p.data as BackendRecord<T>[];
  if (d && Array.isArray(d.records)) return d.records as BackendRecord<T>[];
  if (d && Array.isArray(d.items)) return d.items as BackendRecord<T>[];
  if (d && Array.isArray(d.data)) return d.data as BackendRecord<T>[];
  if ((payload as { id?: unknown }).id != null) return [payload as BackendRecord<T>];
  if (p.record && (p.record as { id?: unknown }).id != null) return [p.record as BackendRecord<T>];
  if (d?.id != null) return [d as BackendRecord<T>];
  return [];
}

function pageMeta(payload: unknown) {
  const p = payload as Record<string, unknown>;
  const d = (p.data && typeof p.data === "object" ? p.data : {}) as Record<string, unknown>;
  const meta = (p.meta && typeof p.meta === "object" ? p.meta : d.meta && typeof d.meta === "object" ? d.meta : {}) as Record<string, unknown>;
  const read = (keys: string[]) => {
    for (const key of keys) {
      const value = p[key] ?? d[key] ?? meta[key];
      if (value != null) return value;
    }
    return undefined;
  };
  const totalRaw = read(["total", "totalCount", "total_count"]);
  const hasMoreRaw = read(["hasMore", "has_more", "hasNextPage", "has_next_page"]);
  return {
    total: typeof totalRaw === "number" ? totalRaw : typeof totalRaw === "string" ? Number(totalRaw) : undefined,
    hasMore: typeof hasMoreRaw === "boolean" ? hasMoreRaw : undefined,
    nextCursor: read(["nextCursor", "next_cursor", "cursor", "next"]) as string | undefined,
  };
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

  resetAuthPassword: (id: string, body: { password?: string; generate?: boolean }) =>
    request<{ ok?: boolean; password?: string }>("POST", `/admin/users/${encodeURIComponent(id)}/reset-password`, body),

  createRecord: async <T>(recordType: string, data: T) =>
    normalizeRecord<T>(await request("POST", "/records", { record_type: recordType, data })),

  fetchAllRecords: async <T>(recordType?: string, opts: { limit?: number; maxPages?: number; includeAuth?: boolean } = {}) => {
    const limit = Math.min(Math.max(opts.limit ?? 100, 1), 100);
    const maxPages = Math.min(Math.max(opts.maxPages ?? 100, 1), 500);
    const all: BackendRecord<T>[] = [];
    const seenIds = new Set<string>();
    const seenPages = new Set<string>();
    let cursor: string | undefined;

    for (let pageIndex = 0; pageIndex < maxPages; pageIndex += 1) {
      const page = pageIndex + 1;
      const offset = pageIndex * limit;
      const params = new URLSearchParams();
      if (recordType) params.set("record_type", recordType);
      params.set("limit", String(limit));
      if (cursor) params.set("cursor", cursor);
      else {
        params.set("page", String(page));
        params.set("offset", String(offset));
      }

      const payload = await request<unknown>("GET", `/records?${params.toString()}`, undefined, { includeAuth: opts.includeAuth });
      const records = normalizeRecords<T>(payload);
      const meta = pageMeta(payload);
      const signature = records.map((record) => String(record.id)).join("|");
      if (signature && seenPages.has(signature)) break;
      if (signature) seenPages.add(signature);

      let newRecords = 0;
      for (const record of records) {
        const key = String(record.id);
        if (seenIds.has(key)) continue;
        seenIds.add(key);
        all.push(record);
        newRecords += 1;
      }

      if (import.meta.env.DEV) {
        console.debug("[backendApi.fetchAllRecords]", { recordType, page, offset, loaded: records.length, totalLoaded: all.length });
      }

      if (!records.length || !newRecords) break;
      if (meta.total != null && Number.isFinite(meta.total) && all.length >= meta.total) break;
      if (meta.nextCursor) {
        cursor = meta.nextCursor;
        continue;
      }
      if (meta.hasMore === false) break;
      if (records.length < limit) break;
    }

    return all;
  },

  listRecords: async <T>(recordType?: string, opts: { includeAuth?: boolean } = {}) => {
    try {
      return await backendApi.fetchAllRecords<T>(recordType, opts);
    } catch (error) {
      const suffix = recordType ? ` (${recordType})` : "";
      throw new Error(error instanceof Error ? `Kayıtlar okunamadı${suffix}: ${error.message}` : `Kayıtlar okunamadı${suffix}.`);
    }
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

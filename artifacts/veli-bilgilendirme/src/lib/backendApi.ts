import type { FormData as VeliFormData, SablonTuru } from "../types";
import { rejectClientSideRepair } from "./repairPolicy";
import { isLocalDevApi, resolveApiBaseUrl, resolvePushApiBaseUrl } from "./apiBase";

const TOKEN_KEY = "tedris_backend_token";
const PUSH_DEVICE_KEY = "nehariPushDeviceId";
const API_BASE = resolveApiBaseUrl();
const PROJECT_API_KEY = import.meta.env.VITE_PROJECT_API_KEY || "";
const REQUEST_TIMEOUT_MS = 15_000;

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
  userId?: string | number;
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

function getPushDeviceId(): string {
  try {
    const existing = localStorage.getItem(PUSH_DEVICE_KEY);
    if (existing) return existing;

    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `push-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(PUSH_DEVICE_KEY, id);
    return id;
  } catch {
    return `push-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

function pushHeaders(json = true, includeAuth = true): Headers {
  const h = headers(json, includeAuth);
  h.set("X-Push-Device-Id", getPushDeviceId());
  return h;
}

function tokenFrom(data: unknown): string | undefined {
  const d = data as { token?: unknown; jwt?: unknown; accessToken?: unknown; access_token?: unknown };
  const raw = d.token ?? d.sessionToken ?? d.jwt ?? d.accessToken ?? d.access_token;
  return typeof raw === "string" && raw.trim() ? raw.trim() : undefined;
}

async function request<T>(method: HttpMethod, path: string, body?: unknown, opts: { includeAuth?: boolean } = {}): Promise<T> {
  if (!API_BASE) {
    throw new Error("Sunucu bağlantı ayarları eksik.");
  }
  if (!PROJECT_API_KEY && !import.meta.env.DEV) {
    throw new Error("Sunucu bağlantı ayarları eksik.");
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: headers(body !== undefined, opts.includeAuth ?? true),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: "include",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new Error("Sunucu yanıt vermedi. Lütfen bağlantınızı kontrol edip tekrar deneyin.");
    }
    const cause = (error as { cause?: { code?: string } })?.cause?.code;
    if (cause === "ECONNRESET" || cause === "ECONNREFUSED") {
      throw new Error(
        import.meta.env.DEV
          ? "Yerel API sunucusuna bağlanılamadı. `npm run dev` ile api (3001) ve web (3000) çalıştığından emin olun."
          : "Sunucuya bağlanılamadı. Lütfen daha sonra tekrar deneyin.",
      );
    }
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
    throw new Error(`${res.status} ${message}`);
  }

  return data as T;
}

async function pushRequest<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  opts: { includeAuth?: boolean } = {},
): Promise<T> {
  const pushBase = resolvePushApiBaseUrl();
  if (!pushBase) {
    throw new Error("Sunucu bağlantı ayarları eksik.");
  }

  let res: Response;
  try {
    res = await fetch(`${pushBase}${path}`, {
      method,
      headers: pushHeaders(body !== undefined, opts.includeAuth ?? true),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: "include",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new Error("Sunucu yanıt vermedi. Lütfen bağlantınızı kontrol edip tekrar deneyin.");
    }
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
    const raw =
      typeof err.error === "string"
        ? err.error
        : typeof err.message === "string"
          ? err.message
          : "Sunucuya bağlanılamadı.";
    if (res.status === 404 && String(raw).includes("route")) {
      throw new Error(
        "Push bildirim API'si henüz sunucuda aktif değil. Site yöneticisine bildirin veya birkaç dakika sonra tekrar deneyin.",
      );
    }
    throw new Error(raw);
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

  logout: () => request<{ ok?: boolean }>("POST", "/auth/logout"),

  me: () => request<{ user?: BackendUser }>("GET", "/auth/me"),

  resetAuthPassword: (id: string, body: { password?: string; generate?: boolean }) =>
    request<{ ok?: boolean; password?: string }>("POST", `/admin/users/${encodeURIComponent(id)}/reset-password`, body),

  repairAppUserAuthLinks: (_body?: { userIds?: string[] }) => {
    rejectClientSideRepair("backendApi.repairAppUserAuthLinks");
    return request<{
      ok?: boolean;
      totalAppUsers?: number;
      alreadyLinked?: number;
      authFoundAndLinked?: number;
      authCreatedAndLinked?: number;
      failed?: number;
      errors?: { id: string; email: string; reason: string }[];
      createdCredentials?: { appUserId: string; email: string; name: string; password: string }[];
    }>("POST", "/admin/repair-app-user-auth-links", {});
  },

  listAuthUsers: async () => {
    rejectClientSideRepair("backendApi.listAuthUsers");
    const payload = await request<unknown>("GET", "/admin/users");
    const users = normalizeRecords<BackendUser>(payload);
    if (users.length) return users;
    const p = payload as { users?: BackendUser[]; data?: { users?: BackendUser[] } | BackendUser[] };
    if (Array.isArray(p.users)) return p.users;
    if (Array.isArray(p.data)) return p.data;
    if (p.data && typeof p.data === "object" && Array.isArray((p.data as { users?: BackendUser[] }).users)) {
      return (p.data as { users: BackendUser[] }).users;
    }
    return [];
  },

  createRecord: async <T>(recordType: string, data: T) => {
    if (isLocalDevApi()) {
      throw new Error(`Yerel geliştirmede "${recordType}" kaydı VPS /records üzerinden desteklenmiyor.`);
    }
    return normalizeRecord<T>(await request("POST", "/records", { record_type: recordType, data }));
  },

  fetchAllRecords: async <T>(recordType?: string, opts: { limit?: number; maxPages?: number; includeAuth?: boolean } = {}) =>
    backendApi.fetchAllRecordsFromPath<T>("/records", recordType, opts),

  fetchAllAdminRecords: async <T>(recordType?: string, opts: { limit?: number; maxPages?: number; includeAuth?: boolean } = {}) =>
    backendApi.fetchAllRecordsFromPath<T>("/admin/records", recordType, opts),

  fetchAllRecordsFromPath: async <T>(
    path: "/records" | "/admin/records",
    recordType?: string,
    opts: { limit?: number; maxPages?: number; includeAuth?: boolean } = {},
  ) => {
    if (isLocalDevApi()) {
      return [] as BackendRecord<T>[];
    }
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

      const payload = await request<unknown>("GET", `${path}?${params.toString()}`, undefined, { includeAuth: opts.includeAuth });
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
        console.debug("[backendApi.fetchAllRecordsFromPath]", { path, recordType, page, offset, loaded: records.length, totalLoaded: all.length });
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

  listAdminRecords: async <T>(recordType?: string, opts: { includeAuth?: boolean } = {}) => {
    try {
      return await backendApi.fetchAllAdminRecords<T>(recordType, opts);
    } catch (error) {
      const suffix = recordType ? ` (${recordType})` : "";
      throw new Error(error instanceof Error ? `Admin kayıtları okunamadı${suffix}: ${error.message}` : `Admin kayıtları okunamadı${suffix}.`);
    }
  },

  getRecord: async <T>(id: string | number) =>
    normalizeRecord<T>(await request("GET", `/records/${encodeURIComponent(id)}`)),

  getAdminRecord: async <T>(id: string | number) =>
    normalizeRecord<T>(await request("GET", `/admin/records/${encodeURIComponent(id)}`)),

  updateRecord: async <T>(id: string | number, recordType: string, data: T) =>
    normalizeRecord<T>(await request("PUT", `/records/${encodeURIComponent(id)}`, { record_type: recordType, data })),

  updateAdminRecord: async <T>(id: string | number, recordType: string, data: T) =>
    normalizeRecord<T>(await request("PUT", `/admin/records/${encodeURIComponent(id)}`, { record_type: recordType, data })),

  assignRecordOwner: async (
    id: string | number,
    ownerUserId: string | number,
    opts?: { recordType?: string; data?: unknown },
  ) => {
    rejectClientSideRepair("backendApi.assignRecordOwner");
    const numericId = typeof ownerUserId === "string" ? Number(ownerUserId) : ownerUserId;
    const userId = Number.isFinite(numericId) ? numericId : ownerUserId;
    const body: Record<string, unknown> = { userId };
    if (opts?.data) {
      body.record_type = opts.recordType ?? "app_user";
      body.data = opts.data;
    }
    return request<{ ok?: boolean }>("PUT", `/admin/records/${encodeURIComponent(id)}`, body);
  },

  deleteRecord: (id: string | number) =>
    request<{ ok?: boolean }>("DELETE", `/records/${encodeURIComponent(id)}`),

  deleteAdminRecord: (id: string | number) =>
    request<{ ok?: boolean }>("DELETE", `/admin/records/${encodeURIComponent(id)}`),

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
    if (!API_BASE) throw new Error("Sunucu bağlantı ayarları eksik.");
    const body = new FormData();
    body.append("file", file);
    if (metadata) body.append("metadata", JSON.stringify(metadata));
    const res = await fetch(`${API_BASE}/files/upload`, {
      method: "POST",
      headers: headers(false),
      body,
      credentials: "include",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error("Sunucuya bağlanılamadı. Lütfen daha sonra tekrar deneyin.");
    return res.json();
  },

  listFiles: () => request<{ files?: unknown[] }>("GET", "/files"),

  deleteFile: (id: string) =>
    request<{ ok?: boolean }>("DELETE", `/files/${encodeURIComponent(id)}`),

  usageEvent: async (eventType: string, metadata?: Record<string, unknown>) => {
    if (isLocalDevApi()) {
      try {
        return await request<{ ok?: boolean }>("POST", "/usage/event", { event_type: eventType, metadata });
      } catch {
        return { ok: true };
      }
    }
    return request<{ ok?: boolean }>("POST", "/usage/event", { event_type: eventType, metadata });
  },

  listProfiles: () =>
    request<{ profiles: Array<{ id: string; isim: string; kurumAdi: string; rol: string }> }>("GET", "/profiles"),

  saveProfile: (data: { isim: string; kurumAdi: string; rol: string }) =>
    request<{ profile: { id: string; isim: string; kurumAdi: string; rol: string } }>("POST", "/profiles", data),

  deleteProfile: (id: string) =>
    request<{ ok?: boolean }>("DELETE", `/profiles/${encodeURIComponent(id)}`),

  getPushVapidPublicKey: () =>
    pushRequest<{ ok: boolean; publicKey?: string; error?: string }>(
      "GET",
      "/push/vapid-public-key",
      undefined,
      { includeAuth: false },
    ),

  getPushSettings: () =>
    pushRequest<{
      ok?: boolean;
      settings: PushSettingsPayload;
      hasActiveSubscription: boolean;
      vapidPublicKey: string | null;
    }>("GET", "/push/settings"),

  subscribePush: (body: {
    subscription: PushSubscriptionPayload;
    settings?: Partial<PushSettingsPayload>;
    dailyReminderEnabled?: boolean;
    dailyReminderTime?: string;
  }) =>
    pushRequest<{ ok: boolean; settings: PushSettingsPayload }>("POST", "/push/subscribe", body),

  unsubscribePush: (body?: { endpoint?: string }) =>
    pushRequest<{ ok: boolean }>("POST", "/push/unsubscribe", body ?? {}),

  updatePushSettings: (body: Partial<PushSettingsPayload>) =>
    pushRequest<{ ok: boolean; settings: PushSettingsPayload }>("POST", "/push/settings", body),

  sendPushTest: () => pushRequest<{ ok: boolean; sent: number }>("POST", "/push/test"),
};

export type PushSettingsPayload = {
  dailyReminderEnabled: boolean;
  dailyReminderTime: string;
};

export type PushSubscriptionPayload = {
  endpoint: string;
  expirationTime?: number | null;
  keys: { p256dh: string; auth: string };
};

import { parseMeUser } from "./adminAuth";
import { getAppUserEmail, normalizeEmail } from "./email";
import type { AppUserRecordData, BackendRecord, BackendUser } from "./types";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

/** Fetch yanıtı — Vercel TS ortamında global `Response` DOM/undici ile uyuşmayabiliyor. */
interface FetchHttpResponse {
  ok: boolean;
  status: number;
  text(): Promise<string>;
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
  return [];
}

function pageMeta(payload: unknown) {
  const p = payload as Record<string, unknown>;
  const d = (p.data && typeof p.data === "object" ? p.data : {}) as Record<string, unknown>;
  const meta = (p.meta && typeof p.meta === "object" ? p.meta : d.meta && typeof d.meta === "object" ? d.meta : {}) as Record<
    string,
    unknown
  >;
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

export class VpsApiClient {
  private adminRecordsBlocked = false;

  constructor(
    private readonly baseUrl: string,
    private readonly projectKey: string,
    private bearerToken?: string,
  ) {}

  setBearerToken(token: string | undefined) {
    this.bearerToken = token;
  }

  getBearerToken(): string | undefined {
    return this.bearerToken;
  }

  private headers(json = true): Record<string, string> {
    const h: Record<string, string> = {};
    if (json) h["Content-Type"] = "application/json";
    if (this.projectKey) h["X-Project-Key"] = this.projectKey;
    if (this.bearerToken) h.Authorization = `Bearer ${this.bearerToken}`;
    return h;
  }

  private async request<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
    const res = (await fetch(`${this.baseUrl.replace(/\/+$/, "")}${path}`, {
      method,
      headers: this.headers(body !== undefined),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })) as FetchHttpResponse;
    const text = await res.text();
    let data: unknown = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text };
    }
    if (!res.ok) {
      const err = data as { message?: unknown; error?: unknown };
      const message =
        typeof err.message === "string"
          ? err.message
          : typeof err.error === "string"
            ? err.error
            : text || "request_failed";
      throw new Error(`${res.status} ${message}`);
    }
    return data as T;
  }

  async me(): Promise<unknown> {
    return this.request<unknown>("GET", "/auth/me");
  }

  private parseAdminUsersPayload(payload: unknown): BackendUser[] {
    const users = normalizeRecords<BackendUser>(payload);
    if (users.length) return users;
    const p = payload as { users?: BackendUser[]; data?: BackendUser[] | { users?: BackendUser[] } };
    if (Array.isArray(p.users)) return p.users;
    if (Array.isArray(p.data)) return p.data;
    if (p.data && typeof p.data === "object" && Array.isArray((p.data as { users?: BackendUser[] }).users)) {
      return (p.data as { users: BackendUser[] }).users;
    }
    return [];
  }

  /** GET /admin/users — VPS'te auth veya app_user kataloğu dönebilir; meta ile birlikte. */
  async fetchAdminUsersCatalog(search?: string): Promise<{
    ok: boolean;
    status?: number;
    users: BackendUser[];
    error?: string;
  }> {
    const path = search
      ? `/admin/users?search=${encodeURIComponent(search.trim().toLocaleLowerCase("tr-TR"))}`
      : "/admin/users";
    const baseUrl = this.baseUrl.replace(/\/+$/, "");
    const res = (await fetch(`${baseUrl}${path}`, {
      method: "GET",
      headers: this.headers(false),
    })) as FetchHttpResponse;
    const text = await res.text();
    let data: unknown = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text };
    }
    if (!res.ok) {
      const err = data as { message?: unknown; error?: unknown };
      const message =
        typeof err.message === "string"
          ? err.message
          : typeof err.error === "string"
            ? err.error
            : text || "request_failed";
      return { ok: false, status: res.status, users: [], error: `${res.status} ${message}` };
    }
    return { ok: true, status: res.status, users: this.parseAdminUsersPayload(data) };
  }

  async listAuthUsers(): Promise<BackendUser[]> {
    const result = await this.fetchAdminUsersCatalog();
    return result.users;
  }

  /**
   * Teşhis: hedef e-posta için auth id (login tablosu). Admin bearer geri yüklenir.
   * Register/PUT yok; yalnızca okuma amaçlı kimlik doğrulama.
   */
  async probeAuthLogin(
    email: string,
    password: string,
  ): Promise<{ user: BackendUser | null; status?: number; error?: string }> {
    const saved = this.bearerToken;
    try {
      const baseUrl = this.baseUrl.replace(/\/+$/, "");
      const res = (await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: this.headers(true),
        body: JSON.stringify({ email, password }),
      })) as FetchHttpResponse;
      const text = await res.text();
      let data: unknown = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { message: text };
      }
      if (!res.ok) {
        const err = data as { message?: unknown; error?: unknown };
        const message =
          typeof err.message === "string"
            ? err.message
            : typeof err.error === "string"
              ? err.error
              : text || "login_failed";
        return { user: null, status: res.status, error: message };
      }
      let user = parseMeUser(data);
      if (!user?.id && data && typeof data === "object") {
        const raw = data as Record<string, unknown>;
        if (raw.id != null || typeof raw.email === "string") {
          user = {
            id: raw.id as string | number,
            email: typeof raw.email === "string" ? raw.email : undefined,
            role: typeof raw.role === "string" ? raw.role : undefined,
          };
        }
      }
      return { user, status: res.status };
    } finally {
      this.bearerToken = saved;
    }
  }

  async fetchAllFromPath<T>(path: "/records" | "/admin/records", recordType: string, maxPages = 100): Promise<BackendRecord<T>[]> {
    const limit = 100;
    const all: BackendRecord<T>[] = [];
    const seenIds = new Set<string>();
    let cursor: string | undefined;

    for (let pageIndex = 0; pageIndex < maxPages; pageIndex += 1) {
      const params = new URLSearchParams();
      params.set("record_type", recordType);
      params.set("limit", String(limit));
      if (cursor) params.set("cursor", cursor);
      else {
        params.set("page", String(pageIndex + 1));
        params.set("offset", String(pageIndex * limit));
      }
      const payload = await this.request<unknown>("GET", `${path}?${params.toString()}`);
      const records = normalizeRecords<T>(payload);
      const meta = pageMeta(payload);
      let newRecords = 0;
      for (const record of records) {
        const key = String(record.id);
        if (seenIds.has(key)) continue;
        seenIds.add(key);
        all.push(record);
        newRecords += 1;
      }
      if (!records.length || !newRecords) break;
      if (meta.total != null && all.length >= meta.total) break;
      if (meta.nextCursor) {
        cursor = meta.nextCursor;
        continue;
      }
      if (meta.hasMore === false) break;
      if (records.length < limit) break;
    }
    return all;
  }

  /**
   * Teşhis: hedef e-postalar bulunana kadar sayfalı /records (tam 852 tarama yok).
   */
  async fetchAppUsersForDiagnose(
    targetEmails: string[],
    authUserIds: string[],
    maxPages = 25,
  ): Promise<{ records: BackendRecord<AppUserRecordData>[]; pagesFetched: number; stoppedEarly: boolean }> {
    const targets = new Set(targetEmails.map((e) => normalizeEmail(e)).filter(Boolean));
    const authIds = new Set(authUserIds.filter(Boolean));
    const foundTargets = new Set<string>();
    const limit = 100;
    const matches: BackendRecord<AppUserRecordData>[] = [];
    const seenIds = new Set<string>();
    let cursor: string | undefined;
    let pagesFetched = 0;
    let stoppedEarly = false;

    for (let pageIndex = 0; pageIndex < maxPages; pageIndex += 1) {
      const params = new URLSearchParams();
      params.set("record_type", "app_user");
      params.set("limit", String(limit));
      if (cursor) params.set("cursor", cursor);
      else {
        params.set("page", String(pageIndex + 1));
        params.set("offset", String(pageIndex * limit));
      }
      const payload = await this.request<unknown>("GET", `/records?${params.toString()}`);
      const records = normalizeRecords<AppUserRecordData>(payload);
      const meta = pageMeta(payload);
      pagesFetched += 1;

      for (const record of records) {
        const key = String(record.id);
        if (seenIds.has(key)) continue;
        const computed = getAppUserEmail(record);
        const recordAuthId = String(record.data?.authUserId ?? "");
        const emailHit = computed && targets.has(computed);
        const authHit = recordAuthId && authIds.has(recordAuthId);
        if (!emailHit && !authHit) continue;
        seenIds.add(key);
        matches.push(record);
        if (computed && targets.has(computed)) foundTargets.add(computed);
      }

      if (targets.size > 0 && foundTargets.size >= targets.size) {
        stoppedEarly = true;
        break;
      }
      if (!records.length) break;
      if (meta.nextCursor) {
        cursor = meta.nextCursor;
        continue;
      }
      if (meta.hasMore === false) break;
      if (records.length < limit) break;
    }

    return { records: matches, pagesFetched, stoppedEarly };
  }

  async loadAllAppUsers(): Promise<BackendRecord<AppUserRecordData>[]> {
    const owned = await this.fetchAllFromPath<AppUserRecordData>("/records", "app_user").catch(() => []);
    if (this.adminRecordsBlocked) return owned;
    try {
      const admin = await this.fetchAllFromPath<AppUserRecordData>("/admin/records", "app_user");
      const byId = new Map<string, BackendRecord<AppUserRecordData>>();
      for (const r of [...owned, ...admin]) byId.set(String(r.id), r);
      return [...byId.values()];
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes("403") || msg.toLowerCase().includes("forbidden")) {
        this.adminRecordsBlocked = true;
        return owned;
      }
      throw error;
    }
  }

  async updateAppUser(id: string | number, data: AppUserRecordData): Promise<BackendRecord<AppUserRecordData>> {
    const body = { record_type: "app_user", data };
    try {
      const res = await this.request<{ record?: BackendRecord<AppUserRecordData>; data?: BackendRecord<AppUserRecordData> }>(
        "PUT",
        `/records/${encodeURIComponent(id)}`,
        body,
      );
      return (res.record ?? res.data ?? res) as BackendRecord<AppUserRecordData>;
    } catch (ownedError) {
      if (this.adminRecordsBlocked) throw ownedError;
      try {
        const res = await this.request<{ record?: BackendRecord<AppUserRecordData>; data?: BackendRecord<AppUserRecordData> }>(
          "PUT",
          `/admin/records/${encodeURIComponent(id)}`,
          body,
        );
        return (res.record ?? res.data ?? res) as BackendRecord<AppUserRecordData>;
      } catch {
        throw ownedError;
      }
    }
  }

  async registerAuth(email: string, password: string, name: string): Promise<BackendUser | null> {
    try {
      const res = await this.request<{ user?: BackendUser }>("POST", "/auth/register", { email, password, name });
      return res.user ?? null;
    } catch (error) {
      const msg = (error instanceof Error ? error.message : String(error)).toLocaleLowerCase("tr-TR");
      if (msg.includes("409") || msg.includes("conflict") || msg.includes("zaten") || msg.includes("already")) {
        return null;
      }
      throw error;
    }
  }

  async loginAuth(email: string, password: string): Promise<BackendUser | null> {
    try {
      const res = await this.request<{ user?: BackendUser }>("POST", "/auth/login", { email, password });
      return res.user ?? null;
    } catch {
      return null;
    }
  }

  findAuthUserByEmail(authUsers: BackendUser[], email: string): BackendUser | null {
    const normalized = email.trim().toLocaleLowerCase("tr-TR");
    return (
      authUsers.find((u) => (typeof u.email === "string" ? u.email.trim().toLocaleLowerCase("tr-TR") : "") === normalized) ??
      null
    );
  }
}

export function passwordForDistrict(district?: string | null): string {
  const codes: Record<string, string> = {
    burdur: "153415",
    merkez: "153415",
    alanya: "073407",
    kemer: "073407",
    manavgat: "073407",
    isparta: "323432",
    aglasun: "153415",
    yesilova: "153415",
  };
  const key = String(district ?? "").trim().toLowerCase();
  if (codes[key]) return codes[key];
  const partial = Object.entries(codes).find(([k]) => key.includes(k));
  return partial?.[1] ?? "tedris2026";
}

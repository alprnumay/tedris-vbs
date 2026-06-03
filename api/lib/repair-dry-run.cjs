"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server/tedris-repair/diagnoseOnlyEntry.ts
var diagnoseOnlyEntry_exports = {};
__export(diagnoseOnlyEntry_exports, {
  assertAdminCaller: () => assertAdminCaller,
  createVpsClientFromEnv: () => createVpsClientFromEnv,
  isAdminUser: () => isAdminUser,
  parseMeUser: () => parseMeUser,
  runDiagnoseEmailsOnly: () => runDiagnoseEmailsOnly
});
module.exports = __toCommonJS(diagnoseOnlyEntry_exports);

// server/tedris-repair/adminAuth.ts
function normalizeEmail(value) {
  return (value ?? "").trim().toLocaleLowerCase("tr-TR");
}
function parseMeUser(payload) {
  if (!payload || typeof payload !== "object") return null;
  const raw = payload;
  if (raw.user && typeof raw.user === "object") {
    return raw.user;
  }
  if (raw.id != null || typeof raw.email === "string") {
    return raw;
  }
  return null;
}
function userFromJwtPayload(token) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(b64, "base64").toString("utf8");
    const p = JSON.parse(json);
    const id = p.id ?? p.userId ?? p.sub;
    const email = typeof p.email === "string" ? p.email : void 0;
    if (id == null && !email) return null;
    return {
      id,
      email,
      role: typeof p.role === "string" ? p.role : void 0,
      isAdmin: typeof p.isAdmin === "boolean" ? p.isAdmin : void 0
    };
  } catch {
    return null;
  }
}
function isAdminUser(user, configuredAdminEmail) {
  const email = normalizeEmail(user.email);
  const role = String(user.role ?? "").trim().toLowerCase();
  const adminEmail = normalizeEmail(configuredAdminEmail);
  if (Boolean(user.isAdmin)) return true;
  if (role === "admin" || role === "super_admin") return true;
  if (adminEmail && email && email === adminEmail) return true;
  return false;
}
function resolveAdminUser(mePayload, bearerToken) {
  const fromMe = parseMeUser(mePayload);
  if (fromMe?.id != null || fromMe?.email) return fromMe;
  return userFromJwtPayload(bearerToken);
}

// server/tedris-repair/email.ts
function normalizeEmail2(value) {
  return (value ?? "").trim().toLocaleLowerCase("tr-TR");
}
function getAppUserEmail(source) {
  const raw = source;
  const nested = raw.data ?? raw.payload ?? {};
  for (const value of [
    raw.email,
    raw.loginEmail,
    raw.generatedEmail,
    raw.username,
    nested.email,
    nested.loginEmail,
    nested.generatedEmail,
    nested.username
  ]) {
    const normalized = normalizeEmail2(value);
    if (normalized) return normalized;
  }
  return "";
}
function appUserDataFromRecord(record) {
  const raw = record;
  const payload = raw.payload ?? {};
  const data = raw.data ?? {};
  const merged = { ...payload, ...raw, ...data, id: data.id ?? String(raw.id) };
  const email = getAppUserEmail(record);
  return {
    ...merged,
    email: email || merged.email,
    loginEmail: merged.loginEmail ?? (email || void 0),
    generatedEmail: merged.generatedEmail ?? (email || void 0)
  };
}
function isDeletedOrInactive(data) {
  const status = String(data.status ?? "").trim().toLocaleLowerCase("tr-TR");
  return Boolean(data.deletedAt || data.isActive === false || status === "inactive" || status === "deleted");
}
function appUserMatchScore(data, authUserId) {
  let score = 0;
  if (!isDeletedOrInactive(data)) score += 1e4;
  if (data.institutionCode) score += 2e3;
  if (!data.deletedAt) score += 1e3;
  if (data.authUserId) score += 500;
  if (authUserId && String(data.authUserId) === authUserId) score += 250;
  if (data.institutionName) score += 40;
  if (data.district) score += 40;
  if (data.province) score += 20;
  return score + (Date.parse(data.updatedAt ?? data.createdAt ?? "") || 0) / 1e15;
}
function selectPrimaryAppUserRecord(records, authUserId) {
  return records.slice().sort(
    (a, b) => appUserMatchScore(appUserDataFromRecord(b), authUserId) - appUserMatchScore(appUserDataFromRecord(a), authUserId)
  )[0] ?? null;
}

// server/tedris-repair/vpsClient.ts
function normalizeRecords(payload) {
  if (Array.isArray(payload)) return payload;
  const p = payload;
  const d = p.data;
  if (Array.isArray(p.records)) return p.records;
  if (Array.isArray(p.items)) return p.items;
  if (Array.isArray(p.data)) return p.data;
  if (d && Array.isArray(d.records)) return d.records;
  if (d && Array.isArray(d.items)) return d.items;
  if (d && Array.isArray(d.data)) return d.data;
  if (payload.id != null) return [payload];
  if (p.record && p.record.id != null) return [p.record];
  return [];
}
function pageMeta(payload) {
  const p = payload;
  const d = p.data && typeof p.data === "object" ? p.data : {};
  const meta = p.meta && typeof p.meta === "object" ? p.meta : d.meta && typeof d.meta === "object" ? d.meta : {};
  const read = (keys) => {
    for (const key of keys) {
      const value = p[key] ?? d[key] ?? meta[key];
      if (value != null) return value;
    }
    return void 0;
  };
  const totalRaw = read(["total", "totalCount", "total_count"]);
  const hasMoreRaw = read(["hasMore", "has_more", "hasNextPage", "has_next_page"]);
  return {
    total: typeof totalRaw === "number" ? totalRaw : typeof totalRaw === "string" ? Number(totalRaw) : void 0,
    hasMore: typeof hasMoreRaw === "boolean" ? hasMoreRaw : void 0,
    nextCursor: read(["nextCursor", "next_cursor", "cursor", "next"])
  };
}
var VpsApiClient = class {
  constructor(baseUrl, projectKey, bearerToken) {
    this.baseUrl = baseUrl;
    this.projectKey = projectKey;
    this.bearerToken = bearerToken;
  }
  adminRecordsBlocked = false;
  setBearerToken(token) {
    this.bearerToken = token;
  }
  getBearerToken() {
    return this.bearerToken;
  }
  headers(json = true) {
    const h = {};
    if (json) h["Content-Type"] = "application/json";
    if (this.projectKey) h["X-Project-Key"] = this.projectKey;
    if (this.bearerToken) h.Authorization = `Bearer ${this.bearerToken}`;
    return h;
  }
  async request(method, path, body) {
    const res = await fetch(`${this.baseUrl.replace(/\/+$/, "")}${path}`, {
      method,
      headers: this.headers(body !== void 0),
      body: body !== void 0 ? JSON.stringify(body) : void 0
    });
    const text = await res.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text };
    }
    if (!res.ok) {
      const err = data;
      const message = typeof err.message === "string" ? err.message : typeof err.error === "string" ? err.error : text || "request_failed";
      throw new Error(`${res.status} ${message}`);
    }
    return data;
  }
  async me() {
    return this.request("GET", "/auth/me");
  }
  parseAdminUsersPayload(payload) {
    const users = normalizeRecords(payload);
    if (users.length) return users;
    const p = payload;
    if (Array.isArray(p.users)) return p.users;
    if (Array.isArray(p.data)) return p.data;
    if (p.data && typeof p.data === "object" && Array.isArray(p.data.users)) {
      return p.data.users;
    }
    return [];
  }
  /** GET /admin/users — VPS'te auth veya app_user kataloğu dönebilir; meta ile birlikte. */
  async fetchAdminUsersCatalog(search) {
    const path = search ? `/admin/users?search=${encodeURIComponent(search.trim().toLocaleLowerCase("tr-TR"))}` : "/admin/users";
    const baseUrl = this.baseUrl.replace(/\/+$/, "");
    const res = await fetch(`${baseUrl}${path}`, {
      method: "GET",
      headers: this.headers(false)
    });
    const text = await res.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text };
    }
    if (!res.ok) {
      const err = data;
      const message = typeof err.message === "string" ? err.message : typeof err.error === "string" ? err.error : text || "request_failed";
      return { ok: false, status: res.status, users: [], error: `${res.status} ${message}` };
    }
    return { ok: true, status: res.status, users: this.parseAdminUsersPayload(data) };
  }
  async listAuthUsers() {
    const result = await this.fetchAdminUsersCatalog();
    return result.users;
  }
  /**
   * Teşhis: hedef e-posta için auth id (login tablosu). Admin bearer geri yüklenir.
   * Register/PUT yok; yalnızca okuma amaçlı kimlik doğrulama.
   */
  async probeAuthLogin(email, password) {
    const saved = this.bearerToken;
    try {
      const baseUrl = this.baseUrl.replace(/\/+$/, "");
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: this.headers(true),
        body: JSON.stringify({ email, password })
      });
      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { message: text };
      }
      if (!res.ok) {
        const err = data;
        const message = typeof err.message === "string" ? err.message : typeof err.error === "string" ? err.error : text || "login_failed";
        return { user: null, status: res.status, error: message };
      }
      let user = parseMeUser(data);
      if (!user?.id && data && typeof data === "object") {
        const raw = data;
        if (raw.id != null || typeof raw.email === "string") {
          user = {
            id: raw.id,
            email: typeof raw.email === "string" ? raw.email : void 0,
            role: typeof raw.role === "string" ? raw.role : void 0
          };
        }
      }
      return { user, status: res.status };
    } finally {
      this.bearerToken = saved;
    }
  }
  async fetchAllFromPath(path, recordType, maxPages = 100) {
    const limit = 100;
    const all = [];
    const seenIds = /* @__PURE__ */ new Set();
    let cursor;
    for (let pageIndex = 0; pageIndex < maxPages; pageIndex += 1) {
      const params = new URLSearchParams();
      params.set("record_type", recordType);
      params.set("limit", String(limit));
      if (cursor) params.set("cursor", cursor);
      else {
        params.set("page", String(pageIndex + 1));
        params.set("offset", String(pageIndex * limit));
      }
      const payload = await this.request("GET", `${path}?${params.toString()}`);
      const records = normalizeRecords(payload);
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
  async fetchAppUsersForDiagnose(targetEmails, authUserIds, maxPages = 25) {
    const targets = new Set(targetEmails.map((e) => normalizeEmail2(e)).filter(Boolean));
    const authIds = new Set(authUserIds.filter(Boolean));
    const foundTargets = /* @__PURE__ */ new Set();
    const limit = 100;
    const matches = [];
    const seenIds = /* @__PURE__ */ new Set();
    let cursor;
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
      const payload = await this.request("GET", `/records?${params.toString()}`);
      const records = normalizeRecords(payload);
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
  async loadAllAppUsers() {
    const owned = await this.fetchAllFromPath("/records", "app_user").catch(() => []);
    if (this.adminRecordsBlocked) return owned;
    try {
      const admin = await this.fetchAllFromPath("/admin/records", "app_user");
      const byId = /* @__PURE__ */ new Map();
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
  async updateAppUser(id, data) {
    const body = { record_type: "app_user", data };
    try {
      const res = await this.request(
        "PUT",
        `/records/${encodeURIComponent(id)}`,
        body
      );
      return res.record ?? res.data ?? res;
    } catch (ownedError) {
      if (this.adminRecordsBlocked) throw ownedError;
      try {
        const res = await this.request(
          "PUT",
          `/admin/records/${encodeURIComponent(id)}`,
          body
        );
        return res.record ?? res.data ?? res;
      } catch {
        throw ownedError;
      }
    }
  }
  async registerAuth(email, password, name) {
    try {
      const res = await this.request("POST", "/auth/register", { email, password, name });
      return res.user ?? null;
    } catch (error) {
      const msg = (error instanceof Error ? error.message : String(error)).toLocaleLowerCase("tr-TR");
      if (msg.includes("409") || msg.includes("conflict") || msg.includes("zaten") || msg.includes("already")) {
        return null;
      }
      throw error;
    }
  }
  async loginAuth(email, password) {
    try {
      const res = await this.request("POST", "/auth/login", { email, password });
      return res.user ?? null;
    } catch {
      return null;
    }
  }
  findAuthUserByEmail(authUsers, email) {
    const normalized = email.trim().toLocaleLowerCase("tr-TR");
    return authUsers.find((u) => (typeof u.email === "string" ? u.email.trim().toLocaleLowerCase("tr-TR") : "") === normalized) ?? null;
  }
};
function passwordForDistrict(district) {
  const codes = {
    burdur: "153415",
    merkez: "153415",
    alanya: "073407",
    kemer: "073407",
    manavgat: "073407",
    isparta: "323432",
    aglasun: "153415",
    yesilova: "153415"
  };
  const key = String(district ?? "").trim().toLowerCase();
  if (codes[key]) return codes[key];
  const partial = Object.entries(codes).find(([k]) => key.includes(k));
  return partial?.[1] ?? "tedris2026";
}

// server/tedris-repair/authLookup.ts
function emptyMeta() {
  return {
    source: "GET /admin/users",
    catalogKind: "empty",
    trustedForAuthIdentity: false,
    resolvedVia: "none",
    loginProbeUsed: false,
    loginProbeSideEffects: [],
    attempts: [],
    listUserCount: 0
  };
}
function userEmail(u) {
  const raw = u;
  return normalizeEmail2(
    typeof raw.email === "string" ? raw.email : typeof raw.data?.email === "string" ? raw.data.email : getAppUserEmail(raw)
  );
}
function userLooksLikeAppUserRecord(u) {
  const raw = u;
  const data = raw.data ?? {};
  if (raw.recordType === "app_user" || raw.record_type === "app_user") return true;
  if (data.institutionCode || data.institutionName || raw.institutionCode || raw.institutionName) return true;
  return false;
}
function detectAuthCatalogKind(users) {
  if (!users.length) return "empty";
  const appLike = users.filter(userLooksLikeAppUserRecord).length;
  if (appLike === 0) return "auth";
  if (appLike >= users.length * 0.5) return "app_user";
  return "mixed";
}
function findAuthUserInList(users, email, catalogKind) {
  const normalized = normalizeEmail2(email);
  if (!normalized || catalogKind === "app_user") return null;
  return users.find((u) => userEmail(u) === normalized) ?? null;
}
function loginProbePasswords(district, province) {
  const out = [];
  for (const part of [district, province]) {
    const pw = passwordForDistrict(part);
    if (pw && !out.includes(pw)) out.push(pw);
  }
  if (!out.includes("tedris2026")) out.push("tedris2026");
  return out;
}
async function resolveAuthUserForDiagnosis(client, email, opts) {
  const meta = emptyMeta();
  const normalized = normalizeEmail2(email);
  if (!normalized) return { user: null, meta };
  const listResult = await client.fetchAdminUsersCatalog();
  meta.attempts.push({
    endpoint: "GET /admin/users",
    ok: listResult.ok,
    status: listResult.status,
    userCount: listResult.users.length,
    error: listResult.error
  });
  meta.listUserCount = listResult.users.length;
  meta.catalogKind = detectAuthCatalogKind(listResult.users);
  if (listResult.ok && meta.catalogKind !== "app_user") {
    const fromList = findAuthUserInList(listResult.users, normalized, meta.catalogKind);
    if (fromList?.id != null) {
      meta.trustedForAuthIdentity = true;
      meta.resolvedVia = "admin_users_list";
      meta.source = "GET /admin/users";
      return { user: fromList, meta };
    }
  }
  if (listResult.ok) {
    const searchResult = await client.fetchAdminUsersCatalog(normalized);
    meta.attempts.push({
      endpoint: `GET /admin/users?search=${encodeURIComponent(normalized)}`,
      ok: searchResult.ok,
      status: searchResult.status,
      userCount: searchResult.users.length,
      error: searchResult.error,
      note: meta.catalogKind === "app_user" ? "catalog_is_app_user_records_not_auth" : void 0
    });
    const searchKind = detectAuthCatalogKind(searchResult.users);
    if (searchResult.ok && searchKind !== "app_user") {
      const fromSearch = findAuthUserInList(searchResult.users, normalized, searchKind);
      if (fromSearch?.id != null) {
        meta.trustedForAuthIdentity = true;
        meta.resolvedVia = "admin_users_search";
        meta.source = meta.attempts[meta.attempts.length - 1].endpoint;
        return { user: fromSearch, meta };
      }
    }
  }
  if (opts?.appUserRecordExists !== false) {
    const passwords = loginProbePasswords(opts?.district, opts?.province);
    for (const password of passwords) {
      const probe = await client.probeAuthLogin(normalized, password);
      meta.attempts.push({
        endpoint: "POST /auth/login",
        ok: Boolean(probe.user?.id),
        note: "diagnosis_probe_restores_admin_bearer"
      });
      if (probe.user?.id != null) {
        meta.loginProbeUsed = true;
        meta.loginProbeSideEffects = [
          "POST /auth/login ba\u015Far\u0131l\u0131 olursa VPS auth.lastLoginAt g\xFCncellenebilir; veri onar\u0131m\u0131 yap\u0131lmaz."
        ];
        meta.trustedForAuthIdentity = true;
        meta.resolvedVia = "login_probe";
        meta.source = "POST /auth/login";
        return { user: probe.user, meta };
      }
    }
  }
  if (!listResult.ok) {
    meta.catalogKind = "unknown";
  } else if (meta.catalogKind === "app_user") {
    meta.source = "GET /admin/users (app_user catalog \u2014 auth id listesi de\u011Fil)";
  }
  return { user: null, meta };
}

// server/tedris-repair/diagnoseDryRun.ts
function recordOwnerId(record) {
  const raw = record;
  const nested = raw.data ?? raw.payload ?? {};
  const nestedOwner = nested.userId;
  const id = record.userId ?? nestedOwner ?? raw.userId;
  return id != null && String(id).trim() !== "" ? String(id) : null;
}
function buildDiagnosticTags(normalized, group, authUserId, primary, recordAuthId) {
  const tags = [];
  if (!group.length) {
    tags.push("appUserMissing");
    return tags;
  }
  if (group.length > 1) tags.push("duplicateEmail");
  if (!primary) return tags;
  const data = appUserDataFromRecord(primary);
  if (isDeletedOrInactive(data)) tags.push("inactiveDeleted");
  const ownerId = recordOwnerId(primary);
  if (authUserId && ownerId && ownerId !== authUserId) tags.push("appUserOwnerMismatch");
  if (authUserId && recordAuthId && recordAuthId !== authUserId) tags.push("authUserIdMismatch");
  if (authUserId && (!recordAuthId || recordAuthId !== authUserId)) tags.push("authFoundWouldLink");
  return [...new Set(tags)];
}
function emailFieldsFromRecord(record) {
  const raw = record;
  const nested = raw.data ?? raw.payload ?? {};
  return {
    topLevel: raw.email ?? null,
    dataEmail: nested.email ?? null,
    loginEmail: nested.loginEmail ?? raw.loginEmail ?? null,
    generatedEmail: nested.generatedEmail ?? raw.generatedEmail ?? null,
    username: nested.username ?? raw.username ?? null,
    computed: getAppUserEmail(record) || null
  };
}
function resolveEmailCategory(email, group, authUser, primary, authLookup) {
  if (!group.length) {
    if (authUser?.id && authLookup.trustedForAuthIdentity) return "appUserMissing";
    if (authUser?.id) return "authExistsButNotResolved";
    return authLookup.trustedForAuthIdentity ? "failed" : "authLookupUnavailable";
  }
  if (group.length > 1) return "duplicateEmails";
  if (!primary) return "failed";
  const data = appUserDataFromRecord(primary);
  if (isDeletedOrInactive(data)) return "inactiveOrDeleted";
  const computed = getAppUserEmail(primary);
  if (!computed) return "missingEmail";
  const authId = authUser?.id != null ? String(authUser.id) : null;
  const recordAuthId = data.authUserId ? String(data.authUserId) : null;
  if (!authLookup.trustedForAuthIdentity || !authId) {
    return "authExistsButNotResolved";
  }
  if (recordAuthId && recordAuthId === authId) {
    const authEmail = typeof authUser?.email === "string" ? normalizeEmail2(authUser.email) : "";
    if (authEmail === email) return "alreadyLinked";
  }
  if (!recordAuthId || recordAuthId !== authId) return "authFoundWouldLink";
  return "failed";
}
function diagnoseRepairEmail(email, records, authUser, authLookup) {
  const normalized = normalizeEmail2(email);
  const authUserId = authUser?.id != null && authLookup.trustedForAuthIdentity ? String(authUser.id) : null;
  const group = records.filter((record) => {
    const computed = getAppUserEmail(record);
    if (computed === normalized) return true;
    if (authUserId && String(record.data?.authUserId ?? "") === authUserId) return true;
    return false;
  });
  const byEmailOnly = records.filter((r) => getAppUserEmail(r) === normalized);
  const byAuthIdOnly = authUserId ? records.filter((r) => String(r.data?.authUserId ?? "") === authUserId) : [];
  const primary = selectPrimaryAppUserRecord(group, authUserId ?? void 0) ?? group[0] ?? null;
  const data = primary ? appUserDataFromRecord(primary) : null;
  const fields = primary ? emailFieldsFromRecord(primary) : emailFieldsFromRecord({ id: "", data: {} });
  const recordAuthId = data?.authUserId ? String(data.authUserId) : null;
  const category = resolveEmailCategory(normalized, group, authUser, primary, authLookup);
  const recordUserId = primary ? recordOwnerId(primary) : null;
  const diagnosticTags = buildDiagnosticTags(normalized, group, authUserId, primary, recordAuthId);
  const expectedAuthUserId = authUserId;
  const ownerMismatch = Boolean(expectedAuthUserId && recordUserId && recordUserId !== expectedAuthUserId);
  const authLinkMissing = Boolean(primary && !recordAuthId);
  return {
    email: normalized,
    category,
    authUserId,
    authUserExists: Boolean(authUserId),
    expectedAuthUserId,
    ownerMismatch,
    authLinkMissing,
    authLookup: {
      source: authLookup.source,
      catalogKind: authLookup.catalogKind,
      trustedForAuthIdentity: authLookup.trustedForAuthIdentity,
      resolvedVia: authLookup.resolvedVia,
      loginProbeUsed: authLookup.loginProbeUsed,
      loginProbeSideEffects: authLookup.loginProbeSideEffects,
      listUserCount: authLookup.listUserCount,
      attempts: authLookup.attempts
    },
    appUserId: primary ? String(primary.id) : null,
    recordUserId,
    recordOwnerMatchesAuth: Boolean(authUserId && recordUserId && recordUserId === authUserId),
    institutionName: data?.institutionName ?? null,
    diagnosticTags,
    emailFields: fields,
    authUserIdOnRecord: recordAuthId,
    authUserIdMatchesAuth: Boolean(authUserId && recordAuthId && recordAuthId === authUserId),
    institutionCode: data?.institutionCode ?? null,
    district: data?.district ?? null,
    province: data?.province ?? null,
    status: data?.status ?? null,
    isActive: data?.isActive ?? null,
    deletedAt: data?.deletedAt ?? null,
    duplicateAppUserIds: group.length > 1 ? group.map((r) => String(r.id)) : [],
    adminCatalogCandidatesByEmail: byEmailOnly.length,
    adminCatalogCandidatesByAuthId: byAuthIdOnly.length,
    loginScopedRecordsNote: "Yurt JWT ile GET /records?record_type=app_user yaln\u0131zca sahibine ait kay\u0131tlar\u0131 d\xF6nd\xFCr\xFCr; admin katalogda kay\u0131t olsa bile login an\u0131nda ownedCount 0 olabilir. authUserId ba\u011Flama tek ba\u015F\u0131na yetmeyebilir \u2014 recordUserId (owner) auth id ile e\u015Fle\u015Fmelidir."
  };
}

// server/tedris-repair/repairAppUserAuthLinks.ts
async function runDiagnoseEmailsOnly(client, diagnoseEmails) {
  const emails = diagnoseEmails.map((e) => normalizeEmail2(e)).filter(Boolean);
  const { records, pagesFetched, stoppedEarly } = await client.fetchAppUsersForDiagnose(emails, []);
  const emailDiagnosis = [];
  for (const email of emails) {
    const group = records.filter((r) => getAppUserEmail(r) === email);
    const primary = group[0] ?? null;
    const data = primary ? appUserDataFromRecord(primary) : null;
    const authResolution = await resolveAuthUserForDiagnosis(client, email, {
      district: data?.district,
      province: data?.province,
      appUserRecordExists: Boolean(primary)
    });
    emailDiagnosis.push(
      diagnoseRepairEmail(email, records, authResolution.user, authResolution.meta)
    );
  }
  console.log("[TEDRIS_REPAIR_DRY_RUN]", {
    dryRun: true,
    mode: "diagnose_emails_only",
    pagesFetched,
    recordsLoaded: records.length,
    stoppedEarly,
    emailCount: emails.length,
    emailDiagnosis
  });
  for (const row of emailDiagnosis) {
    console.log("[TEDRIS_REPAIR_EMAIL_DIAG_LINE]", row);
  }
  return {
    ok: true,
    dryRun: true,
    dataChanged: false,
    emailDiagnosis,
    catalogMeta: {
      mode: "diagnose_emails_only",
      pagesFetched,
      recordsLoaded: records.length,
      stoppedEarly,
      targetEmailCount: emails.length,
      authLookupNote: "Auth kimli\u011Fi: \xF6nce GET /admin/users (VPS \xE7o\u011Fu zaman app_user katalo\u011Fu d\xF6ner, auth id de\u011Fil); g\xFCvenilir de\u011Filse POST /auth/login te\u015Fhis probesi (district/tedris2026 \u015Fifreleri). authWouldCreate dry-run'da kullan\u0131lmaz."
    }
  };
}
function createVpsClientFromEnv(bearerToken) {
  const baseUrl = process.env.VPS_API_BASE_URL ?? "";
  const projectKey = process.env.VPS_PROJECT_API_KEY ?? "";
  if (!baseUrl || !projectKey) {
    throw new Error("VPS_API_BASE_URL ve VPS_PROJECT_API_KEY tan\u0131ml\u0131 olmal\u0131.");
  }
  return new VpsApiClient(baseUrl, projectKey, bearerToken);
}
async function assertAdminCaller(client, adminEmail) {
  const configuredAdmin = (adminEmail || process.env.ADMIN_EMAIL || "").trim().toLocaleLowerCase("tr-TR");
  const token = client.getBearerToken();
  let mePayload = null;
  try {
    mePayload = await client.me();
  } catch {
    mePayload = null;
  }
  let user = resolveAdminUser(mePayload, token);
  if (!user?.id && !user?.email) {
    user = userFromJwtPayload(token);
  }
  const hasIdentity = user?.id != null || Boolean(user?.email);
  if (!hasIdentity) {
    throw new Error("401 Oturum do\u011Frulanamad\u0131.");
  }
  if (!isAdminUser(user, configuredAdmin)) {
    throw new Error("403 Bu i\u015Flem i\xE7in admin yetkisi gerekir.");
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  assertAdminCaller,
  createVpsClientFromEnv,
  isAdminUser,
  parseMeUser,
  runDiagnoseEmailsOnly
});

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
  runDiagnoseEmailsOnly: () => runDiagnoseEmailsOnly
});
module.exports = __toCommonJS(diagnoseOnlyEntry_exports);

// server/tedris-repair/email.ts
function normalizeEmail(value) {
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
    const normalized = normalizeEmail(value);
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
function resolveEmailCategory(email, group, authUser, primary) {
  if (!group.length) {
    return authUser ? "appUserMissing" : "failed";
  }
  if (group.length > 1) return "duplicateEmails";
  if (!primary) return "failed";
  const data = appUserDataFromRecord(primary);
  if (isDeletedOrInactive(data)) return "inactiveOrDeleted";
  const computed = getAppUserEmail(primary);
  if (!computed) return "missingEmail";
  const authId = authUser?.id != null ? String(authUser.id) : null;
  const recordAuthId = data.authUserId ? String(data.authUserId) : null;
  if (authId && recordAuthId && recordAuthId === authId) {
    const authEmail = typeof authUser?.email === "string" ? normalizeEmail(authUser.email) : "";
    if (authEmail === email) return "alreadyLinked";
  }
  if (authUser?.id && !recordAuthId) return "authFoundWouldLink";
  if (authUser?.id && recordAuthId && recordAuthId !== authId) return "authFoundWouldLink";
  if (!authUser?.id) return "authWouldCreate";
  return "failed";
}
function diagnoseRepairEmail(email, records, authUsers) {
  const normalized = normalizeEmail(email);
  const authUser = authUsers.find((a) => (typeof a.email === "string" ? normalizeEmail(a.email) : "") === normalized) ?? null;
  const authUserId = authUser?.id != null ? String(authUser.id) : null;
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
  const category = resolveEmailCategory(normalized, group, authUser, primary);
  const recordUserId = primary ? recordOwnerId(primary) : null;
  const diagnosticTags = buildDiagnosticTags(normalized, group, authUserId, primary, recordAuthId);
  return {
    email: normalized,
    category,
    authUserId,
    authUserExists: Boolean(authUser?.id),
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
    loginScopedRecordsNote: "Yurt JWT ile GET /records?record_type=app_user yaln\u0131zca sahibine ait kay\u0131tlar\u0131 d\xF6nd\xFCr\xFCr; admin katalogda kay\u0131t olsa bile login an\u0131nda ownedCount 0 olabilir. authUserId ba\u011Flama tek ba\u015F\u0131na yetmeyebilir \u2014 login lookup veya GET /me/app-user gerekir."
  };
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
  async listAuthUsers() {
    const payload = await this.request("GET", "/admin/users");
    const users = normalizeRecords(payload);
    if (users.length) return users;
    const p = payload;
    return Array.isArray(p.users) ? p.users : [];
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
    const targets = new Set(targetEmails.map((e) => normalizeEmail(e)).filter(Boolean));
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

// server/tedris-repair/repairAppUserAuthLinks.ts
async function runDiagnoseEmailsOnly(client, diagnoseEmails) {
  const emails = diagnoseEmails.map((e) => normalizeEmail(e)).filter(Boolean);
  const authUsers = await client.listAuthUsers().catch(() => []);
  const authIds = emails.map((email) => {
    const auth = authUsers.find((a) => (typeof a.email === "string" ? normalizeEmail(a.email) : "") === email);
    return auth?.id != null ? String(auth.id) : null;
  }).filter((id) => Boolean(id));
  const { records, pagesFetched, stoppedEarly } = await client.fetchAppUsersForDiagnose(emails, authIds);
  const emailDiagnosis = emails.map((email) => diagnoseRepairEmail(email, records, authUsers));
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
      targetEmailCount: emails.length
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
  const me = await client.me();
  const user = me.user;
  if (!user?.id) throw new Error("401 Oturum do\u011Frulanamad\u0131.");
  const email = typeof user.email === "string" ? user.email.trim().toLocaleLowerCase("tr-TR") : "";
  const role = String(user.role ?? "").trim().toLowerCase();
  const configuredAdmin = (adminEmail || process.env.ADMIN_EMAIL || "").trim().toLocaleLowerCase("tr-TR");
  const isAdmin = Boolean(user.isAdmin) || role === "admin" || role === "super_admin" || configuredAdmin && email === configuredAdmin;
  if (!isAdmin) throw new Error("403 Bu i\u015Flem i\xE7in admin yetkisi gerekir.");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  assertAdminCaller,
  createVpsClientFromEnv,
  runDiagnoseEmailsOnly
});

import { sql, eq, desc, or } from "drizzle-orm";
import {
  db,
  localUsersTable,
  institutionsTable,
  supportRequestsTable,
  adminSettingsTable,
  activityLogsTable,
  savedProfilesTable,
  type LocalUser,
  type Institution,
  type SupportRequest,
  type AdminSetting,
  type ActivityLog,
  type SavedProfile,
} from "@workspace/db";
import { normalizeRole } from "./roleUtils";
import { isDistrictAllowed, type ReportAccess } from "./reportAccess";

export const RECORD_TYPES = new Set([
  "app_user",
  "institution",
  "support_request",
  "admin_setting",
  "activity_log",
  "user_profile",
  "poster_draft",
  "okul_student",
  "okul_daily_record",
]);

export type CompatRecord = {
  id: string | number;
  record_type: string;
  recordType: string;
  userId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
  data: Record<string, unknown>;
};

type ListOpts = {
  limit: number;
  offset: number;
  viewerId?: string;
  viewerEmail?: string;
  admin: boolean;
  reportAccess?: ReportAccess;
};

function hasReportViewerAccess(opts: ListOpts): boolean {
  return opts.admin || opts.reportAccess?.type === "mintika";
}

function iso(d: Date | null | undefined): string | undefined {
  return d ? d.toISOString() : undefined;
}

function localUserToAppUserRecord(u: LocalUser): CompatRecord {
  const role = normalizeRole(u.role, u.isAdmin);
  const createdAt = u.createdAt.toISOString();
  const updatedAt = (u.updatedAt ?? u.createdAt).toISOString();
  return {
    id: u.id,
    record_type: "app_user",
    recordType: "app_user",
    userId: u.id,
    createdAt,
    updatedAt,
    created_at: createdAt,
    updated_at: updatedAt,
    data: {
      authUserId: u.id,
      email: u.email,
      loginEmail: u.email,
      generatedEmail: u.email,
      name: u.name,
      role,
      isAdmin: role === "admin",
      isActive: u.isActive,
      status: u.isActive ? "active" : "inactive",
      district: u.district ?? null,
      province: u.province ?? null,
      institutionName: u.institutionName ?? null,
      institutionCode: u.institutionCode ?? null,
      institutionId: u.institutionId ?? null,
      lastLoginAt: iso(u.lastLoginAt) ?? null,
      deletedAt: iso(u.deletedAt) ?? null,
      createdAt,
      updatedAt,
      allowedDistricts: [] as string[],
      allowedCities: [] as string[],
      allowedInstitutions: u.institutionCode ? [u.institutionCode] : [],
      reportPermissions:
        u.reportScopeType === "all" || role === "admin"
          ? ["all"]
          : u.reportScopeType === "mintika"
            ? ["overview", "district", "institution", "users", "activity", "excel"]
            : [],
      reportScopeType: u.reportScopeType ?? "own",
      reportScopeMintikas: Array.isArray(u.reportScopeMintikas) ? u.reportScopeMintikas : [],
    },
  };
}

function institutionStatusFromDb(status: string | null | undefined): string {
  const s = String(status ?? "").toLowerCase();
  if (s === "aktif" || s === "active") return "active";
  if (s === "pasif" || s === "inactive" || s === "kapali") return "inactive";
  return status ?? "active";
}

function supportStatusFromDb(status: string | null | undefined): string {
  const s = String(status ?? "").toLowerCase();
  if (s === "yeni") return "open";
  return status ?? "open";
}

function institutionToRecord(row: Institution): CompatRecord {
  const createdAt = row.createdAt.toISOString();
  const updatedAt = row.updatedAt.toISOString();
  const status = institutionStatusFromDb(row.status);
  return {
    id: row.id,
    record_type: "institution",
    recordType: "institution",
    createdAt,
    updatedAt,
    created_at: createdAt,
    updated_at: updatedAt,
    data: {
      institutionName: row.institutionName,
      institutionCode: row.institutionCode,
      districtName: row.districtName,
      province: row.province ?? null,
      expectedUserCount: row.expectedUserCount ?? null,
      status,
      notes: row.notes ?? null,
      createdAt,
      updatedAt,
      deletedAt: status === "inactive" ? updatedAt : null,
    },
  };
}

function supportToRecord(row: SupportRequest): CompatRecord {
  const createdAt = row.createdAt.toISOString();
  return {
    id: row.id,
    record_type: "support_request",
    recordType: "support_request",
    userId: row.userId ?? null,
    createdAt,
    updatedAt: createdAt,
    created_at: createdAt,
    updated_at: createdAt,
    data: {
      userId: row.userId ?? null,
      userEmail: row.userEmail ?? null,
      userName: row.userName ?? null,
      message: row.message,
      imageBase64: row.imageBase64 ?? undefined,
      status: supportStatusFromDb(row.status ?? "yeni"),
      adminNote: row.adminNote ?? null,
      createdAt,
      updatedAt: createdAt,
    },
  };
}

function adminSettingToRecord(row: AdminSetting): CompatRecord {
  const updatedAt = row.updatedAt.toISOString();
  const value =
    row.value && typeof row.value === "object" && !Array.isArray(row.value)
      ? (row.value as Record<string, unknown>)
      : {};
  return {
    id: row.key,
    record_type: "admin_setting",
    recordType: "admin_setting",
    createdAt: updatedAt,
    updatedAt,
    created_at: updatedAt,
    updated_at: updatedAt,
    data: {
      key: row.key,
      ...value,
      updatedAt,
    },
  };
}

function activityToRecord(
  row: ActivityLog & { userEmail?: string | null; userName?: string | null },
): CompatRecord {
  const createdAt = row.createdAt.toISOString();
  return {
    id: row.id,
    record_type: "activity_log",
    recordType: "activity_log",
    userId: row.userId ?? null,
    createdAt,
    updatedAt: createdAt,
    created_at: createdAt,
    updated_at: createdAt,
    data: {
      userId: row.userId ?? null,
      authUserId: row.userId ?? null,
      userEmail: row.userEmail ?? null,
      userName: row.userName ?? null,
      action: row.action,
      institutionId: row.institutionId ?? null,
      institutionCode: row.institutionCode ?? null,
      district: row.district ?? null,
      province: row.province ?? null,
      metadata: row.metadata ?? null,
      createdAt,
    },
  };
}

async function listAppUsers(opts: ListOpts): Promise<{ records: CompatRecord[]; total: number }> {
  try {
    let rows: LocalUser[];
    if (opts.admin) {
      rows = await db.select().from(localUsersTable).orderBy(desc(localUsersTable.createdAt));
    } else if (opts.reportAccess?.type === "mintika") {
      rows = await db
        .select()
        .from(localUsersTable)
        .where(sql`${localUsersTable.deletedAt} IS NULL`)
        .orderBy(desc(localUsersTable.createdAt));
      rows = rows.filter((u) => isDistrictAllowed(opts.reportAccess!, u.district));
    } else if (opts.viewerId || opts.viewerEmail) {
      const email = (opts.viewerEmail ?? "").toLowerCase();
      rows = await db
        .select()
        .from(localUsersTable)
        .where(
          or(
            opts.viewerId ? eq(localUsersTable.id, opts.viewerId) : sql`false`,
            email ? eq(localUsersTable.email, email) : sql`false`,
          ),
        );
    } else {
      return { records: [], total: 0 };
    }
    const total = rows.length;
    const slice = rows.slice(opts.offset, opts.offset + opts.limit).map(localUserToAppUserRecord);
    return { records: slice, total };
  } catch (err) {
    console.warn("[recordsCompat] app_user drizzle failed", err);
    return listAppUsersRaw(opts);
  }
}

async function listAppUsersRaw(opts: ListOpts): Promise<{ records: CompatRecord[]; total: number }> {
  const result = await db.execute(sql`
    SELECT id, email, password_hash, name, role, is_admin, is_active, deleted_at,
           province, district_name AS district, institution_id, institution_code,
           institution_name, last_login_at, created_at, updated_at
    FROM local_users
    ORDER BY created_at DESC
  `);
  let rows = ((result as { rows?: Record<string, unknown>[] }).rows ?? []).map((row) => ({
    id: String(row.id),
    email: String(row.email),
    passwordHash: String(row.password_hash),
    name: String(row.name),
    role: typeof row.role === "string" ? row.role : "hoca",
    isAdmin: row.is_admin === true || row.is_admin === "t",
    isActive: row.is_active !== false && row.is_active !== "f",
    deletedAt: row.deleted_at ? new Date(String(row.deleted_at)) : null,
    province: row.province != null ? String(row.province) : null,
    district: row.district != null ? String(row.district) : null,
    institutionId: row.institution_id != null ? String(row.institution_id) : null,
    institutionCode: row.institution_code != null ? String(row.institution_code) : null,
    institutionName: row.institution_name != null ? String(row.institution_name) : null,
    lastLoginAt: row.last_login_at ? new Date(String(row.last_login_at)) : null,
    createdAt: new Date(String(row.created_at ?? Date.now())),
    updatedAt: row.updated_at ? new Date(String(row.updated_at)) : new Date(String(row.created_at ?? Date.now())),
  })) as LocalUser[];

  if (!opts.admin && (opts.viewerId || opts.viewerEmail)) {
    const email = (opts.viewerEmail ?? "").toLowerCase();
    rows = rows.filter(
      (u) => u.id === opts.viewerId || u.email.toLowerCase() === email,
    );
  } else if (!opts.admin) {
    rows = [];
  }

  const total = rows.length;
  const slice = rows.slice(opts.offset, opts.offset + opts.limit).map(localUserToAppUserRecord);
  return { records: slice, total };
}

async function listInstitutions(opts: ListOpts): Promise<{ records: CompatRecord[]; total: number }> {
  try {
    let rows: Institution[];
    if (opts.admin) {
      rows = await db.select().from(institutionsTable).orderBy(desc(institutionsTable.updatedAt));
    } else if (opts.reportAccess?.type === "mintika") {
      rows = await db.select().from(institutionsTable).orderBy(desc(institutionsTable.updatedAt));
      rows = rows.filter((r) => isDistrictAllowed(opts.reportAccess!, r.districtName));
    } else {
      const viewer = opts.viewerId
        ? await db.select().from(localUsersTable).where(eq(localUsersTable.id, opts.viewerId)).limit(1)
        : [];
      const u = viewer[0];
      if (!u) return { records: [], total: 0 };
      if (u.institutionCode) {
        rows = await db
          .select()
          .from(institutionsTable)
          .where(eq(institutionsTable.institutionCode, u.institutionCode));
      } else if (u.district) {
        rows = await db
          .select()
          .from(institutionsTable)
          .where(eq(institutionsTable.districtName, u.district));
      } else {
        rows = [];
      }
    }
    const total = rows.length;
    const slice = rows.slice(opts.offset, opts.offset + opts.limit).map(institutionToRecord);
    return { records: slice, total };
  } catch (err) {
    console.warn("[recordsCompat] institution list failed", err);
    return { records: [], total: 0 };
  }
}

async function listSupportRequests(opts: ListOpts): Promise<{ records: CompatRecord[]; total: number }> {
  try {
    let rows: SupportRequest[];
    if (opts.admin) {
      rows = await db
        .select()
        .from(supportRequestsTable)
        .orderBy(desc(supportRequestsTable.createdAt));
    } else if (opts.viewerId) {
      rows = await db
        .select()
        .from(supportRequestsTable)
        .where(eq(supportRequestsTable.userId, opts.viewerId))
        .orderBy(desc(supportRequestsTable.createdAt));
    } else {
      return { records: [], total: 0 };
    }
    const total = rows.length;
    const slice = rows.slice(opts.offset, opts.offset + opts.limit).map(supportToRecord);
    return { records: slice, total };
  } catch (err) {
    console.warn("[recordsCompat] support_request list failed", err);
    return { records: [], total: 0 };
  }
}

async function listAdminSettings(opts: ListOpts): Promise<{ records: CompatRecord[]; total: number }> {
  if (!opts.admin) return { records: [], total: 0 };
  try {
    const rows = await db.select().from(adminSettingsTable).orderBy(desc(adminSettingsTable.updatedAt));
    const total = rows.length;
    const slice = rows.slice(opts.offset, opts.offset + opts.limit).map(adminSettingToRecord);
    return { records: slice, total };
  } catch (err) {
    console.warn("[recordsCompat] admin_setting list failed", err);
    return { records: [], total: 0 };
  }
}

async function listActivityLogs(opts: ListOpts): Promise<{ records: CompatRecord[]; total: number }> {
  try {
    if (opts.admin || opts.reportAccess?.type === "mintika") {
      const result = await db.execute(sql`
        SELECT al.*, lu.email AS user_email, lu.name AS user_name
        FROM activity_logs al
        LEFT JOIN local_users lu ON lu.id = al.user_id
        ORDER BY al.created_at DESC
      `);
      let rows = (result as { rows?: Record<string, unknown>[] }).rows ?? [];
      if (opts.reportAccess?.type === "mintika") {
        rows = rows.filter((row) =>
          isDistrictAllowed(opts.reportAccess!, row.district != null ? String(row.district) : null),
        );
      }
      const mapped = rows.map((row) =>
        activityToRecord({
          id: String(row.id),
          userId: row.user_id != null ? String(row.user_id) : null,
          institutionId: row.institution_id != null ? String(row.institution_id) : null,
          institutionCode: row.institution_code != null ? String(row.institution_code) : null,
          province: row.province != null ? String(row.province) : null,
          district: row.district != null ? String(row.district) : null,
          action: String(row.action),
          metadata: row.metadata as Record<string, unknown> | null,
          createdAt: new Date(String(row.created_at)),
          userEmail: row.user_email != null ? String(row.user_email) : null,
          userName: row.user_name != null ? String(row.user_name) : null,
        }),
      );
      const total = mapped.length;
      return { records: mapped.slice(opts.offset, opts.offset + opts.limit), total };
    }

    if (!opts.viewerId) return { records: [], total: 0 };

    const rows = await db
      .select()
      .from(activityLogsTable)
      .where(eq(activityLogsTable.userId, opts.viewerId))
      .orderBy(desc(activityLogsTable.createdAt));

    const viewer = await db
      .select({ email: localUsersTable.email, name: localUsersTable.name })
      .from(localUsersTable)
      .where(eq(localUsersTable.id, opts.viewerId))
      .limit(1);

    const email = viewer[0]?.email ?? null;
    const name = viewer[0]?.name ?? null;
    const mapped = rows.map((row) =>
      activityToRecord({ ...row, userEmail: email, userName: name }),
    );
    const total = mapped.length;
    return { records: mapped.slice(opts.offset, opts.offset + opts.limit), total };
  } catch (err) {
    console.warn("[recordsCompat] activity_log list failed", err);
    return { records: [], total: 0 };
  }
}

function savedProfileToRecord(row: SavedProfile): CompatRecord {
  const createdAt = row.createdAt.toISOString();
  return {
    id: row.id,
    record_type: "user_profile",
    recordType: "user_profile",
    userId: row.userId,
    createdAt,
    updatedAt: createdAt,
    created_at: createdAt,
    updated_at: createdAt,
    data: {
      userId: row.userId,
      isim: row.isim,
      kurumAdi: row.kurumAdi,
      rol: row.rol,
      createdAt,
      updatedAt: createdAt,
    },
  };
}

function compatJsonToRecord(
  recordType: string,
  row: { id: string; user_id: string | null; data: unknown; created_at: Date | string; updated_at: Date | string },
): CompatRecord {
  const createdAt = new Date(row.created_at).toISOString();
  const updatedAt = new Date(row.updated_at).toISOString();
  const data =
    row.data && typeof row.data === "object" && !Array.isArray(row.data)
      ? (row.data as Record<string, unknown>)
      : {};
  return {
    id: row.id,
    record_type: recordType,
    recordType,
    userId: row.user_id,
    createdAt,
    updatedAt,
    created_at: createdAt,
    updated_at: updatedAt,
    data: {
      ...data,
      savedAt: data.savedAt ?? updatedAt,
    },
  };
}

async function listUserProfiles(opts: ListOpts): Promise<{ records: CompatRecord[]; total: number }> {
  try {
    let rows: SavedProfile[];
    if (opts.admin) {
      rows = await db.select().from(savedProfilesTable).orderBy(desc(savedProfilesTable.createdAt));
    } else if (opts.viewerId) {
      rows = await db
        .select()
        .from(savedProfilesTable)
        .where(eq(savedProfilesTable.userId, opts.viewerId))
        .orderBy(desc(savedProfilesTable.createdAt));
    } else {
      return { records: [], total: 0 };
    }
    const total = rows.length;
    return { records: rows.slice(opts.offset, opts.offset + opts.limit).map(savedProfileToRecord), total };
  } catch (err) {
    console.warn("[recordsCompat] user_profile list failed", err);
    return { records: [], total: 0 };
  }
}

async function listCompatJsonRecords(
  recordType: string,
  opts: ListOpts,
): Promise<{ records: CompatRecord[]; total: number }> {
  try {
    const result = opts.admin
      ? await db.execute(sql`
          SELECT id, user_id, data, created_at, updated_at
          FROM compat_records
          WHERE record_type = ${recordType}
          ORDER BY updated_at DESC
        `)
      : opts.viewerId
        ? await db.execute(sql`
            SELECT id, user_id, data, created_at, updated_at
            FROM compat_records
            WHERE record_type = ${recordType}
              AND user_id = ${opts.viewerId}
            ORDER BY updated_at DESC
          `)
        : { rows: [] };

    const rows = ((result as { rows?: Record<string, unknown>[] }).rows ?? []).map((row) => ({
      id: String(row.id),
      user_id: row.user_id != null ? String(row.user_id) : null,
      data: row.data,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
    const mapped = rows.map((row) =>
      compatJsonToRecord(recordType, {
        id: row.id,
        user_id: row.user_id,
        data: row.data,
        created_at: new Date(String(row.created_at)),
        updated_at: new Date(String(row.updated_at)),
      }),
    );
    const total = mapped.length;
    return { records: mapped.slice(opts.offset, opts.offset + opts.limit), total };
  } catch (err) {
    console.warn(`[recordsCompat] ${recordType} list failed`, err);
    return { records: [], total: 0 };
  }
}

async function listPosterDrafts(opts: ListOpts): Promise<{ records: CompatRecord[]; total: number }> {
  return listCompatJsonRecords("poster_draft", opts);
}

async function getCompatJsonRecord(recordType: string, id: string): Promise<CompatRecord | null> {
  const result = await db.execute(sql`
    SELECT id, user_id, data, created_at, updated_at
    FROM compat_records
    WHERE id = ${id} AND record_type = ${recordType}
    LIMIT 1
  `);
  const row = (result as { rows?: Record<string, unknown>[] }).rows?.[0];
  if (!row) return null;
  return compatJsonToRecord(recordType, {
    id: String(row.id),
    user_id: row.user_id != null ? String(row.user_id) : null,
    data: row.data,
    created_at: new Date(String(row.created_at)),
    updated_at: new Date(String(row.updated_at)),
  });
}

export async function listCompatRecords(
  recordType: string,
  opts: ListOpts,
): Promise<{ records: CompatRecord[]; total: number }> {
  switch (recordType) {
    case "app_user":
      return listAppUsers(opts);
    case "institution":
      return listInstitutions(opts);
    case "support_request":
      return listSupportRequests(opts);
    case "admin_setting":
      return listAdminSettings(opts);
    case "activity_log":
      return listActivityLogs(opts);
    case "user_profile":
      return listUserProfiles(opts);
    case "poster_draft":
      return listPosterDrafts(opts);
    case "okul_student":
      return listCompatJsonRecords("okul_student", opts);
    case "okul_daily_record":
      return listCompatJsonRecords("okul_daily_record", opts);
    default:
      return { records: [], total: 0 };
  }
}

export async function getCompatRecord(
  recordType: string,
  id: string,
): Promise<CompatRecord | null> {
  switch (recordType) {
    case "app_user": {
      const [row] = await db.select().from(localUsersTable).where(eq(localUsersTable.id, id)).limit(1);
      return row ? localUserToAppUserRecord(row) : null;
    }
    case "institution": {
      const [row] = await db.select().from(institutionsTable).where(eq(institutionsTable.id, id)).limit(1);
      return row ? institutionToRecord(row) : null;
    }
    case "support_request": {
      const numId = Number(id);
      if (!Number.isFinite(numId)) return null;
      const [row] = await db.select().from(supportRequestsTable).where(eq(supportRequestsTable.id, numId)).limit(1);
      return row ? supportToRecord(row) : null;
    }
    case "admin_setting": {
      const [row] = await db.select().from(adminSettingsTable).where(eq(adminSettingsTable.key, id)).limit(1);
      return row ? adminSettingToRecord(row) : null;
    }
    case "activity_log": {
      const result = await db.execute(sql`
        SELECT al.*, lu.email AS user_email, lu.name AS user_name
        FROM activity_logs al
        LEFT JOIN local_users lu ON lu.id = al.user_id
        WHERE al.id = ${id}
        LIMIT 1
      `);
      const row = (result as { rows?: Record<string, unknown>[] }).rows?.[0];
      if (!row) return null;
      return activityToRecord({
        id: String(row.id),
        userId: row.user_id != null ? String(row.user_id) : null,
        institutionId: row.institution_id != null ? String(row.institution_id) : null,
        institutionCode: row.institution_code != null ? String(row.institution_code) : null,
        province: row.province != null ? String(row.province) : null,
        district: row.district != null ? String(row.district) : null,
        action: String(row.action),
        metadata: row.metadata as Record<string, unknown> | null,
        createdAt: new Date(String(row.created_at)),
        userEmail: row.user_email != null ? String(row.user_email) : null,
        userName: row.user_name != null ? String(row.user_name) : null,
      });
    }
    case "user_profile": {
      const [row] = await db.select().from(savedProfilesTable).where(eq(savedProfilesTable.id, id)).limit(1);
      return row ? savedProfileToRecord(row) : null;
    }
    case "poster_draft":
      return getCompatJsonRecord("poster_draft", id);
    case "okul_student":
      return getCompatJsonRecord("okul_student", id);
    case "okul_daily_record":
      return getCompatJsonRecord("okul_daily_record", id);
    default:
      return null;
  }
}

export async function findCompatRecordById(id: string): Promise<CompatRecord | null> {
  for (const recordType of RECORD_TYPES) {
    const record = await getCompatRecord(recordType, id).catch(() => null);
    if (record) return record;
  }
  return null;
}

export function parseListQuery(query: Record<string, unknown>) {
  const recordType = String(query.record_type ?? query.recordType ?? "").trim();
  const limit = Math.min(Math.max(parseInt(String(query.limit ?? "100"), 10) || 100, 1), 100);
  const page = Math.max(parseInt(String(query.page ?? "1"), 10) || 1, 1);
  const offsetRaw = query.offset ?? query.cursor;
  const offset = Math.max(parseInt(String(offsetRaw ?? (page - 1) * limit), 10) || 0, 0);
  return { recordType, limit, offset };
}

export function recordsListResponse(
  records: CompatRecord[],
  total: number,
  offset: number,
) {
  return {
    records,
    total,
    hasMore: offset + records.length < total,
    meta: {
      total,
      hasMore: offset + records.length < total,
    },
  };
}

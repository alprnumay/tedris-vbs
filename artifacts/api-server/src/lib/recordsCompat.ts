import { sql, eq, desc, or } from "drizzle-orm";
import {
  db,
  localUsersTable,
  institutionsTable,
  supportRequestsTable,
  adminSettingsTable,
  activityLogsTable,
  type LocalUser,
  type Institution,
  type SupportRequest,
  type AdminSetting,
  type ActivityLog,
} from "@workspace/db";
import { normalizeRole } from "./roleUtils";

export const RECORD_TYPES = new Set([
  "app_user",
  "institution",
  "support_request",
  "admin_setting",
  "activity_log",
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
};

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
      reportPermissions: role === "admin" ? ["all"] : [],
    },
  };
}

function institutionToRecord(row: Institution): CompatRecord {
  const createdAt = row.createdAt.toISOString();
  const updatedAt = row.updatedAt.toISOString();
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
      status: row.status,
      notes: row.notes ?? null,
      createdAt,
      updatedAt,
      deletedAt: null,
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
      status: row.status ?? "yeni",
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
    if (opts.admin) {
      const result = await db.execute(sql`
        SELECT al.*, lu.email AS user_email, lu.name AS user_name
        FROM activity_logs al
        LEFT JOIN local_users lu ON lu.id = al.user_id
        ORDER BY al.created_at DESC
      `);
      const rows = (result as { rows?: Record<string, unknown>[] }).rows ?? [];
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

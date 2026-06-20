import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import {
  db,
  localUsersTable,
  institutionsTable,
  supportRequestsTable,
  adminSettingsTable,
  activityLogsTable,
  savedProfilesTable,
} from "@workspace/db";
import { normalizeRole } from "./roleUtils";
import { normalizeDistrictName } from "./trackedDistricts";
import { resolveReportScopeFields } from "./reportAccess";
import {
  type CompatRecord,
  getCompatRecord,
  findCompatRecordById,
  RECORD_TYPES,
} from "./recordsCompat";

export type MutationContext = {
  viewerId?: string;
  admin: boolean;
};

export class RecordsMutationError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
    this.name = "RecordsMutationError";
  }
}

function str(v: unknown): string {
  return v != null ? String(v).trim() : "";
}

function institutionStatusToDb(status: unknown): string {
  const s = str(status).toLowerCase();
  if (!s || s === "active" || s === "aktif") return "aktif";
  if (s === "inactive" || s === "pasif" || s === "deleted") return "pasif";
  return str(status) || "aktif";
}

function supportStatusToDb(status: unknown): string {
  const s = str(status).toLowerCase();
  if (!s || s === "open" || s === "yeni") return "yeni";
  if (s === "closed" || s === "cozuldu" || s === "resolved") return "cozuldu";
  if (s === "inceleniyor" || s === "in_progress") return "inceleniyor";
  return str(status) || "yeni";
}

function assertAdmin(ctx: MutationContext, action: string) {
  if (!ctx.admin) throw new RecordsMutationError(`${action} için yönetici yetkisi gerekir.`, 403);
}

function assertOwnerOrAdmin(ownerId: string | null | undefined, ctx: MutationContext, action: string) {
  if (ctx.admin) return;
  if (!ctx.viewerId || !ownerId || ctx.viewerId !== ownerId) {
    throw new RecordsMutationError(`${action} için yetkiniz yok.`, 403);
  }
}

async function upsertCompatJsonRecord(
  recordType: string,
  data: Record<string, unknown>,
  ctx: MutationContext,
  existingId?: string,
): Promise<CompatRecord> {
  const userId = str(data.userId) || ctx.viewerId || null;
  if (!userId) throw new RecordsMutationError("Kullanıcı bağlamı gerekli.", 401);

  const now = new Date();
  if (existingId) {
    const existing = await getCompatRecord(recordType, existingId);
    if (!existing) throw new RecordsMutationError("Kayıt bulunamadı.", 404);
    assertOwnerOrAdmin(existing.userId != null ? String(existing.userId) : null, ctx, "Güncelleme");
    await db.execute(sql`
      UPDATE compat_records
      SET data = ${JSON.stringify(data)}::jsonb,
          updated_at = ${now}
      WHERE id = ${existingId} AND record_type = ${recordType}
    `);
    const updated = await getCompatRecord(recordType, existingId);
    if (!updated) throw new RecordsMutationError("Kayıt güncellenemedi.", 500);
    return updated;
  }

  const [inserted] = (
    await db.execute(sql`
      INSERT INTO compat_records (record_type, user_id, data, created_at, updated_at)
      VALUES (${recordType}, ${userId}, ${JSON.stringify(data)}::jsonb, ${now}, ${now})
      RETURNING id
    `)
  ).rows as { id: string }[] | undefined;
  const id = inserted?.id;
  if (!id) throw new RecordsMutationError("Kayıt oluşturulamadı.", 500);
  const created = await getCompatRecord(recordType, id);
  if (!created) throw new RecordsMutationError("Kayıt oluşturulamadı.", 500);
  return created;
}

async function upsertOwnedCompatRecord(
  recordType: string,
  data: Record<string, unknown>,
  ctx: MutationContext,
  existingId?: string,
): Promise<CompatRecord> {
  if (!ctx.viewerId && !ctx.admin) {
    throw new RecordsMutationError("Oturum gerekli.", 401);
  }

  const ownerId = ctx.viewerId;
  if (!ownerId) {
    throw new RecordsMutationError("Oturum gerekli.", 401);
  }

  const payload = { ...data };
  delete payload.userId;
  delete payload.ownerUserId;
  payload.ownerUserId = ownerId;

  const now = new Date();
  if (existingId) {
    const existing = await getCompatRecord(recordType, existingId);
    if (!existing) throw new RecordsMutationError("Kayıt bulunamadı.", 404);
    assertOwnerOrAdmin(existing.userId != null ? String(existing.userId) : null, ctx, "Güncelleme");
    await db.execute(sql`
      UPDATE compat_records
      SET data = ${JSON.stringify(payload)}::jsonb,
          updated_at = ${now}
      WHERE id = ${existingId} AND record_type = ${recordType}
    `);
    const updated = await getCompatRecord(recordType, existingId);
    if (!updated) throw new RecordsMutationError("Kayıt güncellenemedi.", 500);
    return updated;
  }

  const [inserted] = (
    await db.execute(sql`
      INSERT INTO compat_records (record_type, user_id, data, created_at, updated_at)
      VALUES (${recordType}, ${ownerId}, ${JSON.stringify(payload)}::jsonb, ${now}, ${now})
      RETURNING id
    `)
  ).rows as { id: string }[] | undefined;
  const id = inserted?.id;
  if (!id) throw new RecordsMutationError("Kayıt oluşturulamadı.", 500);
  const created = await getCompatRecord(recordType, id);
  if (!created) throw new RecordsMutationError("Kayıt oluşturulamadı.", 500);
  return created;
}

async function assertOkulStudentOwnedByViewer(studentId: string, ctx: MutationContext) {
  const student = await getCompatRecord("okul_student", studentId);
  if (!student) throw new RecordsMutationError("Öğrenci bulunamadı.", 404);
  assertOwnerOrAdmin(student.userId != null ? String(student.userId) : null, ctx, "Öğrenci erişimi");
}

function normalizeOkulStudentData(data: Record<string, unknown>): Record<string, unknown> {
  return {
    name: str(data.name),
    grade: str(data.grade),
    institution: str(data.institution),
    group: str(data.group),
    parentPhone: str(data.parentPhone),
    isActive: data.isActive !== false,
  };
}

function normalizeOkulDailyRecordData(data: Record<string, unknown>): Record<string, unknown> {
  return {
    studentId: str(data.studentId),
    date: str(data.date),
    institution: str(data.institution),
    group: str(data.group),
    attendanceStatus: data.attendanceStatus ?? null,
    homeworkStatus: data.homeworkStatus ?? null,
    note: str(data.note),
  };
}

async function upsertOkulStudent(
  data: Record<string, unknown>,
  ctx: MutationContext,
  existingId?: string,
): Promise<CompatRecord> {
  const normalized = normalizeOkulStudentData(data);
  if (!normalized.name) throw new RecordsMutationError("Öğrenci adı zorunludur.", 400);
  return upsertOwnedCompatRecord("okul_student", normalized, ctx, existingId);
}

async function upsertOkulDailyRecord(
  data: Record<string, unknown>,
  ctx: MutationContext,
  existingId?: string,
): Promise<CompatRecord> {
  const normalized = normalizeOkulDailyRecordData(data);
  if (!normalized.studentId) throw new RecordsMutationError("Öğrenci kimliği zorunludur.", 400);
  if (!normalized.date) throw new RecordsMutationError("Tarih zorunludur.", 400);
  await assertOkulStudentOwnedByViewer(String(normalized.studentId), ctx);
  return upsertOwnedCompatRecord("okul_daily_record", normalized, ctx, existingId);
}

async function deleteOkulStudent(id: string, ctx: MutationContext): Promise<void> {
  const existing = await getCompatRecord("okul_student", id);
  if (!existing) throw new RecordsMutationError("Öğrenci bulunamadı.", 404);
  assertOwnerOrAdmin(existing.userId != null ? String(existing.userId) : null, ctx, "Öğrenci silme");

  const ownerId = ctx.viewerId;
  if (ownerId) {
    await db.execute(sql`
      DELETE FROM compat_records
      WHERE record_type = 'okul_daily_record'
        AND user_id = ${ownerId}
        AND data->>'studentId' = ${id}
    `);
  } else if (ctx.admin) {
    await db.execute(sql`
      DELETE FROM compat_records
      WHERE record_type = 'okul_daily_record'
        AND data->>'studentId' = ${id}
    `);
  }

  await db.execute(sql`DELETE FROM compat_records WHERE id = ${id} AND record_type = 'okul_student'`);
}

async function createAppUser(data: Record<string, unknown>, ctx: MutationContext): Promise<CompatRecord> {
  assertAdmin(ctx, "Kullanıcı oluşturma");

  const email = str(data.email || data.loginEmail || data.generatedEmail).toLowerCase();
  const authUserId = str(data.authUserId || data.id);
  if (!email && !authUserId) throw new RecordsMutationError("E-posta zorunludur.");

  let existing = null as { id: string } | null;
  if (authUserId) {
    const [row] = await db.select({ id: localUsersTable.id }).from(localUsersTable).where(eq(localUsersTable.id, authUserId)).limit(1);
    if (row) existing = row;
  }
  if (!existing && email) {
    const [row] = await db.select({ id: localUsersTable.id }).from(localUsersTable).where(eq(localUsersTable.email, email)).limit(1);
    if (row) existing = row;
  }
  if (existing) {
    return updateAppUser(existing.id, data, ctx);
  }

  const password = str(data.password);
  if (password.length < 6) {
    throw new RecordsMutationError("Yeni kullanıcı için en az 6 karakterlik şifre gerekir (önce /auth/register).", 400);
  }

  const role = normalizeRole(data.role, data.isAdmin === true);
  const isActive = data.isActive !== false && str(data.status).toLowerCase() !== "inactive";
  const district = str(data.district) || null;
  const passwordHash = await bcrypt.hash(password, 12);
  let reportScope = { reportScopeType: "own" as const, reportScopeMintikas: [] as string[] };
  try {
    reportScope = resolveReportScopeFields(data);
  } catch (err) {
    throw new RecordsMutationError(err instanceof Error ? err.message : "Rapor yetkisi geçersiz.", 400);
  }
  if (role === "admin") {
    reportScope = { reportScopeType: "all", reportScopeMintikas: [] };
  }

  const [user] = await db
    .insert(localUsersTable)
    .values({
      email: email || `${authUserId}@local.invalid`,
      passwordHash,
      name: str(data.name) || email.split("@")[0] || "Kullanıcı",
      role,
      isAdmin: role === "admin",
      isActive,
      province: str(data.province) || null,
      district,
      institutionName: str(data.institutionName) || null,
      institutionCode: str(data.institutionCode) || null,
      institutionId: str(data.institutionId) || null,
      reportScopeType: reportScope.reportScopeType,
      reportScopeMintikas: reportScope.reportScopeMintikas,
    })
    .returning();

  const record = await getCompatRecord("app_user", user.id);
  if (!record) throw new RecordsMutationError("Kullanıcı oluşturuldu ancak okunamadı.", 500);
  return record;
}

async function updateAppUser(id: string, data: Record<string, unknown>, ctx: MutationContext): Promise<CompatRecord> {
  assertAdmin(ctx, "Kullanıcı güncelleme");

  const [existing] = await db.select().from(localUsersTable).where(eq(localUsersTable.id, id)).limit(1);
  if (!existing) throw new RecordsMutationError("Kullanıcı bulunamadı.", 404);

  const role = data.role != null || data.isAdmin != null
    ? normalizeRole(data.role ?? existing.role, data.isAdmin ?? existing.isAdmin)
    : normalizeRole(existing.role, existing.isAdmin);

  const status = str(data.status).toLowerCase();
  const isActive =
    data.isActive != null
      ? data.isActive !== false
      : status
        ? status !== "inactive" && status !== "deleted"
        : existing.isActive;

  const deletedAt =
    data.deletedAt !== undefined
      ? data.deletedAt
        ? new Date(String(data.deletedAt))
        : null
      : data.isActive === true
        ? null
        : data.isActive === false || status === "inactive" || status === "deleted"
          ? existing.deletedAt ?? new Date()
          : existing.deletedAt;

  const email = str(data.email || data.loginEmail);
  const patch: Record<string, unknown> = {
    name: str(data.name) || existing.name,
    role,
    isAdmin: role === "admin",
    isActive,
    deletedAt,
    province: data.province !== undefined ? str(data.province) || null : existing.province,
    district: data.district !== undefined ? str(data.district) || null : existing.district,
    institutionName: data.institutionName !== undefined ? str(data.institutionName) || null : existing.institutionName,
    institutionCode: data.institutionCode !== undefined ? str(data.institutionCode) || null : existing.institutionCode,
    institutionId: data.institutionId !== undefined ? str(data.institutionId) || null : existing.institutionId,
    updatedAt: new Date(),
  };
  if (email) patch.email = email.toLowerCase();

  if (
    data.reportScopeType != null ||
    data.report_scope_type != null ||
    data.reportScopeMintikas != null ||
    data.report_scope_mintikas != null
  ) {
    try {
      const scope = resolveReportScopeFields({ ...data, role: patch.role ?? role });
      if (role === "admin") {
        patch.reportScopeType = "all";
        patch.reportScopeMintikas = [];
      } else {
        patch.reportScopeType = scope.reportScopeType;
        patch.reportScopeMintikas = scope.reportScopeMintikas;
      }
    } catch (err) {
      throw new RecordsMutationError(err instanceof Error ? err.message : "Rapor yetkisi geçersiz.", 400);
    }
  } else if (role === "admin") {
    patch.reportScopeType = "all";
    patch.reportScopeMintikas = [];
  }

  await db.update(localUsersTable).set(patch).where(eq(localUsersTable.id, id));

  const record = await getCompatRecord("app_user", id);
  if (!record) throw new RecordsMutationError("Kullanıcı güncellenemedi.", 500);
  return record;
}

async function createInstitution(data: Record<string, unknown>, ctx: MutationContext): Promise<CompatRecord> {
  assertAdmin(ctx, "Kurum oluşturma");

  const institutionName = str(data.institutionName);
  const districtRaw = str(data.districtName || data.district);
  const institutionCode = str(data.institutionCode);
  if (!institutionName || !districtRaw) {
    throw new RecordsMutationError("Kurum adı ve mıntıka zorunludur.");
  }
  if (!institutionCode) throw new RecordsMutationError("Kurum kodu zorunludur.");

  const districtName = normalizeDistrictName(districtRaw) ?? districtRaw;
  const now = new Date();

  const [row] = await db
    .insert(institutionsTable)
    .values({
      institutionName,
      institutionCode,
      districtName,
      province: str(data.province) || null,
      expectedUserCount:
        data.expectedUserCount != null && Number.isFinite(Number(data.expectedUserCount))
          ? Number(data.expectedUserCount)
          : null,
      status: institutionStatusToDb(data.status),
      notes: str(data.notes) || null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  const record = await getCompatRecord("institution", row.id);
  if (!record) throw new RecordsMutationError("Kurum oluşturulamadı.", 500);
  return record;
}

async function updateInstitution(id: string, data: Record<string, unknown>, ctx: MutationContext): Promise<CompatRecord> {
  assertAdmin(ctx, "Kurum güncelleme");

  const [existing] = await db.select().from(institutionsTable).where(eq(institutionsTable.id, id)).limit(1);
  if (!existing) throw new RecordsMutationError("Kurum bulunamadı.", 404);

  await db
    .update(institutionsTable)
    .set({
      institutionName: data.institutionName != null ? str(data.institutionName) : existing.institutionName,
      institutionCode: data.institutionCode != null ? str(data.institutionCode) : existing.institutionCode,
      districtName:
        data.districtName != null || data.district != null
          ? normalizeDistrictName(str(data.districtName || data.district)) ?? str(data.districtName || data.district)
          : existing.districtName,
      province: data.province !== undefined ? str(data.province) || null : existing.province,
      expectedUserCount:
        data.expectedUserCount !== undefined
          ? data.expectedUserCount != null && Number.isFinite(Number(data.expectedUserCount))
            ? Number(data.expectedUserCount)
            : null
          : existing.expectedUserCount,
      status: data.status != null ? institutionStatusToDb(data.status) : existing.status,
      notes: data.notes !== undefined ? str(data.notes) || null : existing.notes,
      updatedAt: new Date(),
    })
    .where(eq(institutionsTable.id, id));

  const record = await getCompatRecord("institution", id);
  if (!record) throw new RecordsMutationError("Kurum güncellenemedi.", 500);
  return record;
}

async function createSupportRequest(data: Record<string, unknown>, ctx: MutationContext): Promise<CompatRecord> {
  if (!ctx.viewerId && !ctx.admin) throw new RecordsMutationError("Oturum gerekli.", 401);

  const message = str(data.message);
  if (!message) throw new RecordsMutationError("Mesaj zorunludur.");

  const userId = str(data.userId || data.appUserId) || ctx.viewerId || null;

  const [row] = await db
    .insert(supportRequestsTable)
    .values({
      userId,
      userEmail: str(data.userEmail) || null,
      userName: str(data.userName) || null,
      message,
      imageBase64: str(data.imageBase64) || null,
      status: supportStatusToDb(data.status),
      adminNote: str(data.adminNote) || null,
    })
    .returning();

  const record = await getCompatRecord("support_request", String(row.id));
  if (!record) throw new RecordsMutationError("Destek talebi oluşturulamadı.", 500);
  return record;
}

async function updateSupportRequest(id: string, data: Record<string, unknown>, ctx: MutationContext): Promise<CompatRecord> {
  assertAdmin(ctx, "Destek talebi güncelleme");

  const numId = Number(id);
  if (!Number.isFinite(numId)) throw new RecordsMutationError("Geçersiz destek kaydı.", 400);

  const [existing] = await db.select().from(supportRequestsTable).where(eq(supportRequestsTable.id, numId)).limit(1);
  if (!existing) throw new RecordsMutationError("Destek talebi bulunamadı.", 404);

  await db
    .update(supportRequestsTable)
    .set({
      status: data.status != null ? supportStatusToDb(data.status) : existing.status,
      adminNote: data.adminNote !== undefined ? str(data.adminNote) || null : existing.adminNote,
    })
    .where(eq(supportRequestsTable.id, numId));

  const record = await getCompatRecord("support_request", id);
  if (!record) throw new RecordsMutationError("Destek talebi güncellenemedi.", 500);
  return record;
}

async function upsertAdminSetting(data: Record<string, unknown>, ctx: MutationContext, existingId?: string): Promise<CompatRecord> {
  assertAdmin(ctx, "Ayar kaydetme");

  const key = str(data.key) || str(existingId) || "default";
  const { key: _k, updatedAt: _u, ...valueFields } = data;
  const now = new Date();

  await db.execute(sql`
    INSERT INTO admin_settings (key, value, updated_at)
    VALUES (${key}, ${JSON.stringify(valueFields)}::jsonb, ${now})
    ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at
  `);

  const record = await getCompatRecord("admin_setting", key);
  if (!record) throw new RecordsMutationError("Ayar kaydedilemedi.", 500);
  return record;
}

async function createActivityLog(data: Record<string, unknown>, ctx: MutationContext): Promise<CompatRecord> {
  if (!ctx.viewerId && !ctx.admin) throw new RecordsMutationError("Oturum gerekli.", 401);

  const action = str(data.action);
  if (!action) throw new RecordsMutationError("Aktivite eylemi zorunludur.");

  const id = str(data.id) || undefined;
  const userId = str(data.userId || data.appUserId || data.authUserId) || ctx.viewerId || null;
  const metadata =
    data.metadata && typeof data.metadata === "object" && !Array.isArray(data.metadata)
      ? (data.metadata as Record<string, unknown>)
      : null;

  const values = {
    userId,
    institutionId: str(data.institutionId) || null,
    institutionCode: str(data.institutionCode) || null,
    province: str(data.province) || null,
    district: str(data.district) || null,
    action,
    metadata,
  };

  let rowId: string;
  if (id) {
    await db.insert(activityLogsTable).values({ id, ...values });
    rowId = id;
  } else {
    const [row] = await db.insert(activityLogsTable).values(values).returning({ id: activityLogsTable.id });
    rowId = row.id;
  }

  const record = await getCompatRecord("activity_log", rowId);
  if (!record) throw new RecordsMutationError("Aktivite kaydı oluşturulamadı.", 500);
  return record;
}

async function createUserProfile(data: Record<string, unknown>, ctx: MutationContext): Promise<CompatRecord> {
  const userId = str(data.userId) || ctx.viewerId;
  if (!userId) throw new RecordsMutationError("Oturum gerekli.", 401);
  assertOwnerOrAdmin(userId, ctx, "Profil oluşturma");

  const [row] = await db
    .insert(savedProfilesTable)
    .values({
      userId,
      isim: str(data.isim),
      kurumAdi: str(data.kurumAdi),
      rol: str(data.rol),
    })
    .returning();

  const record = await getCompatRecord("user_profile", row.id);
  if (!record) throw new RecordsMutationError("Profil oluşturulamadı.", 500);
  return record;
}

export async function createCompatRecord(
  recordType: string,
  data: Record<string, unknown>,
  ctx: MutationContext,
): Promise<CompatRecord> {
  if (!RECORD_TYPES.has(recordType)) {
    throw new RecordsMutationError(`Desteklenmeyen kayıt türü: ${recordType}`, 400);
  }

  switch (recordType) {
    case "app_user":
      return createAppUser(data, ctx);
    case "institution":
      return createInstitution(data, ctx);
    case "support_request":
      return createSupportRequest(data, ctx);
    case "admin_setting":
      return upsertAdminSetting(data, ctx);
    case "activity_log":
      return createActivityLog(data, ctx);
    case "user_profile":
      return createUserProfile(data, ctx);
    case "poster_draft":
      return upsertCompatJsonRecord("poster_draft", data, ctx);
    case "okul_student":
      return upsertOkulStudent(data, ctx);
    case "okul_daily_record":
      return upsertOkulDailyRecord(data, ctx);
    default:
      throw new RecordsMutationError(`Desteklenmeyen kayıt türü: ${recordType}`, 400);
  }
}

export async function updateCompatRecord(
  recordType: string,
  id: string,
  data: Record<string, unknown>,
  ctx: MutationContext,
): Promise<CompatRecord> {
  if (!RECORD_TYPES.has(recordType)) {
    throw new RecordsMutationError(`Desteklenmeyen kayıt türü: ${recordType}`, 400);
  }

  switch (recordType) {
    case "app_user":
      return updateAppUser(id, data, ctx);
    case "institution":
      return updateInstitution(id, data, ctx);
    case "support_request":
      return updateSupportRequest(id, data, ctx);
    case "admin_setting":
      return upsertAdminSetting({ ...data, key: str(data.key) || id }, ctx, id);
    case "poster_draft":
      return upsertCompatJsonRecord("poster_draft", data, ctx, id);
    case "okul_student":
      return upsertOkulStudent(data, ctx, id);
    case "okul_daily_record":
      return upsertOkulDailyRecord(data, ctx, id);
    default:
      throw new RecordsMutationError(`${recordType} güncellemesi desteklenmiyor.`, 400);
  }
}

export async function deleteCompatRecord(
  id: string,
  ctx: MutationContext,
  recordTypeHint?: string,
): Promise<{ ok: true; recordType: string }> {
  const record =
    recordTypeHint && RECORD_TYPES.has(recordTypeHint)
      ? await getCompatRecord(recordTypeHint, id)
      : await findCompatRecordById(id);

  if (!record) throw new RecordsMutationError("Kayıt bulunamadı.", 404);

  switch (record.record_type) {
    case "app_user": {
      assertAdmin(ctx, "Kullanıcı silme");
      await db
        .update(localUsersTable)
        .set({ isActive: false, deletedAt: new Date(), updatedAt: new Date() })
        .where(eq(localUsersTable.id, id));
      break;
    }
    case "institution": {
      assertAdmin(ctx, "Kurum silme");
      await db
        .update(institutionsTable)
        .set({ status: "pasif", updatedAt: new Date() })
        .where(eq(institutionsTable.id, id));
      break;
    }
    case "support_request": {
      assertAdmin(ctx, "Destek talebi silme");
      const numId = Number(id);
      if (Number.isFinite(numId)) {
        await db.delete(supportRequestsTable).where(eq(supportRequestsTable.id, numId));
      }
      break;
    }
    case "admin_setting": {
      assertAdmin(ctx, "Ayar silme");
      await db.delete(adminSettingsTable).where(eq(adminSettingsTable.key, id));
      break;
    }
    case "user_profile": {
      const [existing] = await db.select().from(savedProfilesTable).where(eq(savedProfilesTable.id, id)).limit(1);
      if (!existing) throw new RecordsMutationError("Profil bulunamadı.", 404);
      assertOwnerOrAdmin(existing.userId, ctx, "Profil silme");
      await db.delete(savedProfilesTable).where(eq(savedProfilesTable.id, id));
      break;
    }
    case "poster_draft": {
      const existing = await getCompatRecord("poster_draft", id);
      if (!existing) throw new RecordsMutationError("Taslak bulunamadı.", 404);
      assertOwnerOrAdmin(existing.userId != null ? String(existing.userId) : null, ctx, "Taslak silme");
      await db.execute(sql`DELETE FROM compat_records WHERE id = ${id} AND record_type = 'poster_draft'`);
      break;
    }
    case "okul_student": {
      await deleteOkulStudent(id, ctx);
      break;
    }
    case "okul_daily_record": {
      const existing = await getCompatRecord("okul_daily_record", id);
      if (!existing) throw new RecordsMutationError("Kayıt bulunamadı.", 404);
      assertOwnerOrAdmin(existing.userId != null ? String(existing.userId) : null, ctx, "Kayıt silme");
      await db.execute(sql`DELETE FROM compat_records WHERE id = ${id} AND record_type = 'okul_daily_record'`);
      break;
    }
    case "activity_log": {
      assertAdmin(ctx, "Aktivite silme");
      await db.delete(activityLogsTable).where(eq(activityLogsTable.id, id));
      break;
    }
    default:
      throw new RecordsMutationError("Silme desteklenmiyor.", 400);
  }

  return { ok: true, recordType: record.record_type };
}

import { sql, eq } from "drizzle-orm";
import { db, localUsersTable, type LocalUser } from "@workspace/db";

type LoginUserRow = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: string | null;
  isAdmin: boolean;
  isActive: boolean;
  deletedAt: Date | null;
  province: string | null;
  district: string | null;
  institutionId: string | null;
  institutionName: string | null;
  institutionCode: string | null;
};

function mapRawLoginRow(row: Record<string, unknown>): LoginUserRow {
  const role = typeof row.role === "string" ? row.role : "hoca";
  const isAdminFlag = row.is_admin === true || row.is_admin === "t";
  return {
    id: String(row.id),
    email: String(row.email),
    passwordHash: String(row.password_hash),
    name: String(row.name),
    role,
    isAdmin: isAdminFlag,
    isActive: row.is_active !== false && row.is_active !== "f",
    deletedAt: row.deleted_at ? new Date(String(row.deleted_at)) : null,
    province: row.province != null ? String(row.province) : null,
    district:
      row.district_name != null
        ? String(row.district_name)
        : row.district != null
          ? String(row.district)
          : null,
    institutionId: row.institution_id != null ? String(row.institution_id) : null,
    institutionName: row.institution_name != null ? String(row.institution_name) : null,
    institutionCode: row.institution_code != null ? String(row.institution_code) : null,
  };
}

function mapDrizzleUser(user: LocalUser): LoginUserRow {
  return {
    id: user.id,
    email: user.email,
    passwordHash: user.passwordHash,
    name: user.name,
    role: user.role ?? "hoca",
    isAdmin: user.isAdmin,
    isActive: user.isActive,
    deletedAt: user.deletedAt,
    province: user.province ?? null,
    district: user.district ?? null,
    institutionId: user.institutionId ?? null,
    institutionName: user.institutionName ?? null,
    institutionCode: user.institutionCode ?? null,
  };
}

/** Drizzle veya ham SQL — VPS backend_platform district_name uyumu */
export async function findLocalUserForLogin(email: string): Promise<LoginUserRow | null> {
  const normalizedEmail = email.toLowerCase().trim();
  try {
    const [user] = await db
      .select()
      .from(localUsersTable)
      .where(eq(localUsersTable.email, normalizedEmail));
    return user ? mapDrizzleUser(user) : null;
  } catch (drizzleErr) {
    console.warn("[localUserLookup] drizzle failed, using raw SQL", drizzleErr);
    const result = await db.execute(sql`
      SELECT id, email, password_hash, name, role,
             institution_id, institution_code, institution_name,
             district_name, district, province, is_admin, is_active, deleted_at
      FROM local_users
      WHERE lower(email) = ${normalizedEmail}
      LIMIT 1
    `);
    const row = (result as { rows?: Record<string, unknown>[] }).rows?.[0];
    return row ? mapRawLoginRow(row) : null;
  }
}

export type { LoginUserRow };

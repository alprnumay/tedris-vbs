import { sql, eq } from "drizzle-orm";
import { db, localUsersTable, type LocalUser } from "@workspace/db";
import { isAdminRole } from "./roleUtils";

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").toLowerCase();

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

function resolveLoginUserIsAdmin(
  email: string,
  role: string | null | undefined,
  isAdminFlag?: boolean | null,
): boolean {
  const normalizedEmail = email.toLowerCase();
  return (
    normalizedEmail === ADMIN_EMAIL ||
    Boolean(isAdminFlag) ||
    isAdminRole(role, isAdminFlag ?? false)
  );
}

function mapRawLoginRow(row: Record<string, unknown>): LoginUserRow {
  const role = typeof row.role === "string" ? row.role : "hoca";
  const email = String(row.email);
  const isAdminFlag = row.is_admin === true || row.is_admin === "t";
  return {
    id: String(row.id),
    email,
    passwordHash: String(row.password_hash),
    name: String(row.name),
    role,
    isAdmin: resolveLoginUserIsAdmin(email, role, isAdminFlag),
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
  const role = user.role ?? "hoca";
  return {
    id: user.id,
    email: user.email,
    passwordHash: user.passwordHash,
    name: user.name,
    role,
    isAdmin: resolveLoginUserIsAdmin(user.email, role, user.isAdmin),
    isActive: user.isActive,
    deletedAt: user.deletedAt,
    province: user.province ?? null,
    district: user.district ?? null,
    institutionId: user.institutionId ?? null,
    institutionName: user.institutionName ?? null,
    institutionCode: user.institutionCode ?? null,
  };
}

async function findLocalUserRawByEmail(email: string): Promise<LoginUserRow | null> {
  const normalizedEmail = email.toLowerCase().trim();
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

async function findLocalUserRawById(id: string): Promise<LoginUserRow | null> {
  const result = await db.execute(sql`
    SELECT id, email, password_hash, name, role,
           institution_id, institution_code, institution_name,
           district_name, district, province, is_admin, is_active, deleted_at
    FROM local_users
    WHERE id = ${id}
    LIMIT 1
  `);
  const row = (result as { rows?: Record<string, unknown>[] }).rows?.[0];
  return row ? mapRawLoginRow(row) : null;
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
    console.warn("[localUserLookup] drizzle login failed, using raw SQL", drizzleErr);
    return findLocalUserRawByEmail(normalizedEmail);
  }
}

/** auth/me ve requireAdmin — id ile güncel rol/is_admin okur */
export async function findLocalUserById(id: string): Promise<LoginUserRow | null> {
  try {
    const [user] = await db
      .select()
      .from(localUsersTable)
      .where(eq(localUsersTable.id, id));
    return user ? mapDrizzleUser(user) : null;
  } catch (drizzleErr) {
    console.warn("[localUserLookup] drizzle by-id failed, using raw SQL", drizzleErr);
    return findLocalUserRawById(id);
  }
}

export function isLoginUserAdmin(user: Pick<LoginUserRow, "email" | "role" | "isAdmin">): boolean {
  return resolveLoginUserIsAdmin(user.email, user.role, user.isAdmin);
}

export type { LoginUserRow };

import { db, activityLogsTable, localUsersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  resolveInstitution,
  linkUserToInstitution,
  type ResolvedInstitution,
} from "./institutionRegistry";

export type ActivityUser = {
  id: string;
  province: string | null;
  district: string | null;
  institutionName: string | null;
  institutionCode: string | null;
  institutionId?: string | null;
};

async function ensureInstitutionOnUser(userId: string): Promise<ResolvedInstitution | null> {
  const [u] = await db.select().from(localUsersTable).where(eq(localUsersTable.id, userId)).limit(1);
  if (!u) return null;

  if (u.institutionId && u.institutionCode) {
    return {
      id: u.institutionId,
      institutionCode: u.institutionCode,
      institutionName: u.institutionName ?? "",
      districtName: u.district ?? "",
      province: u.province,
    };
  }

  if (!u.district?.trim() || !u.institutionName?.trim()) return null;

  const inst = await resolveInstitution({
    district: u.district,
    institutionName: u.institutionName,
    institutionCode: u.institutionCode,
    province: u.province,
  });
  if (!inst) return null;
  await linkUserToInstitution(userId, inst);
  return inst;
}

export async function logActivity(
  user: ActivityUser | null,
  action: string,
  metadata?: Record<string, unknown>,
) {
  if (!user?.id) return;
  try {
    const inst = await ensureInstitutionOnUser(user.id);
    const [fresh] = await db
      .select()
      .from(localUsersTable)
      .where(eq(localUsersTable.id, user.id))
      .limit(1);

    await db.insert(activityLogsTable).values({
      userId: user.id,
      institutionId: inst?.id ?? fresh?.institutionId ?? undefined,
      institutionCode: inst?.institutionCode ?? fresh?.institutionCode ?? undefined,
      province: inst?.province ?? fresh?.province ?? undefined,
      district: inst?.districtName ?? fresh?.district ?? undefined,
      action,
      metadata: metadata ?? null,
    });
  } catch (err) {
    console.error("[activityLog]", action, err);
  }
}

export async function logActivityByUserId(
  userId: string,
  action: string,
  metadata?: Record<string, unknown>,
) {
  const [user] = await db.select().from(localUsersTable).where(eq(localUsersTable.id, userId)).limit(1);
  if (!user) return;
  await logActivity(user, action, metadata);
}

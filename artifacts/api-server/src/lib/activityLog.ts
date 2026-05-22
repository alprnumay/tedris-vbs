import { db, activityLogsTable } from "@workspace/db";
import type { LocalUser } from "@workspace/db";

export async function logActivity(
  user: Pick<
    LocalUser,
    "id" | "province" | "district" | "institutionCode"
  > | null,
  action: string,
  metadata?: Record<string, unknown>,
) {
  if (!user?.id) return;
  try {
    await db.insert(activityLogsTable).values({
      userId: user.id,
      institutionCode: user.institutionCode ?? undefined,
      province: user.province ?? undefined,
      district: user.district ?? undefined,
      action,
      metadata: metadata ?? null,
    });
  } catch (err) {
    console.error("[activityLog]", action, err);
  }
}

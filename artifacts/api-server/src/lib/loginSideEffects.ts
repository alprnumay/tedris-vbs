import { db, activityLogsTable, localUsersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import type { LoginUserRow } from "./localUserLookup";
import {
  getPasswordHashRounds,
  hashPassword,
  shouldUpgradePasswordHash,
} from "./passwordHash";

/** Login yanıtı gönderildikten sonra çalışır — kurum çözümlemesi login kritik yolunda değil. */
export function schedulePostLoginSideEffects(user: LoginUserRow, password?: string): void {
  setImmediate(() => {
    void runPostLoginSideEffects(user, password).catch((err) => {
      console.error("[auth/login/sideEffects]", err);
    });
  });
}

async function runPostLoginSideEffects(user: LoginUserRow, password?: string): Promise<void> {
  const t0 = performance.now();

  const tasks: Promise<unknown>[] = [
    db.execute(sql`
      UPDATE local_users SET last_login_at = now() WHERE id = ${user.id}
    `),
    db.insert(activityLogsTable).values({
      userId: user.id,
      institutionId: user.institutionId ?? undefined,
      institutionCode: user.institutionCode ?? undefined,
      province: user.province ?? undefined,
      district: user.district ?? undefined,
      action: "login",
    }),
  ];

  if (password && shouldUpgradePasswordHash(user.passwordHash)) {
    tasks.push(
      hashPassword(password).then((newHash) =>
        db
          .update(localUsersTable)
          .set({ passwordHash: newHash })
          .where(eq(localUsersTable.id, user.id)),
      ),
    );
  }

  await Promise.all(tasks);

  const sideEffectsMs = Math.round(performance.now() - t0);
  if (sideEffectsMs > 300) {
    console.log(
      `[auth-login-timing] user=${user.email.split("@")[0]} sideEffectsMs=${sideEffectsMs} ` +
        `hashRoundsBefore=${getPasswordHashRounds(user.passwordHash)} upgraded=${Boolean(password && shouldUpgradePasswordHash(user.passwordHash))}`,
    );
  }
}

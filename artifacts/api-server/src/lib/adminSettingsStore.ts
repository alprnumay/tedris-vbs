import { db, adminSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { PeriodSettings } from "./adminDateRange";

export async function loadPeriodSettings(): Promise<PeriodSettings> {
  const rows = await db.select().from(adminSettingsTable);
  const out: PeriodSettings = {};
  for (const row of rows) {
    const v = row.value as Record<string, string>;
    if (row.key === "period") {
      out.periodStart = v.start ?? null;
      out.periodEnd = v.end ?? null;
    }
    if (row.key === "season") {
      out.seasonStart = v.start ?? null;
      out.seasonEnd = v.end ?? null;
    }
  }
  return out;
}

async function upsertSetting(key: string, value: Record<string, string | null | undefined>) {
  const [existing] = await db
    .select()
    .from(adminSettingsTable)
    .where(eq(adminSettingsTable.key, key))
    .limit(1);
  if (existing) {
    await db
      .update(adminSettingsTable)
      .set({ value, updatedAt: new Date() })
      .where(eq(adminSettingsTable.key, key));
  } else {
    await db.insert(adminSettingsTable).values({ key, value, updatedAt: new Date() });
  }
}

export async function savePeriodSettings(data: PeriodSettings) {
  if (data.periodStart != null || data.periodEnd != null) {
    await upsertSetting("period", { start: data.periodStart, end: data.periodEnd });
  }
  if (data.seasonStart != null || data.seasonEnd != null) {
    await upsertSetting("season", { start: data.seasonStart, end: data.seasonEnd });
  }
}

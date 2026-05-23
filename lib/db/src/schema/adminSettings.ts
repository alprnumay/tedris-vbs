import { jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

/** Dönem / sezon tarihleri ve diğer admin ayarları (key-value) */
export const adminSettingsTable = pgTable("admin_settings", {
  key: varchar("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AdminSetting = typeof adminSettingsTable.$inferSelect;

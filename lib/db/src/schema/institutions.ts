import { sql } from "drizzle-orm";
import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

/** Yurt / kurum envanteri — admin kayıt defteri */
export const institutionsTable = pgTable("institutions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  institutionName: varchar("institution_name").notNull(),
  institutionCode: varchar("institution_code").notNull().unique(),
  districtName: varchar("district_name").notNull(),
  province: varchar("province"),
  expectedUserCount: integer("expected_user_count"),
  /** aktif | pasif | kapali | takip_disi */
  status: varchar("status").notNull().default("aktif"),
  notes: varchar("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Institution = typeof institutionsTable.$inferSelect;
export type InsertInstitution = typeof institutionsTable.$inferInsert;

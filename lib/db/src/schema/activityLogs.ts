import { sql } from "drizzle-orm";
import { jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { localUsersTable } from "./localAuth";
import { institutionsTable } from "./institutions";

export const activityLogsTable = pgTable("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => localUsersTable.id, { onDelete: "set null" }),
  institutionId: varchar("institution_id").references(() => institutionsTable.id, {
    onDelete: "set null",
  }),
  institutionCode: varchar("institution_code"),
  province: varchar("province"),
  district: varchar("district"),
  action: varchar("action").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ActivityLog = typeof activityLogsTable.$inferSelect;

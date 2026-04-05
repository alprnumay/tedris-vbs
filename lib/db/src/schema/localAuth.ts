import { sql } from "drizzle-orm";
import { pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const localUsersTable = pgTable("local_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash").notNull(),
  name: varchar("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type LocalUser = typeof localUsersTable.$inferSelect;
export type InsertLocalUser = typeof localUsersTable.$inferInsert;

export const savedProfilesTable = pgTable("saved_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => localUsersTable.id, { onDelete: "cascade" }),
  isim: varchar("isim").notNull().default(""),
  kurumAdi: varchar("kurum_adi").notNull().default(""),
  rol: varchar("rol").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SavedProfile = typeof savedProfilesTable.$inferSelect;
export type InsertSavedProfile = typeof savedProfilesTable.$inferInsert;

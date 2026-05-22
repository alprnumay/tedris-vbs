import { sql } from "drizzle-orm";
import { boolean, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

/** hoca | kurum_mesulu | admin */
export type UserRole = "hoca" | "kurum_mesulu" | "admin";

export const localUsersTable = pgTable("local_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash").notNull(),
  name: varchar("name").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  province: varchar("province"),
  district: varchar("district"),
  institutionName: varchar("institution_name"),
  institutionCode: varchar("institution_code"),
  role: varchar("role").notNull().default("hoca"),
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
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

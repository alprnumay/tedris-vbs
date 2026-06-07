import { sql } from "drizzle-orm";
import { jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { institutionsTable } from "./institutions";

export const showcasePostStatusValues = [
  "pending",
  "published",
  "revision_requested",
  "rejected",
] as const;

export type ShowcasePostStatus = (typeof showcasePostStatusValues)[number];

export const showcasePostsTable = pgTable("showcase_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  institutionId: varchar("institution_id").references(() => institutionsTable.id, {
    onDelete: "set null",
  }),
  institutionName: text("institution_name").notNull(),
  districtName: text("district_name"),
  category: text("category").notNull(),
  title: text("title").notNull(),
  imageUrl: text("image_url"),
  purpose: text("purpose"),
  studentActivity: text("student_activity"),
  targetGain: text("target_gain"),
  teacherMethod: text("teacher_method"),
  howToApply: text("how_to_apply"),
  resultNote: text("result_note"),
  generatedText: text("generated_text"),
  tags: jsonb("tags").$type<string[] | null>(),
  teacherName: text("teacher_name"),
  status: text("status").notNull().default("pending"),
  revisionNote: text("revision_note"),
  createdByUserId: varchar("created_by_user_id"),
  approvedByUserId: varchar("approved_by_user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
});

export type ShowcasePostRow = typeof showcasePostsTable.$inferSelect;
export type InsertShowcasePost = typeof showcasePostsTable.$inferInsert;

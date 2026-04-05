import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";

export const supportRequestsTable = pgTable("support_requests", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  userEmail: text("user_email"),
  userName: text("user_name"),
  message: text("message").notNull(),
  imageBase64: text("image_base64"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SupportRequest = typeof supportRequestsTable.$inferSelect;

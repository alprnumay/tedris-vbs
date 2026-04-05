import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const postersTable = pgTable("posters", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  sablon: text("sablon").notNull(),
  formData: text("form_data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPosterSchema = createInsertSchema(postersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPoster = z.infer<typeof insertPosterSchema>;
export type Poster = typeof postersTable.$inferSelect;

import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const ideas = pgTable("ideas", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  platform: text("platform").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  order: integer("order").notNull(),
});

export const insertIdeaSchema = createInsertSchema(ideas);
export const selectIdeaSchema = createSelectSchema(ideas);
export type InsertIdea = typeof ideas.$inferInsert;
export type SelectIdea = typeof ideas.$inferSelect;

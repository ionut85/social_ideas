import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

export const ideas = pgTable("ideas", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  platform: text("platform").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  order: integer("order").notNull(),
});

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const ideaTags = pgTable("idea_tags", {
  ideaId: integer("idea_id").notNull().references(() => ideas.id, { onDelete: "cascade" }),
  tagId: integer("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
});

export const ideasRelations = relations(ideas, ({ many }) => ({
  ideaTags: many(ideaTags),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  ideaTags: many(ideaTags),
}));

export const ideaTagsRelations = relations(ideaTags, ({ one }) => ({
  idea: one(ideas, {
    fields: [ideaTags.ideaId],
    references: [ideas.id],
  }),
  tag: one(tags, {
    fields: [ideaTags.tagId],
    references: [tags.id],
  }),
}));

export const insertIdeaSchema = createInsertSchema(ideas);
export const selectIdeaSchema = createSelectSchema(ideas);
export const insertTagSchema = createInsertSchema(tags);
export const selectTagSchema = createSelectSchema(tags);
export type InsertIdea = typeof ideas.$inferInsert;
export type SelectIdea = typeof ideas.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;
export type SelectTag = typeof tags.$inferSelect;
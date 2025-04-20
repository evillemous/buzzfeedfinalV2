import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  isAdmin: boolean("is_admin").default(false),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  color: text("color").default("#0066CC"),
  bgColor: text("bg_color").default("#E6F0FF"),
});

export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  featuredImage: text("featured_image"),
  publishDate: timestamp("publish_date").defaultNow(),
  authorId: integer("author_id").references(() => users.id),
  categoryId: integer("category_id").references(() => categories.id),
  isPublished: boolean("is_published").default(true),
  isFeatured: boolean("is_featured").default(false),
  views: integer("views").default(0),
  shares: integer("shares").default(0),
  readTime: integer("read_time").default(5),
});

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
});

export const articlesTags = pgTable("articles_tags", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").references(() => articles.id),
  tagId: integer("tag_id").references(() => tags.id),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertArticleSchema = createInsertSchema(articles).omit({ id: true, views: true, shares: true });
export const insertTagSchema = createInsertSchema(tags).omit({ id: true });
export const insertArticleTagSchema = createInsertSchema(articlesTags).omit({ id: true });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Article = typeof articles.$inferSelect;

export type InsertTag = z.infer<typeof insertTagSchema>;
export type Tag = typeof tags.$inferSelect;

export type InsertArticleTag = z.infer<typeof insertArticleTagSchema>;
export type ArticleTag = typeof articlesTags.$inferSelect;

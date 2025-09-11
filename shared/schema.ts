import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("admin"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  phone: text("phone"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  // Property estimation fields (optional for financing leads)
  propertyType: text("property_type"), // "apartment" | "house" - optional for financing leads
  address: text("address"),
  city: text("city"),
  postalCode: text("postal_code"),
  surface: integer("surface"), // m²
  rooms: integer("rooms"),
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  hasGarden: boolean("has_garden").default(false),
  hasParking: boolean("has_parking").default(false),
  hasBalcony: boolean("has_balcony").default(false),
  constructionYear: integer("construction_year"),
  saleTimeline: text("sale_timeline").default("6m"), // "3m" | "6m" | "immediate"
  wantsExpertContact: boolean("wants_expert_contact").default(false),
  estimatedValue: decimal("estimated_value", { precision: 10, scale: 2 }),
  // Financing specific fields
  financingProjectType: text("financing_project_type"), // For financing leads: "Achat résidence principale", "Investissement locatif", etc.
  projectAmount: text("project_amount"), // Amount as text (e.g., "250 000 €")
  source: text("source").notNull(), // domain name
  leadType: text("lead_type").notNull().default("estimation_quick"), // "estimation_quick" | "estimation_detailed" | "financing" | "guide_download"
  status: text("status").notNull().default("new"), // "new" | "contacted" | "converted" | "archived"
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const estimations = pgTable("estimations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").references(() => leads.id),
  propertyType: text("property_type").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  surface: integer("surface").notNull(),
  rooms: integer("rooms").notNull(),
  estimatedValue: decimal("estimated_value", { precision: 10, scale: 2 }).notNull(),
  pricePerM2: decimal("price_per_m2", { precision: 8, scale: 2 }).notNull(),
  confidence: integer("confidence").notNull(), // 1-100
  methodology: text("methodology"),
  comparableProperties: text("comparable_properties"), // JSON string
  createdAt: timestamp("created_at").defaultNow(),
});

export const contacts = pgTable("contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  phone: text("phone"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  source: text("source").notNull(), // domain name
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const articles = pgTable("articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  metaDescription: text("meta_description"),
  content: text("content").notNull(),
  summary: text("summary"),
  keywords: text("keywords"), // JSON string array
  seoTitle: text("seo_title"),
  authorName: text("author_name").default("Expert Immobilier"),
  status: text("status").notNull().default("published"), // "draft" | "published" | "scheduled" | "archived"
  category: text("category").default("estimation"), // "estimation", "marche", "conseils", etc.
  publishedAt: timestamp("published_at").defaultNow(),
  scheduledFor: timestamp("scheduled_for"), // For scheduled publication
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertLeadSchema = createInsertSchema(leads).omit({ id: true, createdAt: true });
export const insertEstimationSchema = createInsertSchema(estimations).omit({ id: true, createdAt: true });
export const insertContactSchema = createInsertSchema(contacts).omit({ id: true, createdAt: true });
export const insertArticleSchema = createInsertSchema(articles).omit({ id: true, createdAt: true, updatedAt: true });

// Types
export type User = typeof users.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type Estimation = typeof estimations.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
export type Article = typeof articles.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type InsertEstimation = z.infer<typeof insertEstimationSchema>;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type InsertArticle = z.infer<typeof insertArticleSchema>;
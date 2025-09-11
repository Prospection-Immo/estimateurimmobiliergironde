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
  propertyType: text("property_type").notNull(), // "apartment" | "house"
  address: text("address").notNull(),
  city: text("city").notNull(),
  postalCode: text("postal_code").notNull(),
  surface: integer("surface"), // m²
  rooms: integer("rooms"),
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  hasGarden: boolean("has_garden").default(false),
  hasParking: boolean("has_parking").default(false),
  hasBalcony: boolean("has_balcony").default(false),
  constructionYear: integer("construction_year"),
  saleTimeline: text("sale_timeline").notNull().default("6m"), // "3m" | "6m" | "immediate"
  wantsExpertContact: boolean("wants_expert_contact").default(false),
  estimatedValue: decimal("estimated_value", { precision: 10, scale: 2 }),
  source: text("source").notNull(), // domain name
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

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertLeadSchema = createInsertSchema(leads).omit({ id: true, createdAt: true });
export const insertEstimationSchema = createInsertSchema(estimations).omit({ id: true, createdAt: true });
export const insertContactSchema = createInsertSchema(contacts).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type Estimation = typeof estimations.$inferSelect;
export type Contact = typeof contacts.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type InsertEstimation = z.infer<typeof insertEstimationSchema>;
export type InsertContact = z.infer<typeof insertContactSchema>;
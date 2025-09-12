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
  // BANT Qualification fields
  projectType: text("project_type"), // BANT Need: "vente_immediate" | "curiosite" | "succession" | etc.
  timeline: text("timeline"), // BANT Timeline: "1_3_mois" | "3_6_mois" | "non_applicable" | etc.
  ownershipStatus: text("ownership_status"), // BANT Authority: "proprietaire_unique" | "coproprietaire" | etc.
  // Financing specific fields
  financingProjectType: text("financing_project_type"), // For financing leads: "Achat résidence principale", "Investissement locatif", etc.
  projectAmount: text("project_amount"), // Amount as text (e.g., "250 000 €")
  source: text("source").notNull(), // domain name
  leadType: text("lead_type").notNull().default("estimation_quick"), // "estimation_quick" | "estimation_detailed" | "financing" | "guide_download"
  status: text("status").notNull().default("new"), // "new" | "contacted" | "converted" | "archived"
  // RGPD compliance fields
  consentAt: timestamp("consent_at"), // When consent was given
  consentSource: text("consent_source"), // "guide_download", "estimation", "contact", etc.
  ipAddress: text("ip_address"), // IP address when consent was given
  guideSlug: text("guide_slug"), // For guide download leads, which guide was downloaded
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

export const emailTemplates = pgTable("email_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content").notNull(),
  category: text("category").notNull(), // "contact_confirmation", "estimation_confirmation", etc.
  isActive: boolean("is_active").notNull().default(true),
  variables: text("variables"), // JSON array of available variables for this template
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const emailHistory = pgTable("email_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").references(() => emailTemplates.id),
  recipientEmail: text("recipient_email").notNull(),
  recipientName: text("recipient_name"),
  senderEmail: text("sender_email").notNull(),
  subject: text("subject").notNull(),
  htmlContent: text("html_content"),
  textContent: text("text_content"),
  status: text("status").notNull().default("pending"), // "pending" | "sent" | "failed" | "bounced"
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertLeadSchema = createInsertSchema(leads).omit({ id: true, createdAt: true });
export const insertEstimationSchema = createInsertSchema(estimations).omit({ id: true, createdAt: true });
export const insertContactSchema = createInsertSchema(contacts).omit({ id: true, createdAt: true });
export const insertArticleSchema = createInsertSchema(articles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEmailHistorySchema = createInsertSchema(emailHistory).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type Estimation = typeof estimations.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
export type Article = typeof articles.$inferSelect;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type EmailHistory = typeof emailHistory.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type InsertEstimation = z.infer<typeof insertEstimationSchema>;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type InsertEmailHistory = z.infer<typeof insertEmailHistorySchema>;

// Auth session table for 2FA
export const authSessions = pgTable('auth_sessions', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  email: varchar('email').notNull(),
  isEmailVerified: boolean('is_email_verified').default(false),
  phoneNumber: varchar('phone_number'),
  isSmsVerified: boolean('is_sms_verified').default(false),
  verificationSid: varchar('verification_sid'), // Twilio Verify SID
  createdAt: timestamp('created_at').defaultNow(),
  expiresAt: timestamp('expires_at').notNull(),
});

export const insertAuthSessionSchema = createInsertSchema(authSessions).omit({
  id: true,
  createdAt: true,
});

export type InsertAuthSession = z.infer<typeof insertAuthSessionSchema>;
export type AuthSession = typeof authSessions.$inferSelect;

// Guides vendeurs system
export const guides = pgTable('guides', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  persona: text('persona').notNull(), // "presse", "maximisateur", "succession", "nouvelle_vie", "investisseur", "primo"
  shortBenefit: text('short_benefit').notNull(), // Bénéfice en 1 phrase
  readingTime: integer('reading_time').notNull(), // minutes
  content: text('content').notNull(), // Contenu HTML du guide
  summary: text('summary'), // Sommaire
  pdfContent: text('pdf_content'), // Contenu spécifique pour PDF (avec bonus)
  metaDescription: text('meta_description'),
  seoTitle: text('seo_title'),
  isActive: boolean('is_active').default(true),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const guideDownloads = pgTable('guide_downloads', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  guideId: varchar('guide_id').references(() => guides.id).notNull(),
  leadEmail: text('lead_email').notNull(),
  leadFirstName: text('lead_first_name').notNull(),
  leadCity: text('lead_city'),
  downloadType: text('download_type').notNull(), // "pdf", "web", "email"
  downloadedAt: timestamp('downloaded_at').defaultNow(),
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  utmSource: text('utm_source'),
  utmMedium: text('utm_medium'),
  utmCampaign: text('utm_campaign'),
  utmContent: text('utm_content'),
  utmTerm: text('utm_term'),
});

export const guideAnalytics = pgTable('guide_analytics', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  guideId: varchar('guide_id').references(() => guides.id).notNull(),
  sessionId: varchar('session_id').notNull(), // Pour tracking utilisateur anonyme
  leadEmail: text('lead_email'), // Si connecté/identifié
  eventType: text('event_type').notNull(), // "page_view", "scroll_25", "scroll_50", "scroll_75", "scroll_90", "time_30s", "time_120s", "download_pdf", "download_checklist", "cta_click"
  eventValue: text('event_value'), // Valeur additionnelle (ex: pourcentage scroll)
  timestamp: timestamp('timestamp').defaultNow(),
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
});

export const guideEmailSequences = pgTable('guide_email_sequences', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  guideId: varchar('guide_id').references(() => guides.id).notNull(),
  leadEmail: text('lead_email').notNull(),
  persona: text('persona').notNull(),
  sequenceStep: integer('sequence_step').notNull(), // 0, 2, 5, 10 (jours)
  emailType: text('email_type').notNull(), // "guide_delivery", "tip", "case_study", "soft_offer"
  scheduledFor: timestamp('scheduled_for').notNull(),
  sentAt: timestamp('sent_at'),
  openedAt: timestamp('opened_at'),
  clickedAt: timestamp('clicked_at'),
  status: text('status').default('scheduled'), // "scheduled", "sent", "opened", "clicked", "failed"
  createdAt: timestamp('created_at').defaultNow(),
});

// Insert schemas
export const insertGuideSchema = createInsertSchema(guides).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGuideDownloadSchema = createInsertSchema(guideDownloads).omit({ id: true, downloadedAt: true });
export const insertGuideAnalyticsSchema = createInsertSchema(guideAnalytics).omit({ id: true, timestamp: true });
export const insertGuideEmailSequenceSchema = createInsertSchema(guideEmailSequences).omit({ id: true, createdAt: true });

// Types
export type Guide = typeof guides.$inferSelect;
export type GuideDownload = typeof guideDownloads.$inferSelect;
export type GuideAnalytics = typeof guideAnalytics.$inferSelect;
export type GuideEmailSequence = typeof guideEmailSequences.$inferSelect;

export type InsertGuide = z.infer<typeof insertGuideSchema>;
export type InsertGuideDownload = z.infer<typeof insertGuideDownloadSchema>;
export type InsertGuideAnalytics = z.infer<typeof insertGuideAnalyticsSchema>;
export type InsertGuideEmailSequence = z.infer<typeof insertGuideEmailSequenceSchema>;

// Personas enum for frontend
export const GUIDE_PERSONAS = {
  presse: 'Pressé',
  maximisateur: 'Maximisateur',
  succession: 'Succession',
  nouvelle_vie: 'Nouvelle vie',
  investisseur: 'Investisseur',
  primo: 'Primo-vendeur'
} as const;

export type GuidePersona = keyof typeof GUIDE_PERSONAS;

// Analytics response validation schemas
export const dashboardAnalyticsSchema = z.object({
  period: z.string(),
  dateRange: z.object({
    start: z.string(),
    end: z.string()
  }),
  kpis: z.object({
    totalLeads: z.number(),
    qualifiedLeads: z.number(),
    conversionRate: z.number(),
    avgTimeToConversion: z.number(),
    totalGuidesDownloaded: z.number()
  }),
  charts: z.object({
    dailyLeads: z.array(z.object({
      date: z.string(),
      leads: z.number(),
      qualified: z.number(),
      estimation: z.number(),
      financing: z.number(),
      guides: z.number()
    })),
    leadSources: z.array(z.object({
      source: z.string(),
      count: z.number()
    })),
    leadTypes: z.array(z.object({
      type: z.string(),
      count: z.number()
    })),
    topCities: z.array(z.object({
      city: z.string(),
      count: z.number()
    }))
  }),
  trends: z.object({
    leadsGrowth: z.number(),
    conversionGrowth: z.number()
  })
});

export const guideAnalyticsSchema = z.object({
  period: z.string(),
  dateRange: z.object({
    start: z.string(),
    end: z.string()
  }),
  summary: z.object({
    totalGuides: z.number(),
    totalPageViews: z.number(),
    totalDownloads: z.number(),
    avgConversionRate: z.number(),
    avgEngagementScore: z.number()
  }),
  guides: z.array(z.object({
    id: z.string(),
    title: z.string(),
    persona: z.string(),
    slug: z.string(),
    metrics: z.object({
      pageViews: z.number(),
      downloads: z.number(),
      leads: z.number(),
      conversionRate: z.number(),
      avgReadTime: z.number(),
      bounceRate: z.number(),
      completionRate: z.number()
    }),
    performance: z.object({
      downloadRate: z.number(),
      leadQuality: z.number(),
      engagementScore: z.number()
    })
  })),
  personaBreakdown: z.record(z.any())
});

export const leadFunnelAnalyticsSchema = z.object({
  period: z.string(),
  dateRange: z.object({
    start: z.string(),
    end: z.string()
  }),
  funnel: z.array(z.object({
    stage: z.string(),
    count: z.number(),
    percentage: z.number(),
    dropoff: z.number()
  })),
  conversionRates: z.object({
    visitorToSms: z.number(),
    smsToForm: z.number(),
    formToQualified: z.number(),
    qualifiedToConverted: z.number(),
    overallConversion: z.number()
  }),
  topLeads: z.array(z.any()),
  leadScoring: z.object({
    avgScore: z.number(),
    distribution: z.array(z.object({
      min: z.number(),
      max: z.number(),
      label: z.string(),
      count: z.number()
    }))
  })
});

export const emailAnalyticsSchema = z.object({
  period: z.string(),
  dateRange: z.object({
    start: z.string(),
    end: z.string()
  }),
  overview: z.object({
    totalSent: z.number(),
    totalFailed: z.number(),
    totalPending: z.number(),
    successRate: z.number(),
    avgOpenRate: z.number(),
    avgClickRate: z.number(),
    estimatedRevenue: z.number()
  }),
  templatePerformance: z.array(z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    sent: z.number(),
    failed: z.number(),
    openRate: z.number(),
    clickRate: z.number(),
    conversionRate: z.number(),
    revenue: z.number()
  })),
  sequencePerformance: z.array(z.object({
    persona: z.string(),
    totalSent: z.number(),
    scheduled: z.number(),
    completed: z.number(),
    cancelled: z.number()
  })),
  trends: z.object({
    dailyEmails: z.array(z.object({
      date: z.string(),
      sent: z.number(),
      failed: z.number(),
      total: z.number()
    })),
    deliverabilityTrend: z.array(z.object({
      week: z.string(),
      deliverabilityRate: z.number(),
      volume: z.number()
    }))
  })
});

// Analytics response types
export type DashboardAnalytics = z.infer<typeof dashboardAnalyticsSchema>;
export type GuideAnalyticsResponse = z.infer<typeof guideAnalyticsSchema>;
export type LeadFunnelAnalytics = z.infer<typeof leadFunnelAnalyticsSchema>;
export type EmailAnalytics = z.infer<typeof emailAnalyticsSchema>;
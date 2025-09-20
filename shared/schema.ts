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
  imageUrl: text('image_url'), // URL de l'image illustrative du guide
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

// Persona configurations table
export const personaConfigs = pgTable("persona_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  persona: text("persona").notNull().unique(), // "presse", "maximisateur", etc.
  label: text("label").notNull(),
  description: text("description").notNull(),
  psychProfile: text("psych_profile").notNull(),
  painPoints: text("pain_points").array().notNull(), // Array of strings
  motivations: text("motivations").array().notNull(), // Array of strings
  communicationStyle: text("communication_style").notNull(),
  preferredChannels: text("preferred_channels").array().notNull(), // Array of strings
  primaryColor: text("primary_color").notNull(),
  secondaryColor: text("secondary_color").notNull(),
  icon: text("icon").notNull(),
  keywords: text("keywords").array().notNull(), // Array of strings
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPersonaConfigSchema = createInsertSchema(personaConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPersonaConfig = z.infer<typeof insertPersonaConfigSchema>;
export type PersonaConfigData = typeof personaConfigs.$inferSelect;

// Lead Scoring System Tables - BANT Methodology
export const leadScoring = pgTable("lead_scoring", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").references(() => leads.id).notNull().unique(),
  totalScore: integer("total_score").notNull().default(0), // 0-100
  budgetScore: integer("budget_score").notNull().default(0), // 0-25
  authorityScore: integer("authority_score").notNull().default(0), // 0-25
  needScore: integer("need_score").notNull().default(0), // 0-25
  timelineScore: integer("timeline_score").notNull().default(0), // 0-25
  qualificationStatus: text("qualification_status").notNull().default("unqualified"), // "unqualified" | "to_review" | "qualified" | "hot_lead"
  confidenceLevel: integer("confidence_level").notNull().default(50), // 0-100 confidence in score accuracy
  lastCalculatedAt: timestamp("last_calculated_at").defaultNow(),
  manualAdjustment: integer("manual_adjustment").default(0), // Manual points added/removed
  notes: text("notes"), // Qualification notes
  assignedTo: text("assigned_to"), // Commercial assigned
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const scoringConfig = pgTable("scoring_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  criteriaType: text("criteria_type").notNull(), // "budget" | "authority" | "need" | "timeline"
  weight: integer("weight").notNull().default(25), // Percentage weight (0-100)
  isActive: boolean("is_active").notNull().default(true),
  rules: text("rules"), // JSON configuration for scoring rules
  thresholds: text("thresholds"), // JSON for qualification thresholds
  bonusRules: text("bonus_rules"), // JSON for bonus point rules
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const leadScoreHistory = pgTable("lead_score_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").references(() => leads.id).notNull(),
  oldScore: integer("old_score").notNull(),
  newScore: integer("new_score").notNull(),
  scoreChange: integer("score_change").notNull(), // Calculated: newScore - oldScore
  changeReason: text("change_reason").notNull(), // "automatic_calculation" | "manual_adjustment" | "config_update" | "data_update"
  changedBy: text("changed_by"), // User ID or "system"
  details: text("details"), // JSON with specific changes
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for lead scoring
export const insertLeadScoringSchema = createInsertSchema(leadScoring).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  lastCalculatedAt: true 
});

export const insertScoringConfigSchema = createInsertSchema(scoringConfig).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertLeadScoreHistorySchema = createInsertSchema(leadScoreHistory).omit({ 
  id: true, 
  createdAt: true 
});

// Types for lead scoring
export type LeadScoring = typeof leadScoring.$inferSelect;
export type ScoringConfig = typeof scoringConfig.$inferSelect;
export type LeadScoreHistory = typeof leadScoreHistory.$inferSelect;

export type InsertLeadScoring = z.infer<typeof insertLeadScoringSchema>;
export type InsertScoringConfig = z.infer<typeof insertScoringConfigSchema>;
export type InsertLeadScoreHistory = z.infer<typeof insertLeadScoreHistorySchema>;

// BANT Methodology Constants
export const BANT_CRITERIA = {
  budget: 'Budget',
  authority: 'Authority', 
  need: 'Need',
  timeline: 'Timeline'
} as const;

export const QUALIFICATION_STATUS = {
  unqualified: 'Non qualifié',
  to_review: 'À examiner', 
  qualified: 'Qualifié',
  hot_lead: 'Lead chaud'
} as const;

export type BANTCriteria = keyof typeof BANT_CRITERIA;
export type QualificationStatus = keyof typeof QUALIFICATION_STATUS;

// Lead scoring analytics schema
export const leadScoringAnalyticsSchema = z.object({
  period: z.string(),
  dateRange: z.object({
    start: z.string(),
    end: z.string()
  }),
  overview: z.object({
    totalLeads: z.number(),
    averageScore: z.number(),
    qualifiedLeads: z.number(),
    qualificationRate: z.number(),
    hotLeads: z.number(),
    conversionRate: z.number()
  }),
  scoreDistribution: z.array(z.object({
    range: z.string(),
    count: z.number(),
    percentage: z.number(),
    conversionRate: z.number()
  })),
  bantBreakdown: z.object({
    budget: z.object({
      average: z.number(),
      distribution: z.record(z.number())
    }),
    authority: z.object({
      average: z.number(), 
      distribution: z.record(z.number())
    }),
    need: z.object({
      average: z.number(),
      distribution: z.record(z.number()) 
    }),
    timeline: z.object({
      average: z.number(),
      distribution: z.record(z.number())
    })
  }),
  trends: z.object({
    scoreEvolution: z.array(z.object({
      date: z.string(),
      averageScore: z.number(),
      qualificationRate: z.number()
    })),
    conversionByScore: z.array(z.object({
      scoreRange: z.string(),
      leads: z.number(),
      conversions: z.number(),
      rate: z.number()
    }))
  }),
  topPerformingCriteria: z.array(z.object({
    criteria: z.string(),
    impact: z.number(),
    accuracy: z.number()
  })),
  recommendations: z.array(z.object({
    type: z.string(),
    description: z.string(),
    impact: z.string()
  }))
});

export type LeadScoringAnalytics = z.infer<typeof leadScoringAnalyticsSchema>;

// SMS Campaigns System Tables
export const smsCampaigns = pgTable("sms_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  message: text("message").notNull(), // SMS content with variables
  audience: text("audience").notNull(), // "all" | "persona:presse" | "segment:qualified" | "custom"
  audienceFilter: text("audience_filter"), // JSON with detailed filtering criteria
  status: text("status").notNull().default("draft"), // "draft" | "scheduled" | "sending" | "sent" | "paused" | "completed"
  sendType: text("send_type").notNull().default("immediate"), // "immediate" | "scheduled" | "recurring"
  scheduledFor: timestamp("scheduled_for"),
  recurringPattern: text("recurring_pattern"), // JSON for recurring campaigns
  templateId: varchar("template_id").references(() => smsTemplates.id),
  totalContacts: integer("total_contacts").default(0),
  sentCount: integer("sent_count").default(0),
  deliveredCount: integer("delivered_count").default(0),
  failedCount: integer("failed_count").default(0),
  clickedCount: integer("clicked_count").default(0),
  unsubscribedCount: integer("unsubscribed_count").default(0),
  conversionCount: integer("conversion_count").default(0),
  estimatedCost: decimal("estimated_cost", { precision: 8, scale: 4 }).default("0.0000"), // Cost in euros
  actualCost: decimal("actual_cost", { precision: 8, scale: 4 }).default("0.0000"),
  roi: decimal("roi", { precision: 8, scale: 2 }).default("0.00"), // Return on Investment
  abTestEnabled: boolean("ab_test_enabled").default(false),
  abTestVariant: text("ab_test_variant"), // JSON with A/B test configuration
  createdBy: text("created_by").notNull(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const smsTemplates = pgTable("sms_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  content: text("content").notNull(), // SMS template with variables like {prenom}, {ville}
  persona: text("persona"), // Target persona: "presse" | "maximisateur" | "succession" | etc. (optional)
  category: text("category").notNull(), // "welcome" | "follow_up" | "promotion" | "reminder" | "nurturing"
  variables: text("variables").array().notNull().default([]), // Array of variable names used in template
  characterCount: integer("character_count").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  usageCount: integer("usage_count").notNull().default(0),
  lastUsed: timestamp("last_used"),
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }).default("0.00"),
  description: text("description"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const smsContacts = pgTable("sms_contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phoneNumber: text("phone_number").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  email: text("email"), // Optional link to lead
  leadId: varchar("lead_id").references(() => leads.id), // Link to main leads table
  persona: text("persona"), // Inferred persona based on behavior/lead data
  city: text("city"),
  postalCode: text("postal_code"),
  isOptedIn: boolean("is_opted_in").notNull().default(true),
  optInDate: timestamp("opt_in_date").defaultNow(),
  optInSource: text("opt_in_source"), // "estimation_form" | "guide_download" | "manual" | "import"
  optOutDate: timestamp("opt_out_date"),
  optOutReason: text("opt_out_reason"),
  isBlacklisted: boolean("is_blacklisted").default(false),
  blacklistReason: text("blacklist_reason"),
  lastContactDate: timestamp("last_contact_date"),
  totalMessagesSent: integer("total_messages_sent").default(0),
  totalMessagesDelivered: integer("total_messages_delivered").default(0),
  totalMessagesClicked: integer("total_messages_clicked").default(0),
  conversionCount: integer("conversion_count").default(0),
  leadScore: integer("lead_score").default(0),
  tags: text("tags").array().default([]), // Array of tags for segmentation
  notes: text("notes"),
  gdprConsentDate: timestamp("gdpr_consent_date"),
  gdprConsentSource: text("gdpr_consent_source"),
  ipAddress: text("ip_address"), // IP when consent was given
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const smsSentMessages = pgTable("sms_sent_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").references(() => smsCampaigns.id),
  templateId: varchar("template_id").references(() => smsTemplates.id),
  contactId: varchar("contact_id").references(() => smsContacts.id).notNull(),
  phoneNumber: text("phone_number").notNull(),
  messageContent: text("message_content").notNull(), // Final message with variables replaced
  status: text("status").notNull().default("pending"), // "pending" | "sent" | "delivered" | "failed" | "clicked" | "unsubscribed"
  twilioMessageSid: text("twilio_message_sid"), // Twilio message identifier
  twilioStatus: text("twilio_status"), // Twilio's status response
  errorCode: text("error_code"),
  errorMessage: text("error_message"),
  cost: decimal("cost", { precision: 8, scale: 4 }).default("0.0000"), // Cost in euros
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  failedAt: timestamp("failed_at"),
  clickedAt: timestamp("clicked_at"),
  unsubscribedAt: timestamp("unsubscribed_at"),
  clickUrl: text("click_url"), // If message contains a link
  userAgent: text("user_agent"), // For click tracking
  ipAddress: text("ip_address"), // For click tracking
  conversionTracked: boolean("conversion_tracked").default(false),
  conversionValue: decimal("conversion_value", { precision: 10, scale: 2 }),
  webhookData: text("webhook_data"), // Raw webhook data from Twilio
  retryCount: integer("retry_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const smsSequences = pgTable("sms_sequences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  trigger: text("trigger").notNull(), // "new_lead" | "guide_download" | "estimation_completed" | "lead_qualified" | "manual"
  triggerConditions: text("trigger_conditions"), // JSON with specific conditions
  persona: text("persona"), // Target persona for this sequence
  isActive: boolean("is_active").notNull().default(true),
  steps: text("steps"), // JSON array with sequence steps
  totalContacts: integer("total_contacts").default(0),
  activeContacts: integer("active_contacts").default(0),
  completedContacts: integer("completed_contacts").default(0),
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }).default("0.00"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const smsSequenceEnrollments = pgTable("sms_sequence_enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sequenceId: varchar("sequence_id").references(() => smsSequences.id).notNull(),
  contactId: varchar("contact_id").references(() => smsContacts.id).notNull(),
  currentStep: integer("current_step").notNull().default(0),
  status: text("status").notNull().default("active"), // "active" | "paused" | "completed" | "cancelled" | "opted_out"
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  nextScheduledAt: timestamp("next_scheduled_at"),
  completedAt: timestamp("completed_at"),
  pausedAt: timestamp("paused_at"),
  pauseReason: text("pause_reason"),
  messagesCount: integer("messages_count").default(0),
  conversions: integer("conversions").default(0),
  totalCost: decimal("total_cost", { precision: 8, scale: 4 }).default("0.0000"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas for SMS system
export const insertSmsCampaignSchema = createInsertSchema(smsCampaigns).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  startedAt: true,
  completedAt: true
});

export const insertSmsTemplateSchema = createInsertSchema(smsTemplates).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  lastUsed: true
});

export const insertSmsContactSchema = createInsertSchema(smsContacts).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  optInDate: true,
  optOutDate: true
});

export const insertSmsSentMessageSchema = createInsertSchema(smsSentMessages).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  sentAt: true,
  deliveredAt: true,
  failedAt: true,
  clickedAt: true,
  unsubscribedAt: true
});

export const insertSmsSequenceSchema = createInsertSchema(smsSequences).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true
});

export const insertSmsSequenceEnrollmentSchema = createInsertSchema(smsSequenceEnrollments).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  enrolledAt: true,
  completedAt: true,
  pausedAt: true
});

// Types for SMS system
export type SmsCampaign = typeof smsCampaigns.$inferSelect;
export type SmsTemplate = typeof smsTemplates.$inferSelect;
export type SmsContact = typeof smsContacts.$inferSelect;
export type SmsSentMessage = typeof smsSentMessages.$inferSelect;
export type SmsSequence = typeof smsSequences.$inferSelect;
export type SmsSequenceEnrollment = typeof smsSequenceEnrollments.$inferSelect;

export type InsertSmsCampaign = z.infer<typeof insertSmsCampaignSchema>;
export type InsertSmsTemplate = z.infer<typeof insertSmsTemplateSchema>;
export type InsertSmsContact = z.infer<typeof insertSmsContactSchema>;
export type InsertSmsSentMessage = z.infer<typeof insertSmsSentMessageSchema>;
export type InsertSmsSequence = z.infer<typeof insertSmsSequenceSchema>;
export type InsertSmsSequenceEnrollment = z.infer<typeof insertSmsSequenceEnrollmentSchema>;

// SMS Constants
export const SMS_CAMPAIGN_STATUS = {
  draft: 'Brouillon',
  scheduled: 'Programmée',
  sending: 'En cours d\'envoi',
  sent: 'Envoyée',
  paused: 'En pause',
  completed: 'Terminée'
} as const;

export const SMS_TEMPLATE_CATEGORIES = {
  welcome: 'Bienvenue',
  follow_up: 'Relance',
  promotion: 'Promotion',
  reminder: 'Rappel',
  nurturing: 'Nurturing'
} as const;

export const SMS_MESSAGE_STATUS = {
  pending: 'En attente',
  sent: 'Envoyé',
  delivered: 'Livré',
  failed: 'Échoué',
  clicked: 'Cliqué',
  unsubscribed: 'Désabonné'
} as const;

export type SmsCampaignStatus = keyof typeof SMS_CAMPAIGN_STATUS;
export type SmsTemplateCategory = keyof typeof SMS_TEMPLATE_CATEGORIES;
export type SmsMessageStatus = keyof typeof SMS_MESSAGE_STATUS;

// SMS Analytics Schema
export const smsAnalyticsSchema = z.object({
  period: z.string(),
  dateRange: z.object({
    start: z.string(),
    end: z.string()
  }),
  overview: z.object({
    totalCampaigns: z.number(),
    activeCampaigns: z.number(),
    totalMessagesSent: z.number(),
    totalMessagesDelivered: z.number(),
    totalMessagesClicked: z.number(),
    totalUnsubscribes: z.number(),
    deliveryRate: z.number(),
    clickRate: z.number(),
    unsubscribeRate: z.number(),
    totalCost: z.number(),
    averageCostPerMessage: z.number(),
    totalConversions: z.number(),
    conversionRate: z.number(),
    roi: z.number()
  }),
  campaignPerformance: z.array(z.object({
    id: z.string(),
    name: z.string(),
    status: z.string(),
    sent: z.number(),
    delivered: z.number(),
    clicked: z.number(),
    conversions: z.number(),
    deliveryRate: z.number(),
    clickRate: z.number(),
    conversionRate: z.number(),
    cost: z.number(),
    roi: z.number(),
    createdAt: z.string()
  })),
  templatePerformance: z.array(z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    usageCount: z.number(),
    conversionRate: z.number(),
    averageClickRate: z.number(),
    lastUsed: z.string().optional()
  })),
  personaAnalytics: z.record(z.object({
    totalContacts: z.number(),
    messagesSent: z.number(),
    deliveryRate: z.number(),
    clickRate: z.number(),
    conversionRate: z.number(),
    averageCost: z.number()
  })),
  dailyTrends: z.array(z.object({
    date: z.string(),
    sent: z.number(),
    delivered: z.number(),
    clicked: z.number(),
    conversions: z.number(),
    cost: z.number()
  })),
  bestPerformingTimes: z.array(z.object({
    hour: z.number(),
    dayOfWeek: z.number(),
    deliveryRate: z.number(),
    clickRate: z.number(),
    volume: z.number()
  }))
});

export type SmsAnalytics = z.infer<typeof smsAnalyticsSchema>;

// Analytics response types
export type DashboardAnalytics = z.infer<typeof dashboardAnalyticsSchema>;
export type GuideAnalyticsResponse = z.infer<typeof guideAnalyticsSchema>;
export type LeadFunnelAnalytics = z.infer<typeof leadFunnelAnalyticsSchema>;
export type EmailAnalytics = z.infer<typeof emailAnalyticsSchema>;

// =============================================================================
// FORMATIONS PREMIUM MODULE - STRIPE PAYMENTS & COURSES
// =============================================================================

// Table des cours/formations
export const courses = pgTable("courses", {
  sku: text("sku").primaryKey(), // ESTIMER97, FACE147, QUALI97, PO147, PACK397
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  priceCents: integer("price_cents").notNull(), // Prix en centimes
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Table des commandes Stripe
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"), // Peut être null pour les achats sans compte
  stripeSessionId: text("stripe_session_id").notNull().unique(),
  stripeCustomerId: text("stripe_customer_id"),
  totalCents: integer("total_cents").notNull(),
  currency: text("currency").notNull().default("eur"),
  status: text("status").notNull().default("paid"), // "paid", "refunded", "disputed"
  customerEmail: text("customer_email").notNull(),
  customerName: text("customer_name"),
  // UTM tracking
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  utmTerm: text("utm_term"),
  utmContent: text("utm_content"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Table des articles de commande
export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id, { onDelete: "cascade" }),
  sku: text("sku").references(() => courses.sku),
  unitPriceCents: integer("unit_price_cents").notNull(),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

// Table des inscriptions/accès aux cours
export const enrollments = pgTable("enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"), // Peut être null, on utilise l'email
  customerEmail: text("customer_email").notNull(),
  sku: text("sku").references(() => courses.sku),
  orderId: varchar("order_id").references(() => orders.id),
  accessExpiresAt: timestamp("access_expires_at"), // null = accès illimité
  progressPercent: integer("progress_percent").notNull().default(0), // 0-100
  lastAccessedAt: timestamp("last_accessed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Table des événements de progression vidéo
export const courseEvents = pgTable("course_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerEmail: text("customer_email").notNull(),
  sku: text("sku").references(() => courses.sku),
  eventType: text("event_type").notNull(), // "video_start", "video_25", "video_50", "video_100", "download_model"
  videoId: text("video_id"), // Identifiant de la vidéo
  progressPercent: integer("progress_percent"), // Pour les événements vidéo
  metadata: text("metadata"), // JSON avec détails supplémentaires
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// =============================================================================
// SCHEMAS ZOD POUR VALIDATION
// =============================================================================

// Schema pour créer un cours
export const insertCourseSchema = createInsertSchema(courses);
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;

// Schema pour créer une commande
export const insertOrderSchema = createInsertSchema(orders);
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

// Schema pour créer un article de commande
export const insertOrderItemSchema = createInsertSchema(orderItems);
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

// Schema pour créer une inscription
export const insertEnrollmentSchema = createInsertSchema(enrollments);
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Enrollment = typeof enrollments.$inferSelect;

// Schema pour créer un événement
export const insertCourseEventSchema = createInsertSchema(courseEvents);
export type InsertCourseEvent = z.infer<typeof insertCourseEventSchema>;
export type CourseEvent = typeof courseEvents.$inferSelect;

// Schema pour checkout Stripe
export const checkoutSchema = z.object({
  sku: z.string().min(1, "SKU requis"),
  successUrl: z.string().url("URL de succès invalide"),
  cancelUrl: z.string().url("URL d'annulation invalide"),
  customerEmail: z.string().email("Email invalide").optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmTerm: z.string().optional(),
  utmContent: z.string().optional(),
});

// Schema pour événement vidéo
export const videoEventSchema = z.object({
  sku: z.string().min(1, "SKU requis"),
  eventType: z.enum(["video_start", "video_25", "video_50", "video_100", "download_model"]),
  videoId: z.string().optional(),
  progressPercent: z.number().min(0).max(100).optional(),
  metadata: z.string().optional(),
});

// Table pour la configuration du chat OpenAI
export const chatConfigurations = pgTable("chat_configurations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().default("Configuration principale"),
  systemPrompt: text("system_prompt").notNull().default("Vous êtes un assistant expert en immobilier spécialisé dans la région de Gironde/Bordeaux. Vous aidez les utilisateurs avec leurs questions sur l'estimation immobilière, le marché local, et les conseils pour vendre ou acheter. Soyez professionnel, précis et utilisez votre expertise du marché français."),
  model: text("model").notNull().default("gpt-4o-mini"),
  maxTokens: integer("max_tokens").default(2048),
  temperature: text("temperature").default("0.7"), // Stocké comme texte car gpt-5 ne supporte pas ce paramètre
  maxHistoryMessages: integer("max_history_messages").notNull().default(6),
  isActive: boolean("is_active").notNull().default(true),
  welcomeMessage: text("welcome_message").notNull().default("Bonjour ! Je suis votre assistant immobilier spécialisé dans la région Gironde/Bordeaux. Comment puis-je vous aider avec votre projet immobilier ?"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schema pour créer/modifier une configuration de chat
export const insertChatConfigurationSchema = createInsertSchema(chatConfigurations).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export type InsertChatConfiguration = z.infer<typeof insertChatConfigurationSchema>;
export type ChatConfiguration = typeof chatConfigurations.$inferSelect;
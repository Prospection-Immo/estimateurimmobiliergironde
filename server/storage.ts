import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { 
  type User, 
  type Lead, 
  type Estimation, 
  type Contact,
  type Article,
  type EmailTemplate,
  type EmailHistory,
  type AuthSession,
  type Guide,
  type GuideDownload,
  type GuideAnalytics,
  type GuideEmailSequence,
  type PersonaConfigData,
  type LeadScoring,
  type ScoringConfig,
  type LeadScoreHistory,
  type SmsCampaign,
  type SmsTemplate,
  type SmsContact,
  type SmsSentMessage,
  type SmsSequence,
  type SmsSequenceEnrollment,
  type InsertUser, 
  type InsertLead, 
  type InsertEstimation, 
  type InsertContact,
  type InsertArticle,
  type InsertEmailTemplate,
  type InsertEmailHistory,
  type InsertAuthSession,
  type InsertGuide,
  type InsertGuideDownload,
  type InsertGuideAnalytics,
  type InsertGuideEmailSequence,
  type InsertPersonaConfig,
  type InsertLeadScoring,
  type InsertScoringConfig,
  type InsertLeadScoreHistory,
  type InsertSmsCampaign,
  type InsertSmsTemplate,
  type InsertSmsContact,
  type InsertSmsSentMessage,
  type InsertSmsSequence,
  type InsertSmsSequenceEnrollment,
  users,
  leads,
  estimations,
  contacts,
  articles,
  emailTemplates,
  emailHistory,
  authSessions,
  guides,
  guideDownloads,
  guideAnalytics,
  guideEmailSequences,
  personaConfigs,
  leadScoring,
  scoringConfig,
  leadScoreHistory,
  smsCampaigns,
  smsTemplates,
  smsContacts,
  smsSentMessages,
  smsSequences,
  smsSequenceEnrollments
} from "@shared/schema";
import { eq, desc, sql, and } from "drizzle-orm";

// Database connection with fallback for development
const connectionString = process.env.DATABASE_URL;

// Check if we're in a development environment with masked DATABASE_URL
const isDevelopmentMode = !connectionString || connectionString.includes('3pVwZ') || process.env.NODE_ENV === 'development';

let client: any;
let db: any;

if (isDevelopmentMode) {
  console.log('🔧 Running in development mode without database connection');
  // Create a mock database client for development
  client = {
    query: () => Promise.resolve({ rows: [] }),
    end: () => Promise.resolve()
  };
  // Create mock db for development
  db = {
    select: () => ({ from: () => ({ execute: () => Promise.resolve([]) }) }),
    insert: () => ({ values: () => ({ returning: () => ({ execute: () => Promise.resolve([{ id: 'dev-1' }]) }) }) }),
    update: () => ({ set: () => ({ where: () => ({ execute: () => Promise.resolve() }) }) }),
    delete: () => ({ where: () => ({ execute: () => Promise.resolve() }) })
  };
} else {
  client = postgres(connectionString!);
  db = drizzle(client);
}

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Leads
  createLead(lead: InsertLead): Promise<Lead>;
  getLeads(limit?: number): Promise<Lead[]>;
  updateLeadStatus(id: string, status: string): Promise<void>;
  
  // Estimations
  createEstimation(estimation: InsertEstimation): Promise<Estimation>;
  getEstimationsByLeadId(leadId: string): Promise<Estimation[]>;
  
  // Contacts
  createContact(contact: InsertContact): Promise<Contact>;
  getContacts(limit?: number): Promise<Contact[]>;
  
  // Articles
  createArticle(article: InsertArticle): Promise<Article>;
  getArticles(limit?: number): Promise<Article[]>;
  getAllArticles(limit?: number, status?: string, category?: string, searchQuery?: string): Promise<Article[]>;
  getArticleBySlug(slug: string): Promise<Article | undefined>;
  getArticlesByCategory(category: string, limit?: number): Promise<Article[]>;
  updateArticle(id: string, updates: Partial<InsertArticle>): Promise<Article>;
  deleteArticle(id: string): Promise<void>;
  
  // Email Templates
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  getEmailTemplates(category?: string): Promise<EmailTemplate[]>;
  getEmailTemplateById(id: string): Promise<EmailTemplate | undefined>;
  getEmailTemplateByCategory(category: string): Promise<EmailTemplate | undefined>;
  updateEmailTemplate(id: string, updates: Partial<InsertEmailTemplate>): Promise<EmailTemplate>;
  deleteEmailTemplate(id: string): Promise<void>;
  
  // Email History
  createEmailHistory(history: InsertEmailHistory): Promise<EmailHistory>;
  getEmailHistory(limit?: number, status?: string): Promise<EmailHistory[]>;
  updateEmailHistoryStatus(id: string, status: string, errorMessage?: string): Promise<void>;
  
  // Auth Sessions (2FA)
  createAuthSession(session: InsertAuthSession): Promise<AuthSession>;
  getAuthSession(id: string): Promise<AuthSession | undefined>;
  updateAuthSession(id: string, updates: Partial<InsertAuthSession>): Promise<void>;
  
  // Guides
  createGuide(guide: InsertGuide): Promise<Guide>;
  getGuides(persona?: string): Promise<Guide[]>;
  getGuideById(id: string): Promise<Guide | undefined>;
  getGuideBySlug(slug: string): Promise<Guide | undefined>;
  updateGuide(id: string, updates: Partial<InsertGuide>): Promise<Guide>;
  deleteGuide(id: string): Promise<void>;
  
  // Guide Downloads & Analytics
  createGuideDownload(download: InsertGuideDownload): Promise<GuideDownload>;
  getGuideDownloads(guideId?: string): Promise<GuideDownload[]>;
  createGuideAnalytics(analytics: InsertGuideAnalytics): Promise<GuideAnalytics>;
  getGuideAnalytics(guideId: string): Promise<GuideAnalytics[]>;
  
  // Guide Email Sequences
  createGuideEmailSequence(sequence: InsertGuideEmailSequence): Promise<GuideEmailSequence>;
  getGuideEmailSequences(leadEmail?: string): Promise<GuideEmailSequence[]>;
  updateGuideEmailSequence(id: string, updates: Partial<InsertGuideEmailSequence>): Promise<void>;
  
  // Persona Configurations
  getPersonaConfigs(): Promise<PersonaConfigData[]>;
  getPersonaConfigByPersona(persona: string): Promise<PersonaConfigData | undefined>;
  createPersonaConfig(config: InsertPersonaConfig): Promise<PersonaConfigData>;
  updatePersonaConfig(persona: string, updates: Partial<InsertPersonaConfig>): Promise<PersonaConfigData>;
  
  // Lead Scoring
  createLeadScoring(scoring: InsertLeadScoring): Promise<LeadScoring>;
  getLeadScoring(leadId: string): Promise<LeadScoring | undefined>;
  getLeadScoringByIds(leadIds: string[]): Promise<LeadScoring[]>;
  updateLeadScoring(leadId: string, updates: Partial<InsertLeadScoring>): Promise<LeadScoring>;
  getAllLeadScoring(limit?: number, qualificationStatus?: string): Promise<LeadScoring[]>;
  
  // Scoring Configuration
  createScoringConfig(config: InsertScoringConfig): Promise<ScoringConfig>;
  getScoringConfigs(): Promise<ScoringConfig[]>;
  getScoringConfigByCriteria(criteriaType: string): Promise<ScoringConfig | undefined>;
  updateScoringConfig(id: string, updates: Partial<InsertScoringConfig>): Promise<ScoringConfig>;
  deleteScoringConfig(id: string): Promise<void>;
  
  // Lead Score History
  createLeadScoreHistory(history: InsertLeadScoreHistory): Promise<LeadScoreHistory>;
  getLeadScoreHistory(leadId: string): Promise<LeadScoreHistory[]>;
  getAllScoreHistory(limit?: number): Promise<LeadScoreHistory[]>;
  
  // Lead Scoring Analytics
  getLeadScoringStats(startDate?: Date, endDate?: Date): Promise<{
    totalLeads: number;
    averageScore: number;
    qualifiedLeads: number;
    qualificationRate: number;
    hotLeads: number;
    conversionRate: number;
  }>;
  getScoreDistribution(): Promise<Array<{
    range: string;
    count: number;
    percentage: number;
  }>>;
  getBantBreakdown(): Promise<{
    budget: { average: number; distribution: Record<string, number> };
    authority: { average: number; distribution: Record<string, number> };
    need: { average: number; distribution: Record<string, number> };
    timeline: { average: number; distribution: Record<string, number> };
  }>;

  // SMS Campaigns
  createSmsCampaign(campaign: InsertSmsCampaign): Promise<SmsCampaign>;
  getSmsCampaigns(status?: string, limit?: number): Promise<SmsCampaign[]>;
  getSmsCampaignById(id: string): Promise<SmsCampaign | undefined>;
  updateSmsCampaign(id: string, updates: Partial<InsertSmsCampaign>): Promise<SmsCampaign>;
  deleteSmsCampaign(id: string): Promise<void>;
  updateSmsCampaignStats(id: string, stats: {
    sentCount?: number;
    deliveredCount?: number;
    failedCount?: number;
    clickedCount?: number;
    unsubscribedCount?: number;
    conversionCount?: number;
    actualCost?: string;
    roi?: string;
  }): Promise<void>;

  // SMS Templates
  createSmsTemplate(template: InsertSmsTemplate): Promise<SmsTemplate>;
  getSmsTemplates(category?: string, persona?: string, isActive?: boolean): Promise<SmsTemplate[]>;
  getSmsTemplateById(id: string): Promise<SmsTemplate | undefined>;
  updateSmsTemplate(id: string, updates: Partial<InsertSmsTemplate>): Promise<SmsTemplate>;
  deleteSmsTemplate(id: string): Promise<void>;
  incrementSmsTemplateUsage(id: string): Promise<void>;

  // SMS Contacts
  createSmsContact(contact: InsertSmsContact): Promise<SmsContact>;
  getSmsContacts(persona?: string, isOptedIn?: boolean, limit?: number): Promise<SmsContact[]>;
  getSmsContactById(id: string): Promise<SmsContact | undefined>;
  getSmsContactByPhone(phoneNumber: string): Promise<SmsContact | undefined>;
  updateSmsContact(id: string, updates: Partial<InsertSmsContact>): Promise<SmsContact>;
  deleteSmsContact(id: string): Promise<void>;
  optOutSmsContact(phoneNumber: string, reason?: string): Promise<void>;
  updateSmsContactStats(id: string, stats: {
    totalMessagesSent?: number;
    totalMessagesDelivered?: number;
    totalMessagesClicked?: number;
    conversionCount?: number;
    lastContactDate?: Date;
  }): Promise<void>;

  // SMS Sent Messages
  createSmsSentMessage(message: InsertSmsSentMessage): Promise<SmsSentMessage>;
  getSmsSentMessages(campaignId?: string, contactId?: string, status?: string, limit?: number): Promise<SmsSentMessage[]>;
  getSmsSentMessageById(id: string): Promise<SmsSentMessage | undefined>;
  updateSmsSentMessage(id: string, updates: Partial<InsertSmsSentMessage>): Promise<SmsSentMessage>;
  updateSmsSentMessageStatus(id: string, status: string, twilioData?: any): Promise<void>;

  // SMS Sequences
  createSmsSequence(sequence: InsertSmsSequence): Promise<SmsSequence>;
  getSmsSequences(isActive?: boolean, trigger?: string): Promise<SmsSequence[]>;
  getSmsSequenceById(id: string): Promise<SmsSequence | undefined>;
  updateSmsSequence(id: string, updates: Partial<InsertSmsSequence>): Promise<SmsSequence>;
  deleteSmsSequence(id: string): Promise<void>;

  // SMS Sequence Enrollments
  createSmsSequenceEnrollment(enrollment: InsertSmsSequenceEnrollment): Promise<SmsSequenceEnrollment>;
  getSmsSequenceEnrollments(sequenceId?: string, contactId?: string, status?: string): Promise<SmsSequenceEnrollment[]>;
  updateSmsSequenceEnrollment(id: string, updates: Partial<InsertSmsSequenceEnrollment>): Promise<SmsSequenceEnrollment>;
  getActiveSequenceEnrollments(): Promise<SmsSequenceEnrollment[]>;

  // SMS Analytics
  getSmsAnalyticsOverview(startDate?: Date, endDate?: Date): Promise<{
    totalCampaigns: number;
    activeCampaigns: number;
    totalMessagesSent: number;
    totalMessagesDelivered: number;
    totalMessagesClicked: number;
    totalUnsubscribes: number;
    deliveryRate: number;
    clickRate: number;
    unsubscribeRate: number;
    totalCost: number;
    averageCostPerMessage: number;
    totalConversions: number;
    conversionRate: number;
    roi: number;
  }>;
  getSmsCampaignPerformance(startDate?: Date, endDate?: Date): Promise<Array<{
    id: string;
    name: string;
    status: string;
    sent: number;
    delivered: number;
    clicked: number;
    conversions: number;
    deliveryRate: number;
    clickRate: number;
    conversionRate: number;
    cost: number;
    roi: number;
    createdAt: string;
  }>>;
  getSmsTemplatePerformance(): Promise<Array<{
    id: string;
    name: string;
    category: string;
    usageCount: number;
    conversionRate: number;
    averageClickRate: number;
    lastUsed?: string;
  }>>;
}

export class SupabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Leads
  async createLead(insertLead: InsertLead): Promise<Lead> {
    if (isDevelopmentMode) {
      // Return mock lead for development
      return {
        id: `dev-lead-${Date.now()}`,
        email: insertLead.email,
        phone: insertLead.phone,
        firstName: insertLead.firstName,
        lastName: insertLead.lastName,
        propertyType: insertLead.propertyType,
        address: insertLead.address,
        city: insertLead.city,
        postalCode: insertLead.postalCode,
        surface: insertLead.surface,
        rooms: insertLead.rooms,
        bedrooms: insertLead.bedrooms,
        bathrooms: insertLead.bathrooms,
        hasGarden: insertLead.hasGarden || false,
        hasParking: insertLead.hasParking || false,
        hasBalcony: insertLead.hasBalcony || false,
        constructionYear: insertLead.constructionYear,
        estimatedValue: insertLead.estimatedValue,
        source: insertLead.source,
        status: insertLead.status || 'new',
        notes: insertLead.notes,
        createdAt: new Date()
      };
    }
    
    const result = await db.insert(leads).values(insertLead).returning();
    return result[0];
  }

  async getLeads(limit = 50): Promise<Lead[]> {
    return await db.select().from(leads).orderBy(desc(leads.createdAt)).limit(limit);
  }

  async updateLeadStatus(id: string, status: string): Promise<void> {
    await db.update(leads).set({ status }).where(eq(leads.id, id));
  }

  // Estimations
  async createEstimation(insertEstimation: InsertEstimation): Promise<Estimation> {
    if (isDevelopmentMode) {
      // Return mock estimation for development
      return {
        id: `dev-estimation-${Date.now()}`,
        leadId: insertEstimation.leadId,
        propertyType: insertEstimation.propertyType,
        address: insertEstimation.address,
        city: insertEstimation.city,
        surface: insertEstimation.surface,
        rooms: insertEstimation.rooms,
        estimatedValue: insertEstimation.estimatedValue,
        pricePerM2: insertEstimation.pricePerM2,
        confidence: insertEstimation.confidence,
        methodology: insertEstimation.methodology,
        comparableProperties: insertEstimation.comparableProperties,
        createdAt: new Date()
      };
    }
    
    const result = await db.insert(estimations).values(insertEstimation).returning();
    return result[0];
  }

  async getEstimationsByLeadId(leadId: string): Promise<Estimation[]> {
    return await db.select().from(estimations).where(eq(estimations.leadId, leadId));
  }

  async getEstimations(): Promise<Estimation[]> {
    return await db.select().from(estimations).orderBy(desc(estimations.createdAt));
  }

  // Contacts
  async createContact(insertContact: InsertContact): Promise<Contact> {
    const result = await db.insert(contacts).values(insertContact).returning();
    return result[0];
  }

  async getContacts(limit = 50): Promise<Contact[]> {
    return await db.select().from(contacts).orderBy(desc(contacts.createdAt)).limit(limit);
  }

  // Articles
  async createArticle(insertArticle: InsertArticle): Promise<Article> {
    const result = await db.insert(articles).values(insertArticle).returning();
    return result[0];
  }

  async getArticles(limit = 50): Promise<Article[]> {
    if (isDevelopmentMode) {
      // Return mock articles for development
      return [
        {
          id: 'dev-article-1',
          title: 'Comment estimer sa maison en Gironde',
          slug: 'comment-estimer-maison-gironde',
          content: 'Article sur l\'estimation immobilière...',
          summary: 'Guide complet pour estimer votre propriété',
          metaDescription: 'Estimez votre maison en Gironde avec notre guide expert',
          keywords: ['estimation', 'gironde', 'immobilier'],
          category: 'estimation',
          status: 'published' as const,
          authorName: 'Expert Immobilier',
          publishedAt: new Date(),
          createdAt: new Date(),
          updatedAt: null
        },
        {
          id: 'dev-article-2', 
          title: 'Marché immobilier Bordeaux 2025',
          slug: 'marche-immobilier-bordeaux-2025',
          content: 'Analyse du marché bordelais...',
          summary: 'Tendances du marché immobilier bordelais',
          metaDescription: 'Analyse complète du marché immobilier à Bordeaux',
          keywords: ['bordeaux', 'marché', 'tendances'],
          category: 'marche',
          status: 'published' as const,
          authorName: 'Analyste Marché',
          publishedAt: new Date(),
          createdAt: new Date(),
          updatedAt: null
        }
      ].slice(0, limit);
    }
    
    return await db.select().from(articles).where(eq(articles.status, 'published')).orderBy(desc(articles.publishedAt)).limit(limit);
  }

  async getAllArticles(limit = 50, status?: string, category?: string, searchQuery?: string): Promise<Article[]> {
    // Apply filters
    const conditions = [];
    if (status && status !== 'all') {
      conditions.push(eq(articles.status, status));
    }
    if (category && category !== 'all') {
      conditions.push(eq(articles.category, category));
    }
    if (searchQuery) {
      const searchTerm = `%${searchQuery.toLowerCase()}%`;
      conditions.push(
        sql`(LOWER(${articles.title}) LIKE ${searchTerm} OR LOWER(${articles.content}) LIKE ${searchTerm} OR LOWER(${articles.summary}) LIKE ${searchTerm})`
      );
    }

    if (conditions.length > 0) {
      return await db.select().from(articles)
        .where(and(...conditions))
        .orderBy(desc(articles.createdAt))
        .limit(limit);
    }

    return await db.select().from(articles)
      .orderBy(desc(articles.createdAt))
      .limit(limit);
  }

  async getArticleBySlug(slug: string): Promise<Article | undefined> {
    const result = await db.select().from(articles).where(eq(articles.slug, slug)).limit(1);
    return result[0];
  }

  async getArticlesByCategory(category: string, limit = 20): Promise<Article[]> {
    return await db.select().from(articles)
      .where(eq(articles.category, category))
      .orderBy(desc(articles.publishedAt))
      .limit(limit);
  }

  async updateArticle(id: string, updates: Partial<InsertArticle>): Promise<Article> {
    const result = await db.update(articles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(articles.id, id))
      .returning();
    return result[0];
  }

  async deleteArticle(id: string): Promise<void> {
    await db.delete(articles).where(eq(articles.id, id));
  }

  // Email Templates
  async createEmailTemplate(insertEmailTemplate: InsertEmailTemplate): Promise<EmailTemplate> {
    const result = await db.insert(emailTemplates).values(insertEmailTemplate).returning();
    return result[0];
  }

  async getEmailTemplates(category?: string): Promise<EmailTemplate[]> {
    if (category) {
      return await db.select().from(emailTemplates)
        .where(eq(emailTemplates.category, category))
        .orderBy(desc(emailTemplates.createdAt));
    }
    
    return await db.select().from(emailTemplates)
      .orderBy(desc(emailTemplates.createdAt));
  }

  async getEmailTemplateById(id: string): Promise<EmailTemplate | undefined> {
    const result = await db.select().from(emailTemplates).where(eq(emailTemplates.id, id)).limit(1);
    return result[0];
  }

  async getEmailTemplateByCategory(category: string): Promise<EmailTemplate | undefined> {
    const result = await db.select().from(emailTemplates)
      .where(and(
        eq(emailTemplates.category, category),
        eq(emailTemplates.isActive, true)
      ))
      .limit(1);
    return result[0];
  }

  async updateEmailTemplate(id: string, updates: Partial<InsertEmailTemplate>): Promise<EmailTemplate> {
    const result = await db.update(emailTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(emailTemplates.id, id))
      .returning();
    return result[0];
  }

  async deleteEmailTemplate(id: string): Promise<void> {
    await db.delete(emailTemplates).where(eq(emailTemplates.id, id));
  }

  // Email History
  async createEmailHistory(insertEmailHistory: InsertEmailHistory): Promise<EmailHistory> {
    const result = await db.insert(emailHistory).values(insertEmailHistory).returning();
    return result[0];
  }

  async getEmailHistory(limit = 50, status?: string): Promise<EmailHistory[]> {
    if (status) {
      return await db.select().from(emailHistory)
        .where(eq(emailHistory.status, status))
        .orderBy(desc(emailHistory.createdAt))
        .limit(limit);
    }
    
    return await db.select().from(emailHistory)
      .orderBy(desc(emailHistory.createdAt))
      .limit(limit);
  }

  async updateEmailHistoryStatus(id: string, status: string, errorMessage?: string): Promise<void> {
    const updates: { status: string; errorMessage?: string; sentAt?: Date } = { status };
    if (errorMessage) {
      updates.errorMessage = errorMessage;
    }
    if (status === 'sent') {
      updates.sentAt = new Date();
    }
    await db.update(emailHistory).set(updates).where(eq(emailHistory.id, id));
  }

  // Auth Sessions (2FA)
  async createAuthSession(session: InsertAuthSession): Promise<AuthSession> {
    const [authSession] = await db
      .insert(authSessions)
      .values(session)
      .returning();
    return authSession;
  }

  async getAuthSession(id: string): Promise<AuthSession | undefined> {
    const [authSession] = await db
      .select()
      .from(authSessions)
      .where(eq(authSessions.id, id))
      .limit(1);
    return authSession;
  }

  async updateAuthSession(id: string, updates: Partial<InsertAuthSession>): Promise<void> {
    await db
      .update(authSessions)
      .set(updates)
      .where(eq(authSessions.id, id));
  }

  // Guides
  async createGuide(guide: InsertGuide): Promise<Guide> {
    const [newGuide] = await db
      .insert(guides)
      .values({ ...guide, updatedAt: new Date() })
      .returning();
    return newGuide;
  }

  async getGuides(persona?: string): Promise<Guide[]> {
    if (isDevelopmentMode) {
      // Return mock guides for development
      return [
        {
          id: 'dev-guide-1',
          title: 'Guide du Vendeur Pressé',
          description: 'Pour vendre rapidement en Gironde',
          persona: 'presse',
          content: 'Contenu du guide...',
          pdfUrl: null,
          downloadCount: 15,
          isActive: true,
          sortOrder: 1,
          createdAt: new Date(),
          updatedAt: null
        }
      ].filter(g => !persona || g.persona === persona);
    }
    
    if (persona) {
      return await db
        .select()
        .from(guides)
        .where(and(eq(guides.isActive, true), eq(guides.persona, persona)))
        .orderBy(guides.sortOrder, guides.createdAt);
    }
    
    return await db
      .select()
      .from(guides)
      .where(eq(guides.isActive, true))
      .orderBy(guides.sortOrder, guides.createdAt);
  }

  async getGuideById(id: string): Promise<Guide | undefined> {
    const [guide] = await db
      .select()
      .from(guides)
      .where(and(eq(guides.id, id), eq(guides.isActive, true)))
      .limit(1);
    return guide;
  }

  async getGuideBySlug(slug: string): Promise<Guide | undefined> {
    const [guide] = await db
      .select()
      .from(guides)
      .where(and(eq(guides.slug, slug), eq(guides.isActive, true)))
      .limit(1);
    return guide;
  }

  async updateGuide(id: string, updates: Partial<InsertGuide>): Promise<Guide> {
    const [updatedGuide] = await db
      .update(guides)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(guides.id, id))
      .returning();
    return updatedGuide;
  }

  async deleteGuide(id: string): Promise<void> {
    await db.delete(guides).where(eq(guides.id, id));
  }

  // Guide Downloads & Analytics
  async createGuideDownload(download: InsertGuideDownload): Promise<GuideDownload> {
    const [newDownload] = await db
      .insert(guideDownloads)
      .values(download)
      .returning();
    return newDownload;
  }

  async getGuideDownloads(guideId?: string): Promise<GuideDownload[]> {
    if (guideId) {
      return await db
        .select()
        .from(guideDownloads)
        .where(eq(guideDownloads.guideId, guideId))
        .orderBy(desc(guideDownloads.downloadedAt));
    }
    
    return await db
      .select()
      .from(guideDownloads)
      .orderBy(desc(guideDownloads.downloadedAt));
  }

  async createGuideAnalytics(analytics: InsertGuideAnalytics): Promise<GuideAnalytics> {
    const [newAnalytics] = await db
      .insert(guideAnalytics)
      .values(analytics)
      .returning();
    return newAnalytics;
  }

  async getGuideAnalytics(guideId: string): Promise<GuideAnalytics[]> {
    return await db
      .select()
      .from(guideAnalytics)
      .where(eq(guideAnalytics.guideId, guideId))
      .orderBy(desc(guideAnalytics.timestamp));
  }

  // Guide Email Sequences
  async createGuideEmailSequence(sequence: InsertGuideEmailSequence): Promise<GuideEmailSequence> {
    const [newSequence] = await db
      .insert(guideEmailSequences)
      .values(sequence)
      .returning();
    return newSequence;
  }

  async getGuideEmailSequences(leadEmail?: string): Promise<GuideEmailSequence[]> {
    if (leadEmail) {
      return await db
        .select()
        .from(guideEmailSequences)
        .where(eq(guideEmailSequences.leadEmail, leadEmail))
        .orderBy(desc(guideEmailSequences.createdAt));
    }
    
    return await db
      .select()
      .from(guideEmailSequences)
      .orderBy(desc(guideEmailSequences.createdAt));
  }

  async updateGuideEmailSequence(id: string, updates: Partial<InsertGuideEmailSequence>): Promise<void> {
    await db
      .update(guideEmailSequences)
      .set(updates)
      .where(eq(guideEmailSequences.id, id));
  }

  // Persona Configurations
  async getPersonaConfigs(): Promise<PersonaConfigData[]> {
    return await db
      .select()
      .from(personaConfigs)
      .orderBy(personaConfigs.createdAt);
  }

  async getPersonaConfigByPersona(persona: string): Promise<PersonaConfigData | undefined> {
    const [config] = await db
      .select()
      .from(personaConfigs)
      .where(eq(personaConfigs.persona, persona))
      .limit(1);
    return config;
  }

  async createPersonaConfig(config: InsertPersonaConfig): Promise<PersonaConfigData> {
    const [newConfig] = await db
      .insert(personaConfigs)
      .values({ ...config, updatedAt: new Date() })
      .returning();
    return newConfig;
  }

  async updatePersonaConfig(persona: string, updates: Partial<InsertPersonaConfig>): Promise<PersonaConfigData> {
    const [updatedConfig] = await db
      .update(personaConfigs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(personaConfigs.persona, persona))
      .returning();
    return updatedConfig;
  }

  // Lead Scoring
  async createLeadScoring(scoring: InsertLeadScoring): Promise<LeadScoring> {
    const [newScoring] = await db
      .insert(leadScoring)
      .values({ ...scoring, updatedAt: new Date() })
      .returning();
    return newScoring;
  }

  async getLeadScoring(leadId: string): Promise<LeadScoring | undefined> {
    const [scoring] = await db
      .select()
      .from(leadScoring)
      .where(eq(leadScoring.leadId, leadId))
      .limit(1);
    return scoring;
  }

  async getLeadScoringByIds(leadIds: string[]): Promise<LeadScoring[]> {
    return await db
      .select()
      .from(leadScoring)
      .where(sql`${leadScoring.leadId} = ANY(${leadIds})`);
  }

  async updateLeadScoring(leadId: string, updates: Partial<InsertLeadScoring>): Promise<LeadScoring> {
    const [updatedScoring] = await db
      .update(leadScoring)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(leadScoring.leadId, leadId))
      .returning();
    return updatedScoring;
  }

  async getAllLeadScoring(limit = 100, qualificationStatus?: string): Promise<LeadScoring[]> {
    let query = db.select().from(leadScoring);
    
    if (qualificationStatus) {
      query = query.where(eq(leadScoring.qualificationStatus, qualificationStatus));
    }
    
    return await query
      .orderBy(desc(leadScoring.totalScore))
      .limit(limit);
  }

  // Scoring Configuration
  async createScoringConfig(config: InsertScoringConfig): Promise<ScoringConfig> {
    const [newConfig] = await db
      .insert(scoringConfig)
      .values({ ...config, updatedAt: new Date() })
      .returning();
    return newConfig;
  }

  async getScoringConfigs(): Promise<ScoringConfig[]> {
    return await db
      .select()
      .from(scoringConfig)
      .where(eq(scoringConfig.isActive, true))
      .orderBy(scoringConfig.criteriaType);
  }

  async getScoringConfigByCriteria(criteriaType: string): Promise<ScoringConfig | undefined> {
    const [config] = await db
      .select()
      .from(scoringConfig)
      .where(and(
        eq(scoringConfig.criteriaType, criteriaType),
        eq(scoringConfig.isActive, true)
      ))
      .limit(1);
    return config;
  }

  async updateScoringConfig(id: string, updates: Partial<InsertScoringConfig>): Promise<ScoringConfig> {
    const [updatedConfig] = await db
      .update(scoringConfig)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(scoringConfig.id, id))
      .returning();
    return updatedConfig;
  }

  async deleteScoringConfig(id: string): Promise<void> {
    await db
      .delete(scoringConfig)
      .where(eq(scoringConfig.id, id));
  }

  // Lead Score History
  async createLeadScoreHistory(history: InsertLeadScoreHistory): Promise<LeadScoreHistory> {
    const [newHistory] = await db
      .insert(leadScoreHistory)
      .values(history)
      .returning();
    return newHistory;
  }

  async getLeadScoreHistory(leadId: string): Promise<LeadScoreHistory[]> {
    return await db
      .select()
      .from(leadScoreHistory)
      .where(eq(leadScoreHistory.leadId, leadId))
      .orderBy(desc(leadScoreHistory.createdAt));
  }

  async getAllScoreHistory(limit = 100): Promise<LeadScoreHistory[]> {
    return await db
      .select()
      .from(leadScoreHistory)
      .orderBy(desc(leadScoreHistory.createdAt))
      .limit(limit);
  }

  // Lead Scoring Analytics
  async getLeadScoringStats(startDate?: Date, endDate?: Date): Promise<{
    totalLeads: number;
    averageScore: number;
    qualifiedLeads: number;
    qualificationRate: number;
    hotLeads: number;
    conversionRate: number;
  }> {
    let query = db.select({
      totalLeads: sql`COUNT(*)`,
      averageScore: sql`AVG(${leadScoring.totalScore})`,
      qualifiedLeads: sql`COUNT(*) FILTER (WHERE ${leadScoring.qualificationStatus} IN ('qualified', 'hot_lead'))`,
      hotLeads: sql`COUNT(*) FILTER (WHERE ${leadScoring.qualificationStatus} = 'hot_lead')`
    }).from(leadScoring);

    if (startDate) {
      query = query.where(sql`${leadScoring.createdAt} >= ${startDate}`);
    }
    if (endDate) {
      query = query.where(sql`${leadScoring.createdAt} <= ${endDate}`);
    }

    const [stats] = await query;
    
    const totalLeads = Number(stats.totalLeads) || 0;
    const qualifiedLeads = Number(stats.qualifiedLeads) || 0;
    const hotLeads = Number(stats.hotLeads) || 0;
    
    return {
      totalLeads,
      averageScore: Number(stats.averageScore) || 0,
      qualifiedLeads,
      qualificationRate: totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0,
      hotLeads,
      conversionRate: totalLeads > 0 ? (hotLeads / totalLeads) * 100 : 0
    };
  }

  async getScoreDistribution(): Promise<Array<{
    range: string;
    count: number;
    percentage: number;
  }>> {
    const distribution = await db.select({
      range: sql`
        CASE 
          WHEN ${leadScoring.totalScore} >= 76 THEN '76-100'
          WHEN ${leadScoring.totalScore} >= 51 THEN '51-75'
          WHEN ${leadScoring.totalScore} >= 26 THEN '26-50'
          ELSE '0-25'
        END
      `,
      count: sql`COUNT(*)`
    })
    .from(leadScoring)
    .groupBy(sql`
      CASE 
        WHEN ${leadScoring.totalScore} >= 76 THEN '76-100'
        WHEN ${leadScoring.totalScore} >= 51 THEN '51-75'
        WHEN ${leadScoring.totalScore} >= 26 THEN '26-50'
        ELSE '0-25'
      END
    `);

    const total = distribution.reduce((sum, item) => sum + Number(item.count), 0);
    
    return distribution.map(item => ({
      range: String(item.range),
      count: Number(item.count),
      percentage: total > 0 ? (Number(item.count) / total) * 100 : 0
    }));
  }

  async getBantBreakdown(): Promise<{
    budget: { average: number; distribution: Record<string, number> };
    authority: { average: number; distribution: Record<string, number> };
    need: { average: number; distribution: Record<string, number> };
    timeline: { average: number; distribution: Record<string, number> };
  }> {
    const [averages] = await db.select({
      budgetAvg: sql`AVG(${leadScoring.budgetScore})`,
      authorityAvg: sql`AVG(${leadScoring.authorityScore})`,
      needAvg: sql`AVG(${leadScoring.needScore})`,
      timelineAvg: sql`AVG(${leadScoring.timelineScore})`
    }).from(leadScoring);

    // Get distributions for each criteria
    const budgetDist = await db.select({
      score: leadScoring.budgetScore,
      count: sql`COUNT(*)`
    })
    .from(leadScoring)
    .groupBy(leadScoring.budgetScore);

    const authorityDist = await db.select({
      score: leadScoring.authorityScore,
      count: sql`COUNT(*)`
    })
    .from(leadScoring)
    .groupBy(leadScoring.authorityScore);

    const needDist = await db.select({
      score: leadScoring.needScore,
      count: sql`COUNT(*)`
    })
    .from(leadScoring)
    .groupBy(leadScoring.needScore);

    const timelineDist = await db.select({
      score: leadScoring.timelineScore,
      count: sql`COUNT(*)`
    })
    .from(leadScoring)
    .groupBy(leadScoring.timelineScore);

    const formatDistribution = (dist: any[]) => {
      const result: Record<string, number> = {};
      dist.forEach(item => {
        result[String(item.score || 0)] = Number(item.count);
      });
      return result;
    };

    return {
      budget: {
        average: Number(averages.budgetAvg) || 0,
        distribution: formatDistribution(budgetDist)
      },
      authority: {
        average: Number(averages.authorityAvg) || 0,
        distribution: formatDistribution(authorityDist)
      },
      need: {
        average: Number(averages.needAvg) || 0,
        distribution: formatDistribution(needDist)
      },
      timeline: {
        average: Number(averages.timelineAvg) || 0,
        distribution: formatDistribution(timelineDist)
      }
    };
  }

  // SMS Campaigns Implementation
  async createSmsCampaign(insertCampaign: InsertSmsCampaign): Promise<SmsCampaign> {
    const result = await db.insert(smsCampaigns).values(insertCampaign).returning();
    return result[0];
  }

  async getSmsCampaigns(status?: string, limit = 50): Promise<SmsCampaign[]> {
    let query = db.select().from(smsCampaigns);
    
    if (status) {
      query = query.where(eq(smsCampaigns.status, status));
    }
    
    return await query.orderBy(desc(smsCampaigns.createdAt)).limit(limit);
  }

  async getSmsCampaignById(id: string): Promise<SmsCampaign | undefined> {
    const result = await db.select().from(smsCampaigns).where(eq(smsCampaigns.id, id)).limit(1);
    return result[0];
  }

  async updateSmsCampaign(id: string, updates: Partial<InsertSmsCampaign>): Promise<SmsCampaign> {
    const result = await db
      .update(smsCampaigns)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(smsCampaigns.id, id))
      .returning();
    return result[0];
  }

  async deleteSmsCampaign(id: string): Promise<void> {
    await db.delete(smsCampaigns).where(eq(smsCampaigns.id, id));
  }

  async updateSmsCampaignStats(id: string, stats: {
    sentCount?: number;
    deliveredCount?: number;
    failedCount?: number;
    clickedCount?: number;
    unsubscribedCount?: number;
    conversionCount?: number;
    actualCost?: string;
    roi?: string;
  }): Promise<void> {
    await db
      .update(smsCampaigns)
      .set({ ...stats, updatedAt: new Date() })
      .where(eq(smsCampaigns.id, id));
  }

  // SMS Templates Implementation
  async createSmsTemplate(insertTemplate: InsertSmsTemplate): Promise<SmsTemplate> {
    const result = await db.insert(smsTemplates).values(insertTemplate).returning();
    return result[0];
  }

  async getSmsTemplates(category?: string, persona?: string, isActive?: boolean): Promise<SmsTemplate[]> {
    let query = db.select().from(smsTemplates);
    const conditions = [];

    if (category) {
      conditions.push(eq(smsTemplates.category, category));
    }
    if (persona) {
      conditions.push(eq(smsTemplates.persona, persona));
    }
    if (isActive !== undefined) {
      conditions.push(eq(smsTemplates.isActive, isActive));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(smsTemplates.updatedAt));
  }

  async getSmsTemplateById(id: string): Promise<SmsTemplate | undefined> {
    const result = await db.select().from(smsTemplates).where(eq(smsTemplates.id, id)).limit(1);
    return result[0];
  }

  async updateSmsTemplate(id: string, updates: Partial<InsertSmsTemplate>): Promise<SmsTemplate> {
    const result = await db
      .update(smsTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(smsTemplates.id, id))
      .returning();
    return result[0];
  }

  async deleteSmsTemplate(id: string): Promise<void> {
    await db.delete(smsTemplates).where(eq(smsTemplates.id, id));
  }

  async incrementSmsTemplateUsage(id: string): Promise<void> {
    await db
      .update(smsTemplates)
      .set({ 
        usageCount: sql`${smsTemplates.usageCount} + 1`,
        lastUsed: new Date(),
        updatedAt: new Date()
      })
      .where(eq(smsTemplates.id, id));
  }

  // SMS Contacts Implementation
  async createSmsContact(insertContact: InsertSmsContact): Promise<SmsContact> {
    const result = await db.insert(smsContacts).values(insertContact).returning();
    return result[0];
  }

  async getSmsContacts(persona?: string, isOptedIn?: boolean, limit = 100): Promise<SmsContact[]> {
    let query = db.select().from(smsContacts);
    const conditions = [];

    if (persona) {
      conditions.push(eq(smsContacts.persona, persona));
    }
    if (isOptedIn !== undefined) {
      conditions.push(eq(smsContacts.isOptedIn, isOptedIn));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(smsContacts.createdAt)).limit(limit);
  }

  async getSmsContactById(id: string): Promise<SmsContact | undefined> {
    const result = await db.select().from(smsContacts).where(eq(smsContacts.id, id)).limit(1);
    return result[0];
  }

  async getSmsContactByPhone(phoneNumber: string): Promise<SmsContact | undefined> {
    const result = await db.select().from(smsContacts).where(eq(smsContacts.phoneNumber, phoneNumber)).limit(1);
    return result[0];
  }

  async updateSmsContact(id: string, updates: Partial<InsertSmsContact>): Promise<SmsContact> {
    const result = await db
      .update(smsContacts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(smsContacts.id, id))
      .returning();
    return result[0];
  }

  async deleteSmsContact(id: string): Promise<void> {
    await db.delete(smsContacts).where(eq(smsContacts.id, id));
  }

  async optOutSmsContact(phoneNumber: string, reason?: string): Promise<void> {
    await db
      .update(smsContacts)
      .set({ 
        isOptedIn: false, 
        optOutDate: new Date(),
        optOutReason: reason,
        updatedAt: new Date()
      })
      .where(eq(smsContacts.phoneNumber, phoneNumber));
  }

  async updateSmsContactStats(id: string, stats: {
    totalMessagesSent?: number;
    totalMessagesDelivered?: number;
    totalMessagesClicked?: number;
    conversionCount?: number;
    lastContactDate?: Date;
  }): Promise<void> {
    await db
      .update(smsContacts)
      .set({ ...stats, updatedAt: new Date() })
      .where(eq(smsContacts.id, id));
  }

  // SMS Sent Messages Implementation
  async createSmsSentMessage(insertMessage: InsertSmsSentMessage): Promise<SmsSentMessage> {
    const result = await db.insert(smsSentMessages).values(insertMessage).returning();
    return result[0];
  }

  async getSmsSentMessages(campaignId?: string, contactId?: string, status?: string, limit = 100): Promise<SmsSentMessage[]> {
    let query = db.select().from(smsSentMessages);
    const conditions = [];

    if (campaignId) {
      conditions.push(eq(smsSentMessages.campaignId, campaignId));
    }
    if (contactId) {
      conditions.push(eq(smsSentMessages.contactId, contactId));
    }
    if (status) {
      conditions.push(eq(smsSentMessages.status, status));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(smsSentMessages.createdAt)).limit(limit);
  }

  async getSmsSentMessageById(id: string): Promise<SmsSentMessage | undefined> {
    const result = await db.select().from(smsSentMessages).where(eq(smsSentMessages.id, id)).limit(1);
    return result[0];
  }

  async updateSmsSentMessage(id: string, updates: Partial<InsertSmsSentMessage>): Promise<SmsSentMessage> {
    const result = await db
      .update(smsSentMessages)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(smsSentMessages.id, id))
      .returning();
    return result[0];
  }

  async updateSmsSentMessageStatus(id: string, status: string, twilioData?: any): Promise<void> {
    const updateData: any = { 
      status, 
      updatedAt: new Date() 
    };

    if (twilioData) {
      updateData.webhookData = JSON.stringify(twilioData);
      
      if (status === 'sent') {
        updateData.sentAt = new Date();
      } else if (status === 'delivered') {
        updateData.deliveredAt = new Date();
      } else if (status === 'failed') {
        updateData.failedAt = new Date();
        updateData.errorMessage = twilioData.errorMessage;
        updateData.errorCode = twilioData.errorCode;
      }
    }

    await db.update(smsSentMessages).set(updateData).where(eq(smsSentMessages.id, id));
  }

  // SMS Sequences Implementation
  async createSmsSequence(insertSequence: InsertSmsSequence): Promise<SmsSequence> {
    const result = await db.insert(smsSequences).values(insertSequence).returning();
    return result[0];
  }

  async getSmsSequences(isActive?: boolean, trigger?: string): Promise<SmsSequence[]> {
    let query = db.select().from(smsSequences);
    const conditions = [];

    if (isActive !== undefined) {
      conditions.push(eq(smsSequences.isActive, isActive));
    }
    if (trigger) {
      conditions.push(eq(smsSequences.trigger, trigger));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(smsSequences.createdAt));
  }

  async getSmsSequenceById(id: string): Promise<SmsSequence | undefined> {
    const result = await db.select().from(smsSequences).where(eq(smsSequences.id, id)).limit(1);
    return result[0];
  }

  async updateSmsSequence(id: string, updates: Partial<InsertSmsSequence>): Promise<SmsSequence> {
    const result = await db
      .update(smsSequences)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(smsSequences.id, id))
      .returning();
    return result[0];
  }

  async deleteSmsSequence(id: string): Promise<void> {
    await db.delete(smsSequences).where(eq(smsSequences.id, id));
  }

  // SMS Sequence Enrollments Implementation
  async createSmsSequenceEnrollment(insertEnrollment: InsertSmsSequenceEnrollment): Promise<SmsSequenceEnrollment> {
    const result = await db.insert(smsSequenceEnrollments).values(insertEnrollment).returning();
    return result[0];
  }

  async getSmsSequenceEnrollments(sequenceId?: string, contactId?: string, status?: string): Promise<SmsSequenceEnrollment[]> {
    let query = db.select().from(smsSequenceEnrollments);
    const conditions = [];

    if (sequenceId) {
      conditions.push(eq(smsSequenceEnrollments.sequenceId, sequenceId));
    }
    if (contactId) {
      conditions.push(eq(smsSequenceEnrollments.contactId, contactId));
    }
    if (status) {
      conditions.push(eq(smsSequenceEnrollments.status, status));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(smsSequenceEnrollments.createdAt));
  }

  async updateSmsSequenceEnrollment(id: string, updates: Partial<InsertSmsSequenceEnrollment>): Promise<SmsSequenceEnrollment> {
    const result = await db
      .update(smsSequenceEnrollments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(smsSequenceEnrollments.id, id))
      .returning();
    return result[0];
  }

  async getActiveSequenceEnrollments(): Promise<SmsSequenceEnrollment[]> {
    return await db
      .select()
      .from(smsSequenceEnrollments)
      .where(and(
        eq(smsSequenceEnrollments.status, 'active'),
        sql`${smsSequenceEnrollments.nextScheduledAt} <= NOW()`
      ))
      .orderBy(smsSequenceEnrollments.nextScheduledAt);
  }

  // SMS Analytics Implementation
  async getSmsAnalyticsOverview(startDate?: Date, endDate?: Date): Promise<{
    totalCampaigns: number;
    activeCampaigns: number;
    totalMessagesSent: number;
    totalMessagesDelivered: number;
    totalMessagesClicked: number;
    totalUnsubscribes: number;
    deliveryRate: number;
    clickRate: number;
    unsubscribeRate: number;
    totalCost: number;
    averageCostPerMessage: number;
    totalConversions: number;
    conversionRate: number;
    roi: number;
  }> {
    let campaignsQuery = db.select({
      totalCampaigns: sql`COUNT(*)`,
      activeCampaigns: sql`COUNT(*) FILTER (WHERE ${smsCampaigns.status} IN ('sending', 'scheduled'))`
    }).from(smsCampaigns);

    let messagesQuery = db.select({
      totalMessagesSent: sql`COUNT(*)`,
      totalMessagesDelivered: sql`COUNT(*) FILTER (WHERE ${smsSentMessages.status} = 'delivered')`,
      totalMessagesClicked: sql`COUNT(*) FILTER (WHERE ${smsSentMessages.status} = 'clicked')`,
      totalUnsubscribes: sql`COUNT(*) FILTER (WHERE ${smsSentMessages.status} = 'unsubscribed')`,
      totalCost: sql`SUM(${smsSentMessages.cost})`,
      totalConversions: sql`COUNT(*) FILTER (WHERE ${smsSentMessages.conversionTracked} = true)`
    }).from(smsSentMessages);

    if (startDate) {
      campaignsQuery = campaignsQuery.where(sql`${smsCampaigns.createdAt} >= ${startDate}`);
      messagesQuery = messagesQuery.where(sql`${smsSentMessages.createdAt} >= ${startDate}`);
    }
    if (endDate) {
      campaignsQuery = campaignsQuery.where(sql`${smsCampaigns.createdAt} <= ${endDate}`);
      messagesQuery = messagesQuery.where(sql`${smsSentMessages.createdAt} <= ${endDate}`);
    }

    const [campaignStats] = await campaignsQuery;
    const [messageStats] = await messagesQuery;

    const totalCampaigns = Number(campaignStats.totalCampaigns) || 0;
    const activeCampaigns = Number(campaignStats.activeCampaigns) || 0;
    const totalMessagesSent = Number(messageStats.totalMessagesSent) || 0;
    const totalMessagesDelivered = Number(messageStats.totalMessagesDelivered) || 0;
    const totalMessagesClicked = Number(messageStats.totalMessagesClicked) || 0;
    const totalUnsubscribes = Number(messageStats.totalUnsubscribes) || 0;
    const totalCost = Number(messageStats.totalCost) || 0;
    const totalConversions = Number(messageStats.totalConversions) || 0;

    return {
      totalCampaigns,
      activeCampaigns,
      totalMessagesSent,
      totalMessagesDelivered,
      totalMessagesClicked,
      totalUnsubscribes,
      deliveryRate: totalMessagesSent > 0 ? (totalMessagesDelivered / totalMessagesSent) * 100 : 0,
      clickRate: totalMessagesDelivered > 0 ? (totalMessagesClicked / totalMessagesDelivered) * 100 : 0,
      unsubscribeRate: totalMessagesSent > 0 ? (totalUnsubscribes / totalMessagesSent) * 100 : 0,
      totalCost,
      averageCostPerMessage: totalMessagesSent > 0 ? totalCost / totalMessagesSent : 0,
      totalConversions,
      conversionRate: totalMessagesSent > 0 ? (totalConversions / totalMessagesSent) * 100 : 0,
      roi: totalCost > 0 ? ((totalConversions * 1000) - totalCost) / totalCost * 100 : 0 // Assuming 1000€ average conversion value
    };
  }

  async getSmsCampaignPerformance(startDate?: Date, endDate?: Date): Promise<Array<{
    id: string;
    name: string;
    status: string;
    sent: number;
    delivered: number;
    clicked: number;
    conversions: number;
    deliveryRate: number;
    clickRate: number;
    conversionRate: number;
    cost: number;
    roi: number;
    createdAt: string;
  }>> {
    let query = db.select().from(smsCampaigns);

    if (startDate) {
      query = query.where(sql`${smsCampaigns.createdAt} >= ${startDate}`);
    }
    if (endDate) {
      query = query.where(sql`${smsCampaigns.createdAt} <= ${endDate}`);
    }

    const campaigns = await query.orderBy(desc(smsCampaigns.createdAt));

    return campaigns.map(campaign => ({
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      sent: campaign.sentCount || 0,
      delivered: campaign.deliveredCount || 0,
      clicked: campaign.clickedCount || 0,
      conversions: campaign.conversionCount || 0,
      deliveryRate: campaign.sentCount ? (campaign.deliveredCount / campaign.sentCount) * 100 : 0,
      clickRate: campaign.deliveredCount ? (campaign.clickedCount / campaign.deliveredCount) * 100 : 0,
      conversionRate: campaign.sentCount ? (campaign.conversionCount / campaign.sentCount) * 100 : 0,
      cost: Number(campaign.actualCost) || 0,
      roi: Number(campaign.roi) || 0,
      createdAt: campaign.createdAt?.toISOString() || ''
    }));
  }

  async getSmsTemplatePerformance(): Promise<Array<{
    id: string;
    name: string;
    category: string;
    usageCount: number;
    conversionRate: number;
    averageClickRate: number;
    lastUsed?: string;
  }>> {
    const templates = await db.select().from(smsTemplates).orderBy(desc(smsTemplates.usageCount));

    return templates.map(template => ({
      id: template.id,
      name: template.name,
      category: template.category,
      usageCount: template.usageCount || 0,
      conversionRate: Number(template.conversionRate) || 0,
      averageClickRate: 0, // Would need complex query to calculate from sent messages
      lastUsed: template.lastUsed?.toISOString()
    }));
  }
}

export const storage = new SupabaseStorage();
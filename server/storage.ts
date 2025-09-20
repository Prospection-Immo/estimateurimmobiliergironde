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
  // FORMATIONS PREMIUM MODULE
  type Course,
  type Order,
  type OrderItem,
  type Enrollment,
  type CourseEvent,
  type ChatConfiguration,
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
  // FORMATIONS PREMIUM MODULE
  type InsertCourse,
  type InsertOrder,
  type InsertOrderItem,
  type InsertEnrollment,
  type InsertCourseEvent,
  type InsertChatConfiguration,
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
  smsSequenceEnrollments,
  // FORMATIONS PREMIUM MODULE
  courses,
  orders,
  orderItems,
  enrollments,
  courseEvents,
  chatConfigurations
} from "@shared/schema";
import { eq, desc, sql, and } from "drizzle-orm";

// Database connection - Use Supabase database
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.log('❌ No DATABASE_URL found. Please configure Supabase connection.');
}

let client: any;
let db: any;
let usingFallback = false;

// Temporary fallback chat configuration for when database is not available
let fallbackChatConfig: ChatConfiguration = {
  id: "fallback-config",
  name: "Configuration principale",
  systemPrompt: "Vous êtes un assistant expert en immobilier spécialisé dans la région de Gironde/Bordeaux. Vous aidez les utilisateurs avec leurs questions sur l'estimation immobilière, le marché local, et les conseils pour vendre ou acheter. Soyez professionnel, précis et utilisez votre expertise du marché français.",
  model: "gpt-4o-mini",
  maxTokens: 2048,
  temperature: "0.7",
  maxHistoryMessages: 6,
  isActive: true,
  welcomeMessage: "Bonjour ! Je suis votre assistant immobilier spécialisé dans la région Gironde/Bordeaux. Comment puis-je vous aider avec votre projet immobilier ?",
  createdAt: new Date(),
  updatedAt: new Date()
};

if (!connectionString) {
  console.error('❌ CRITICAL: DATABASE_URL environment variable is required but not found!');
  console.error('Please configure your Supabase DATABASE_URL in environment variables.');
  process.exit(1);
}

console.log('🔌 Connecting to Supabase database...');

// Use Supabase pooled connection for better stability (port 6543 instead of 5432)
let optimizedConnectionString = connectionString;
if (connectionString.includes('supabase.co') && connectionString.includes(':5432/')) {
  optimizedConnectionString = connectionString.replace(':5432/', ':6543/');
  console.log('🔧 Using Supabase pooled connection (port 6543)');
}

// Configure postgres client with proper options for Supabase
client = postgres(optimizedConnectionString, {
  max: 10,                    // Pool size
  idle_timeout: 20,          // Close idle connections after 20s
  connect_timeout: 90,       // Increased timeout for better reliability
  prepare: false,            // Disable prepared statements for PgBouncer compatibility
  ssl: 'require',            // Enforce SSL for security
  transform: {
    undefined: null
  }
});

db = drizzle(client);

// Verify database connection on startup
async function verifyDatabaseConnection() {
  try {
    await client`SELECT 1 as health_check`;
    console.log('✅ Database connection verified successfully');
  } catch (error) {
    console.error('❌ CRITICAL: Failed to connect to database:', error);
    console.error('Please check your DATABASE_URL and network connectivity.');
    process.exit(1);
  }
}

// Call verification function
verifyDatabaseConnection();

// Export db for direct access
export { db };

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
  getEstimations(): Promise<Estimation[]>;
  
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
  createEmailTemplate(emailTemplate: InsertEmailTemplate): Promise<EmailTemplate>;
  getEmailTemplates(category?: string): Promise<EmailTemplate[]>;
  getEmailTemplateById(id: string): Promise<EmailTemplate | undefined>;
  getEmailTemplateByCategory(category: string): Promise<EmailTemplate | undefined>;
  updateEmailTemplate(id: string, updates: Partial<InsertEmailTemplate>): Promise<EmailTemplate>;
  deleteEmailTemplate(id: string): Promise<void>;

  // Email History
  createEmailHistory(emailHistory: InsertEmailHistory): Promise<EmailHistory>;
  getEmailHistory(limit?: number, status?: string): Promise<EmailHistory[]>;
  updateEmailHistoryStatus(id: string, status: string, errorMessage?: string): Promise<void>;

  // Auth Sessions
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

  // Guide Downloads
  createGuideDownload(download: InsertGuideDownload): Promise<GuideDownload>;
  getGuideDownloads(guideId?: string): Promise<GuideDownload[]>;

  // Guide Email Sequences
  createGuideEmailSequence(sequence: InsertGuideEmailSequence): Promise<GuideEmailSequence>;
  getGuideEmailSequences(): Promise<GuideEmailSequence[]>;
  updateGuideEmailSequenceStatus(id: string, status: string): Promise<void>;

  // Chat Configuration
  getChatConfiguration(): Promise<ChatConfiguration | undefined>;
  updateChatConfiguration(config: Partial<InsertChatConfiguration>): Promise<ChatConfiguration>;
  createChatConfiguration(config: InsertChatConfiguration): Promise<ChatConfiguration>;

  // Analytics
  getSalesAnalytics(): Promise<{
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    topCourses: Array<{ sku: string; count: number; revenue: number; }>;
  }>;
  getEnrollmentAnalytics(): Promise<{
    totalEnrollments: number;
    activeStudents: number;
    averageProgress: number;
    completionRate: number;
  }>;
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
    return await db.select().from(articles).orderBy(desc(articles.createdAt)).limit(limit);
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
      .where(and(
        eq(articles.category, category),
        eq(articles.status, 'published')
      ))
      .orderBy(desc(articles.publishedAt))
      .limit(limit);
  }

  async updateArticle(id: string, updates: Partial<InsertArticle>): Promise<Article> {
    const result = await db.update(articles).set(updates).where(eq(articles.id, id)).returning();
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
      return await db.select().from(emailTemplates).where(eq(emailTemplates.category, category));
    }
    return await db.select().from(emailTemplates);
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
    const result = await db.update(emailTemplates).set({ 
      ...updates, 
      updatedAt: new Date() 
    }).where(eq(emailTemplates.id, id)).returning();
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
    const updateData: any = { status };
    if (status === 'sent') {
      updateData.sentAt = new Date();
    }
    if (errorMessage) {
      updateData.errorMessage = errorMessage;
    }
    
    await db.update(emailHistory).set(updateData).where(eq(emailHistory.id, id));
  }

  // Auth Sessions
  async createAuthSession(session: InsertAuthSession): Promise<AuthSession> {
    const result = await db.insert(authSessions).values(session).returning();
    return result[0];
  }

  async getAuthSession(id: string): Promise<AuthSession | undefined> {
    const result = await db.select().from(authSessions).where(eq(authSessions.id, id)).limit(1);
    return result[0];
  }

  async updateAuthSession(id: string, updates: Partial<InsertAuthSession>): Promise<void> {
    await db.update(authSessions).set(updates).where(eq(authSessions.id, id));
  }

  // Guides
  async createGuide(guide: InsertGuide): Promise<Guide> {
    const result = await db.insert(guides).values(guide).returning();
    return result[0];
  }

  async getGuides(persona?: string): Promise<Guide[]> {
    let query = db.select().from(guides);
    
    if (persona) {
      query = query.where(eq(guides.persona, persona));
    }
    
    return await query.orderBy(guides.sortOrder);
  }

  async getGuideById(id: string): Promise<Guide | undefined> {
    const result = await db.select().from(guides).where(eq(guides.id, id)).limit(1);
    return result[0];
  }

  async getGuideBySlug(slug: string): Promise<Guide | undefined> {
    const result = await db.select().from(guides).where(eq(guides.slug, slug)).limit(1);
    return result[0];
  }

  async updateGuide(id: string, updates: Partial<InsertGuide>): Promise<Guide> {
    const result = await db.update(guides).set({ 
      ...updates, 
      updatedAt: new Date() 
    }).where(eq(guides.id, id)).returning();
    return result[0];
  }

  async deleteGuide(id: string): Promise<void> {
    await db.delete(guides).where(eq(guides.id, id));
  }

  // Guide Downloads
  async createGuideDownload(download: InsertGuideDownload): Promise<GuideDownload> {
    const result = await db.insert(guideDownloads).values(download).returning();
    return result[0];
  }

  async getGuideDownloads(guideId?: string): Promise<GuideDownload[]> {
    if (guideId) {
      return await db.select().from(guideDownloads)
        .where(eq(guideDownloads.guideId, guideId))
        .orderBy(desc(guideDownloads.downloadedAt));
    }
    return await db.select().from(guideDownloads)
      .orderBy(desc(guideDownloads.downloadedAt));
  }

  // Guide Email Sequences
  async createGuideEmailSequence(sequence: InsertGuideEmailSequence): Promise<GuideEmailSequence> {
    const result = await db.insert(guideEmailSequences).values(sequence).returning();
    return result[0];
  }

  async getGuideEmailSequences(): Promise<GuideEmailSequence[]> {
    return await db.select().from(guideEmailSequences).orderBy(desc(guideEmailSequences.createdAt));
  }

  async updateGuideEmailSequenceStatus(id: string, status: string): Promise<void> {
    await db.update(guideEmailSequences).set({ status }).where(eq(guideEmailSequences.id, id));
  }

  // Chat Configuration
  async getChatConfiguration(): Promise<ChatConfiguration | undefined> {
    try {
      const result = await db.select().from(chatConfigurations).limit(1);
      return result[0];
    } catch (error) {
      console.warn('⚠️ Database unavailable, using fallback chat configuration');
      usingFallback = true;
      return fallbackChatConfig;
    }
  }

  async updateChatConfiguration(config: Partial<InsertChatConfiguration>): Promise<ChatConfiguration> {
    try {
      // Get the first configuration to update
      const existing = await this.getChatConfiguration();
      if (existing && !usingFallback) {
        const result = await db.update(chatConfigurations)
          .set({ ...config, updatedAt: new Date() })
          .where(eq(chatConfigurations.id, existing.id))
          .returning();
        return result[0];
      } else if (!usingFallback) {
        // Create new if none exists
        return await this.createChatConfiguration(config as InsertChatConfiguration);
      } else {
        // Update fallback config in memory
        console.warn('⚠️ Database unavailable, updating fallback chat configuration');
        fallbackChatConfig = {
          ...fallbackChatConfig,
          ...config,
          updatedAt: new Date()
        };
        return fallbackChatConfig;
      }
    } catch (error) {
      console.warn('⚠️ Database unavailable, updating fallback chat configuration');
      usingFallback = true;
      fallbackChatConfig = {
        ...fallbackChatConfig,
        ...config,
        updatedAt: new Date()
      };
      return fallbackChatConfig;
    }
  }

  async createChatConfiguration(config: InsertChatConfiguration): Promise<ChatConfiguration> {
    const result = await db.insert(chatConfigurations).values(config).returning();
    return result[0];
  }

  // Analytics
  async getSalesAnalytics(): Promise<{
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    topCourses: Array<{ sku: string; count: number; revenue: number; }>;
  }> {
    // Get total orders and revenue
    const ordersData = await db.select().from(orders);
    const totalOrders = ordersData.length;
    const totalRevenue = ordersData.reduce((sum, order) => sum + order.totalCents, 0) / 100;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Get top courses from order items
    const topCoursesQuery = await db
      .select({
        sku: orderItems.sku,
        count: sql<number>`count(*)`.as('count'),
        revenue: sql<number>`sum(${orderItems.unitPriceCents}) / 100`.as('revenue')
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .groupBy(orderItems.sku)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    const topCourses = topCoursesQuery.map(row => ({
      sku: row.sku!,
      count: Number(row.count),
      revenue: Number(row.revenue)
    }));

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      topCourses
    };
  }

  async getEnrollmentAnalytics(): Promise<{
    totalEnrollments: number;
    activeStudents: number;
    averageProgress: number;
    completionRate: number;
  }> {
    const enrollmentsData = await db.select().from(enrollments);

    const totalEnrollments = enrollmentsData.length;
    const activeStudents = enrollmentsData.filter(e => e.lastAccessedAt && e.lastAccessedAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length; // Active in last 30 days
    const averageProgress = totalEnrollments > 0 
      ? enrollmentsData.reduce((sum, e) => sum + e.progressPercent, 0) / totalEnrollments 
      : 0;
    const completionRate = totalEnrollments > 0 
      ? (enrollmentsData.filter(e => e.progressPercent >= 100).length / totalEnrollments) * 100 
      : 0;

    return {
      totalEnrollments,
      activeStudents,
      averageProgress,
      completionRate
    };
  }
}

export const storage = new SupabaseStorage();
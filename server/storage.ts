import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { supabaseAdmin } from "./lib/supabaseAdmin";
import { toSupabaseArticle, fromSupabaseArticle, fromSupabaseArticles } from "./lib/articleMapper";
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
import { supabase, testSupabaseConnection } from './lib/supabaseClient';
import { supabaseAdmin, testSupabaseAdminConnection, isAdminAvailable } from './lib/supabaseAdmin';

// Initialize Supabase connection with fallback support
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

console.log('🔌 Initializing Supabase connections...');

// Database connection - Use Supabase database (fallback to postgres if needed)
const connectionString = process.env.DATABASE_URL;

let client: any;
let db: any;

if (!connectionString) {
  console.error('❌ CRITICAL: DATABASE_URL environment variable is required but not found!');
  console.error('Please configure your Supabase DATABASE_URL in environment variables.');
  process.exit(1);
}

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
  connect_timeout: 30,       // Reduced timeout to prevent startup delays
  prepare: false,            // Disable prepared statements for PgBouncer compatibility
  ssl: 'require',            // Enforce SSL for security
  transform: {
    undefined: null
  }
});

db = drizzle(client);

// Test connections and provide proper feedback (non-blocking)
async function initializeSupabaseConnections() {
  try {
    // Test postgres connection first
    await client`SELECT 1 as health_check`;
    console.log('✅ PostgreSQL connection verified successfully');
    
    // Test both supabase clients concurrently (non-blocking)
    const [publicConnected, adminConnected] = await Promise.allSettled([
      testSupabaseConnection(),
      testSupabaseAdminConnection()
    ]);

    if (publicConnected.status === 'rejected' || !publicConnected.value) {
      console.warn('⚠️ Supabase public client unavailable, using direct postgres');
    } else {
      console.log('✅ Supabase public client connected');
    }

    if (adminConnected.status === 'rejected' || !adminConnected.value) {
      console.warn('⚠️ Supabase admin client unavailable');
    } else {
      console.log('✅ Supabase admin client connected');
    }
  } catch (error) {
    console.warn('⚠️ Database connection test failed, enabling fallback mode:', error);
    usingFallback = true;
  }
}

// Initialize connections (non-blocking to prevent startup delays)
initializeSupabaseConnections();

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
    try {
      console.log('🔍 createArticle called with:', insertArticle.title);
      
      const supabaseData = toSupabaseArticle(insertArticle);
      const { data, error } = await supabaseAdmin
        .from('articles')
        .insert([supabaseData])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Supabase error in createArticle:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      console.log('✅ Article created successfully:', data.id);
      return fromSupabaseArticle(data);
    } catch (error) {
      console.error('💥 Error in createArticle:', error);
      throw error;
    }
  }

  async getArticles(limit = 50): Promise<Article[]> {
    try {
      console.log('🔍 getArticles called with limit:', limit);
      
      const { data, error } = await supabaseAdmin
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('❌ Supabase error in getArticles:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      console.log('✅ Articles fetched successfully:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('💥 Error in getArticles:', error);
      throw error;
    }
  }

  async getAllArticles(limit = 50, status?: string, category?: string, searchQuery?: string): Promise<Article[]> {
    try {
      console.log('🔍 getAllArticles called with:', { limit, status, category, searchQuery });
      
      let query = supabaseAdmin.from('articles').select('*');
      
      // Apply filters
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }
      if (category && category !== 'all') {
        query = query.eq('category', category);
      }
      if (searchQuery) {
        const searchTerm = searchQuery.toLowerCase();
        query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
      }
      
      console.log('📡 Executing Supabase query...');
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('❌ Supabase error in getAllArticles:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      console.log('✅ Articles fetched successfully:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('💥 Error in getAllArticles:', error);
      throw error;
    }
  }

  async getArticleBySlug(slug: string): Promise<Article | undefined> {
    try {
      // Use Supabase API for better reliability
      const supabase = await import('./lib/supabaseAdmin').then(m => m.supabaseAdmin);
      
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('slug', slug)
        .limit(1);
      
      if (error) {
        console.error('Supabase error in getArticleBySlug:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      return data?.[0];
    } catch (error) {
      console.error('Error in getArticleBySlug:', error);
      throw error;
    }
  }

  async getArticlesByCategory(category: string, limit = 20): Promise<Article[]> {
    try {
      console.log('🔍 getArticlesByCategory called with:', category);
      
      const { data, error } = await supabaseAdmin
        .from('articles')
        .select('*')
        .eq('category', category)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('❌ Supabase error in getArticlesByCategory:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      console.log('✅ Articles by category fetched:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('💥 Error in getArticlesByCategory:', error);
      throw error;
    }
  }

  async updateArticle(id: string, updates: Partial<InsertArticle>): Promise<Article> {
    try {
      console.log('🔍 updateArticle called for ID:', id);
      
      const { data, error } = await supabaseAdmin
        .from('articles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Supabase error in updateArticle:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      console.log('✅ Article updated successfully:', data.id);
      return data;
    } catch (error) {
      console.error('💥 Error in updateArticle:', error);
      throw error;
    }
  }

  async deleteArticle(id: string): Promise<void> {
    try {
      console.log('🔍 deleteArticle called for ID:', id);
      
      const { error } = await supabaseAdmin
        .from('articles')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('❌ Supabase error in deleteArticle:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      console.log('✅ Article deleted successfully:', id);
    } catch (error) {
      console.error('💥 Error in deleteArticle:', error);
      throw error;
    }
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
      if (usingFallback || !supabase) {
        return fallbackChatConfig;
      }
      
      const { data, error } = await supabase
        .from('chat_configurations')
        .select('*')
        .limit(1)
        .single();
      
      if (error) {
        console.warn('⚠️ Database unavailable, using fallback chat configuration');
        usingFallback = true;
        return fallbackChatConfig;
      }
      
      return data as ChatConfiguration;
    } catch (error) {
      console.warn('⚠️ Database unavailable, using fallback chat configuration');
      usingFallback = true;
      return fallbackChatConfig;
    }
  }

  async updateChatConfiguration(config: Partial<InsertChatConfiguration>): Promise<ChatConfiguration> {
    try {
      if (usingFallback || !supabase) {
        // Update fallback config in memory
        console.warn('⚠️ Database unavailable, updating fallback chat configuration');
        fallbackChatConfig = {
          ...fallbackChatConfig,
          ...config,
          updatedAt: new Date()
        };
        return fallbackChatConfig;
      }
      
      // Get the first configuration to update
      const existing = await this.getChatConfiguration();
      if (existing && !usingFallback && supabase) {
        const { data, error } = await supabase
          .from('chat_configurations')
          .update({ ...config, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select()
          .single();
          
        if (error) throw error;
        return data as ChatConfiguration;
      } else {
        // Create new if none exists
        return await this.createChatConfiguration(config as InsertChatConfiguration);
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
    try {
      if (usingFallback) {
        console.warn('⚠️ Database unavailable, cannot create chat configuration');
        throw new Error('Database unavailable');
      }
      
      const { data, error } = await supabase
        .from('chat_configurations')
        .insert({
          ...config,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (error) throw error;
      return data as ChatConfiguration;
    } catch (error) {
      console.warn('⚠️ Failed to create chat configuration:', error);
      throw error;
    }
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

  // Database Testing and Status Methods
  async testConnection(): Promise<boolean> {
    try {
      if (usingFallback) {
        return false; // Fallback mode means DB is not available
      }
      await db.execute(sql`SELECT 1`);
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      throw error;
    }
  }

  async getStorageStatus() {
    const status = {
      usingFallback,
      timestamp: new Date().toISOString(),
      postgresAvailable: false,
      supabasePublicAvailable: false,
      supabaseAdminAvailable: false
    };

    // Test postgres connection
    try {
      await this.testConnection();
      status.postgresAvailable = !usingFallback;
    } catch (error) {
      status.postgresAvailable = false;
    }

    // Test Supabase connections
    try {
      const { testSupabaseConnection } = await import('./lib/supabaseClient');
      status.supabasePublicAvailable = await testSupabaseConnection();
    } catch (error) {
      status.supabasePublicAvailable = false;
    }

    try {
      const { testSupabaseAdminConnection } = await import('./lib/supabaseAdmin');
      status.supabaseAdminAvailable = await testSupabaseAdminConnection();
    } catch (error) {
      status.supabaseAdminAvailable = false;
    }

    return status;
  }
}

export const storage = new SupabaseStorage();
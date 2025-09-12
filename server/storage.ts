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
  guideEmailSequences
} from "@shared/schema";
import { eq, desc, sql, and } from "drizzle-orm";

// Database connection
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

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
}

export const storage = new SupabaseStorage();
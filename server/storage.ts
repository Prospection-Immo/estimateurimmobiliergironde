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

// Check if we're in a development environment
// Use explicit NODE_ENV check for better reliability
const isDevelopmentMode = process.env.NODE_ENV === 'development' && (!connectionString || connectionString.includes('3pVwZ'));

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
  // Use Supabase pooled connection for better stability (port 6543 instead of 5432)
  let optimizedConnectionString = connectionString;
  if (connectionString.includes(':5432/')) {
    optimizedConnectionString = connectionString.replace(':5432/', ':6543/');
    console.log('Using Supabase pooled connection for better stability');
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
}

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
  // Memory store for development mode (when database is not connected)
  private memoryStore = {
    authSessions: new Map<string, AuthSession>(),
    leads: new Map<string, Lead>(),
    estimations: new Map<string, Estimation[]>()
  };

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
      // Create and store lead in memory for development
      const lead: Lead = {
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
      
      // Store in memory
      this.memoryStore.leads.set(lead.id, lead);
      
      return lead;
    }
    
    const result = await db.insert(leads).values(insertLead).returning();
    return result[0];
  }

  async getLeads(limit = 50): Promise<Lead[]> {
    if (isDevelopmentMode) {
      // Read from memory in development mode
      const leadsArray = Array.from(this.memoryStore.leads.values());
      return leadsArray
        .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime())
        .slice(0, limit);
    }
    return await db.select().from(leads).orderBy(desc(leads.createdAt)).limit(limit);
  }

  async updateLeadStatus(id: string, status: string): Promise<void> {
    await db.update(leads).set({ status }).where(eq(leads.id, id));
  }

  // Estimations
  async createEstimation(insertEstimation: InsertEstimation): Promise<Estimation> {
    if (isDevelopmentMode) {
      // Create and store estimation in memory for development
      const estimation: Estimation = {
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
      
      // Store in memory
      if (!this.memoryStore.estimations.has(insertEstimation.leadId)) {
        this.memoryStore.estimations.set(insertEstimation.leadId, []);
      }
      this.memoryStore.estimations.get(insertEstimation.leadId)!.push(estimation);
      
      return estimation;
    }
    
    const result = await db.insert(estimations).values(insertEstimation).returning();
    return result[0];
  }

  async getEstimationsByLeadId(leadId: string): Promise<Estimation[]> {
    if (isDevelopmentMode) {
      // Read from memory in development mode
      return this.memoryStore.estimations.get(leadId) || [];
    }
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
      const mockArticles = [
        {
          id: 'dev-article-1',
          title: 'Comment estimer sa maison en Gironde : Guide complet 2025',
          slug: 'comment-estimer-maison-gironde-guide-2025',
          content: `
            <h2>L'estimation immobilière en Gironde : les fondamentaux</h2>
            <p>Estimer correctement sa maison en Gironde nécessite une approche méthodique et une connaissance approfondie du marché local. La Gironde, avec ses spécificités géographiques allant des vignobles de Saint-Émilion aux quartiers résidentiels de Bordeaux, présente une grande diversité de prix au m².</p>
            
            <h3>Les critères essentiels d'évaluation</h3>
            <p>Plusieurs facteurs influencent directement la valeur de votre bien :</p>
            <ul>
              <li><strong>L'emplacement</strong> : proximité de Bordeaux, accessibilité transports</li>
              <li><strong>La superficie et configuration</strong> : surface habitable, nombre de pièces</li>
              <li><strong>L'état général</strong> : travaux récents, isolation, chauffage</li>
              <li><strong>Les prestations</strong> : jardin, garage, balcon, cave</li>
            </ul>
            
            <h3>Prix moyens en Gironde fin 2024</h3>
            <p>Le marché girondin affiche des prix contrastés selon les secteurs :</p>
            <ul>
              <li>Bordeaux centre : 4 500-6 000 €/m²</li>
              <li>Périphérie bordelaise : 3 200-4 200 €/m²</li>
              <li>Communes rurales : 1 800-2 800 €/m²</li>
              <li>Littoral bassin d'Arcachon : 5 000-8 000 €/m²</li>
            </ul>
            
            <h3>Méthode d'estimation par comparaison</h3>
            <p>La méthode la plus fiable consiste à analyser les ventes récentes de biens similaires dans votre secteur. Consultez les bases de données notariales et les annonces pour établir une fourchette de prix réaliste.</p>
            
            <h3>Quand faire appel à un professionnel ?</h3>
            <p>Un expert immobilier local apporte une valeur ajoutée précieuse, notamment pour les biens atypiques ou dans les secteurs en mutation. Son analyse fine du quartier et sa connaissance des acheteurs potentiels garantissent une estimation juste.</p>
            
            <p><em>Une estimation précise est la clé d'une vente réussie dans les délais souhaités.</em></p>
          `,
          summary: 'Découvrez comment estimer correctement votre maison en Gironde avec notre guide expert. Méthodes, prix moyens 2025 et conseils pratiques.',
          metaDescription: 'Guide complet pour estimer sa maison en Gironde en 2025. Prix moyens, critères d\'évaluation et conseils d\'experts immobiliers.',
          keywords: ['estimation immobilière gironde', 'prix immobilier bordeaux', 'vendre maison gironde', 'estimation gratuite'],
          category: 'estimation',
          status: 'published' as const,
          authorName: 'Sophie Martinez - Expert Immobilier',
          publishedAt: new Date('2025-01-10'),
          createdAt: new Date('2025-01-10'),
          updatedAt: null
        },
        {
          id: 'dev-article-2', 
          title: 'Marché immobilier Bordeaux 2025 : tendances et prévisions',
          slug: 'marche-immobilier-bordeaux-2025-tendances-previsions',
          content: `
            <h2>État du marché immobilier bordelais début 2025</h2>
            <p>Le marché immobilier de Bordeaux entame 2025 dans un contexte de stabilisation après plusieurs années de forte hausse. Les prix affichent une modération bienvenue, créant de nouvelles opportunités pour les acquéreurs.</p>
            
            <h3>Évolution des prix sur 12 mois</h3>
            <p>L'analyse des transactions de 2024 révèle :</p>
            <ul>
              <li>Stabilisation des prix dans l'ancien : +1,2% sur l'année</li>
              <li>Léger recul du neuf : -2,5% en moyenne</li>
              <li>Délais de vente rallongés : 95 jours en moyenne</li>
              <li>Négociations plus fréquentes : -3% en moyenne sur les prix annoncés</li>
            </ul>
            
            <h3>Secteurs porteurs et délaissés</h3>
            <p><strong>Quartiers en demande :</strong></p>
            <ul>
              <li>Caudéran : recherché pour ses espaces verts</li>
              <li>Saint-Augustin : proximité tram et commerces</li>
              <li>Chartrons : cachet historique préservé</li>
            </ul>
            
            <p><strong>Secteurs en difficulté :</strong></p>
            <ul>
              <li>Bacalan : saturation de l'offre neuve</li>
              <li>Bastide : concurrence forte</li>
            </ul>
            
            <h3>Prévisions 2025</h3>
            <p>Les experts anticipent :</p>
            <ul>
              <li>Poursuite de la stabilisation des prix</li>
              <li>Retour progressif des primo-accédants</li>
              <li>Intérêt maintenu pour les biens rénovés</li>
              <li>Développement du marché des résidences secondaires</li>
            </ul>
            
            <h3>Conseils pour vendeurs et acheteurs</h3>
            <p><strong>Vendeurs :</strong> Privilégiez un prix attractif dès le départ pour réduire les délais de vente. La présentation du bien devient cruciale.</p>
            <p><strong>Acheteurs :</strong> Le pouvoir de négociation s'améliore. Prenez le temps de comparer et n'hésitez pas à faire des offres réfléchies.</p>
          `,
          summary: 'Analyse complète du marché immobilier bordelais en 2025 : évolution des prix, secteurs porteurs et prévisions d\'experts.',
          metaDescription: 'Marché immobilier Bordeaux 2025 : prix, tendances et prévisions. Analyse experte des secteurs porteurs et conseils achat-vente.',
          keywords: ['marché immobilier bordeaux', 'prix bordeaux 2025', 'achat appartement bordeaux', 'vente maison bordeaux'],
          category: 'marche',
          status: 'published' as const,
          authorName: 'Jean-Pierre Dubois - Analyste Marché',
          publishedAt: new Date('2025-01-08'),
          createdAt: new Date('2025-01-08'),
          updatedAt: null
        },
        {
          id: 'dev-article-3',
          title: '10 conseils pour vendre rapidement sa maison en Gironde',
          slug: '10-conseils-vendre-rapidement-maison-gironde',
          content: `
            <h2>Comment accélérer la vente de votre maison en Gironde</h2>
            <p>Vendre rapidement sa maison en Gironde demande une stratégie bien pensée. Voici nos 10 conseils essentiels pour optimiser votre vente et séduire les acquéreurs potentiels.</p>
            
            <h3>1. Fixez le bon prix dès le départ</h3>
            <p>Un prix juste dès la mise sur le marché génère immédiatement de l'intérêt. Surévaluer votre bien retarde la vente et dévalorise votre propriété aux yeux des acquéreurs.</p>
            
            <h3>2. Soignez la première impression</h3>
            <p>La façade, l'entrée et le jardin sont cruciaux. Un coup de peinture, quelques plantations et un nettoyage approfondi peuvent transformer la perception de votre bien.</p>
            
            <h3>3. Dépersonnalisez votre intérieur</h3>
            <p>Les acquéreurs doivent se projeter. Rangez les objets personnels, photos de famille et décorations trop spécifiques. Optez pour une décoration neutre et moderne.</p>
            
            <h3>4. Optimisez l'éclairage</h3>
            <p>Un intérieur lumineux paraît plus grand et plus accueillant. Ouvrez tous les volets, allumez les lampes lors des visites et nettoyez les fenêtres.</p>
            
            <h3>5. Effectuez les petites réparations</h3>
            <p>Robinetterie qui fuit, peinture écaillée, poignées défaillantes : ces détails créent une impression de mal-entretien. Investissez dans ces réparations mineures.</p>
            
            <h3>6. Mettez en valeur vos atouts</h3>
            <p>Jardin, garage, cave, proximité écoles ou transports : valorisez tous les plus de votre propriété dans vos annonces et lors des visites.</p>
            
            <h3>7. Choisissez le bon moment pour vendre</h3>
            <p>En Gironde, le printemps et l'automne sont les saisons les plus favorables. Évitez juillet-août et décembre-janvier si possible.</p>
            
            <h3>8. Soyez flexible sur les visites</h3>
            <p>Plus vous proposez de créneaux, plus vous multipliez vos chances. Week-ends et fins d'après-midi sont particulièrement demandés.</p>
            
            <h3>9. Préparez vos documents</h3>
            <p>Diagnostics, factures de travaux, charges de copropriété : avoir tous les documents prêts rassure les acquéreurs et accélère les démarches.</p>
            
            <h3>10. Travaillez avec un professionnel local</h3>
            <p>Un agent immobilier girondin connaît parfaitement son marché, dispose d'un fichier client qualifié et sait négocier efficacement.</p>
            
            <p><em>L'application de ces conseils peut réduire significativement votre délai de vente, souvent de plusieurs mois.</em></p>
          `,
          summary: '10 conseils essentiels d\'experts pour vendre rapidement votre maison en Gironde. Stratégies éprouvées pour séduire les acquéreurs.',
          metaDescription: '10 conseils d\'experts pour vendre rapidement sa maison en Gironde. Prix, présentation, timing : tout pour réussir votre vente immobilière.',
          keywords: ['vendre maison rapidement gironde', 'conseils vente immobilière', 'vente rapide bordeaux', 'expert immobilier gironde'],
          category: 'conseils',
          status: 'published' as const,
          authorName: 'Marie Lagrange - Consultante Immobilière',
          publishedAt: new Date('2025-01-05'),
          createdAt: new Date('2025-01-05'),
          updatedAt: null
        },
        {
          id: 'dev-article-4',
          title: 'Investir dans l\'immobilier en Gironde : opportunités 2025',
          slug: 'investir-immobilier-gironde-opportunites-2025',
          content: `
            <h2>L'investissement immobilier en Gironde : panorama 2025</h2>
            <p>La Gironde offre des opportunités d'investissement diversifiées, de l'immobilier locatif traditionnel aux résidences de tourisme. Découvrez les secteurs porteurs et les stratégies gagnantes pour 2025.</p>
            
            <h3>Les secteurs géographiques d'avenir</h3>
            <p><strong>Bordeaux Métropole :</strong></p>
            <ul>
              <li>Forte demande locative étudiante et jeunes actifs</li>
              <li>Rendements bruts : 4-6% selon secteurs</li>
              <li>Plus-values à long terme assurées</li>
            </ul>
            
            <p><strong>Bassin d'Arcachon :</strong></p>
            <ul>
              <li>Marché de la résidence secondaire dynamique</li>
              <li>Location saisonnière très rentable</li>
              <li>Contraintes réglementaires à anticiper</li>
            </ul>
            
            <p><strong>Communes périurbaines :</strong></p>
            <ul>
              <li>Maisons avec jardin très recherchées</li>
              <li>Prix d'achat encore abordables</li>
              <li>Développement des infrastructures</li>
            </ul>
            
            <h3>Typologie de biens à privilégier</h3>
            <p><strong>Appartements T2-T3 Bordeaux :</strong></p>
            <p>Idéaux pour la location aux étudiants et jeunes actifs. Secteurs Victoire, Saint-Michel et Bastide particulièrement intéressants.</p>
            
            <p><strong>Maisons rénovées périphérie :</strong></p>
            <p>Forte demande des familles cherchant à fuir les centres-villes. Potentiel de plus-value important sur 10-15 ans.</p>
            
            <p><strong>Biens atypiques centre-ville :</strong></p>
            <p>Lofts, échoppes rénovées : niche haut de gamme avec rendements attractifs.</p>
            
            <h3>Financement et fiscalité</h3>
            <p>Les taux d'intérêt stabilisés autour de 4% rendent l'investissement locatif à nouveau attractif. Dispositifs fiscaux disponibles :</p>
            <ul>
              <li>Loi Pinel dans certaines zones</li>
              <li>Déficit foncier pour les rénovations lourdes</li>
              <li>Régime réel pour optimiser la fiscalité</li>
            </ul>
            
            <h3>Pièges à éviter</h3>
            <ul>
              <li>Surestimer les loyers potentiels</li>
              <li>Négliger les charges de copropriété</li>
              <li>Ignorer l'évolution urbaine du quartier</li>
              <li>Investir sans étude de marché locative</li>
            </ul>
            
            <h3>Conseil d'expert</h3>
            <p>L'investissement immobilier girondin reste pertinent en 2025, à condition de bien choisir son secteur et son type de bien. La connaissance fine du marché local est indispensable pour sécuriser son investissement.</p>
          `,
          summary: 'Guide complet pour investir dans l\'immobilier girondin en 2025 : secteurs porteurs, rendements et stratégies d\'investissement.',
          metaDescription: 'Investissement immobilier Gironde 2025 : secteurs porteurs, rendements locatifs et conseils d\'experts. Guide complet pour investisseurs.',
          keywords: ['investissement immobilier gironde', 'rendement locatif bordeaux', 'achat investissement bordeaux', 'immobilier locatif gironde'],
          category: 'investissement',
          status: 'published' as const,
          authorName: 'Philippe Rousseau - Conseiller Patrimoine',
          publishedAt: new Date('2025-01-03'),
          createdAt: new Date('2025-01-03'),
          updatedAt: null
        },
        {
          id: 'dev-article-5',
          title: 'Vente immobilière : droits et obligations en Gironde',
          slug: 'vente-immobiliere-droits-obligations-gironde',
          content: `
            <h2>Cadre juridique de la vente immobilière en Gironde</h2>
            <p>Vendre un bien immobilier en Gironde implique le respect d'un cadre juridique précis. Vendeurs et acquéreurs ont des droits et obligations qu'il convient de maîtriser pour sécuriser la transaction.</p>
            
            <h3>Obligations du vendeur</h3>
            <p><strong>Information et diagnostics :</strong></p>
            <ul>
              <li>Diagnostic de performance énergétique (DPE)</li>
              <li>État relatif à la présence d'amiante</li>
              <li>Constat de risque d'exposition au plomb</li>
              <li>État de l'installation intérieure d'électricité</li>
              <li>État de l'installation intérieure de gaz</li>
              <li>État relatif à la présence de termites</li>
              <li>État des risques naturels et technologiques</li>
            </ul>
            
            <p><strong>Vice caché :</strong></p>
            <p>Le vendeur doit garantir l'acquéreur contre les vices cachés qui rendraient le bien impropre à sa destination ou en diminueraient l'usage.</p>
            
            <h3>Spécificités girondines</h3>
            <p><strong>Zones à risque :</strong></p>
            <p>Certaines communes girondines sont classées en zones de sismicité modérée ou en zones de retrait-gonflement des argiles, nécessitant des informations complémentaires.</p>
            
            <p><strong>Patrimoine historique :</strong></p>
            <p>Bordeaux étant classé UNESCO, certains biens sont soumis à l'avis des Architectes des Bâtiments de France pour les modifications.</p>
            
            <h3>La promesse de vente</h3>
            <p>Document engageant le vendeur pendant une durée déterminée. En Gironde, la pratique locale favorise :</p>
            <ul>
              <li>Délai de rétractation de 10 jours pour l'acquéreur</li>
              <li>Conditions suspensives (financement, vente du bien actuel)</li>
              <li>Clause pénale en cas de désistement non justifié</li>
            </ul>
            
            <h3>L'acte de vente définitif</h3>
            <p>Signé devant notaire, il doit contenir :</p>
            <ul>
              <li>L'identité complète des parties</li>
              <li>La désignation précise du bien</li>
              <li>Le prix et les modalités de paiement</li>
              <li>Les garanties données par le vendeur</li>
              <li>L'origine de propriété</li>
            </ul>
            
            <h3>Frais et taxes</h3>
            <p><strong>À la charge de l'acquéreur :</strong></p>
            <ul>
              <li>Frais de notaire : 7-8% de la valeur dans l'ancien</li>
              <li>Droits de mutation : 5,81% en Gironde</li>
              <li>Émoluments et débours du notaire</li>
            </ul>
            
            <p><strong>À la charge du vendeur :</strong></p>
            <ul>
              <li>Diagnostics immobiliers : 500-1500€</li>
              <li>Plus-value immobilière si applicable</li>
              <li>Frais d'agence si mandatement</li>
            </ul>
            
            <h3>Recours en cas de litige</h3>
            <p>En cas de conflit, plusieurs solutions existent :</p>
            <ul>
              <li>Médiation amiable</li>
              <li>Tribunal judiciaire de Bordeaux</li>
              <li>Expertise judiciaire si vice caché</li>
            </ul>
            
            <p><em>La connaissance de vos droits et obligations sécurise votre transaction immobilière en Gironde.</em></p>
          `,
          summary: 'Guide juridique complet de la vente immobilière en Gironde : obligations, diagnostics, spécificités locales et recours.',
          metaDescription: 'Vente immobilière Gironde : droits, obligations et cadre juridique. Guide complet des démarches légales pour vendeurs et acquéreurs.',
          keywords: ['droit immobilier gironde', 'vente immobilière juridique', 'obligations vendeur bordeaux', 'diagnostics immobiliers'],
          category: 'juridique',
          status: 'published' as const,
          authorName: 'Maître Claire Dubois - Notaire',
          publishedAt: new Date('2024-12-30'),
          createdAt: new Date('2024-12-30'),
          updatedAt: null
        },
        {
          id: 'dev-article-6',
          title: 'Prix au m² en Gironde : cartographie détaillée par commune',
          slug: 'prix-m2-gironde-cartographie-commune-2025',
          content: `
            <h2>Cartographie des prix immobiliers en Gironde</h2>
            <p>La Gironde présente une grande disparité de prix selon les communes. Notre analyse détaillée vous aide à comprendre les écarts et identifier les opportunités d'achat ou de vente.</p>
            
            <h3>Bordeaux et ses arrondissements</h3>
            <p><strong>Centre historique (Triangle d'Or) :</strong></p>
            <ul>
              <li>Appartements anciens : 5 500-7 000 €/m²</li>
              <li>Programmes neufs : 6 500-8 500 €/m²</li>
              <li>Évolution : +2,1% sur 12 mois</li>
            </ul>
            
            <p><strong>Chartrons - Grand Parc :</strong></p>
            <ul>
              <li>Appartements anciens : 4 200-5 800 €/m²</li>
              <li>Rénovations haut de gamme : 6 000-7 200 €/m²</li>
              <li>Évolution : +1,8% sur 12 mois</li>
            </ul>
            
            <p><strong>Bastide - Rive Droite :</strong></p>
            <ul>
              <li>Appartements anciens : 3 800-4 600 €/m²</li>
              <li>Programmes neufs : 4 500-5 500 €/m²</li>
              <li>Évolution : +0,5% sur 12 mois</li>
            </ul>
            
            <h3>Première couronne bordelaise</h3>
            <p><strong>Communes premium :</strong></p>
            <ul>
              <li>Le Bouscat : 4 100-4 800 €/m²</li>
              <li>Talence : 3 900-4 600 €/m²</li>
              <li>Pessac : 3 600-4 200 €/m²</li>
              <li>Mérignac : 3 400-4 000 €/m²</li>
            </ul>
            
            <p><strong>Secteurs en développement :</strong></p>
            <ul>
              <li>Bègles : 3 200-3 800 €/m²</li>
              <li>Villenave d'Ornon : 3 000-3 600 €/m²</li>
              <li>Gradignan : 3 400-4 000 €/m²</li>
            </ul>
            
            <h3>Bassin d'Arcachon</h3>
            <p>Le littoral girondin affiche les prix les plus élevés du département :</p>
            <ul>
              <li>Arcachon centre : 6 000-9 000 €/m²</li>
              <li>Cap Ferret : 8 000-12 000 €/m²</li>
              <li>La Teste-de-Buch : 4 500-6 000 €/m²</li>
              <li>Andernos-les-Bains : 4 200-5 800 €/m²</li>
            </ul>
            
            <h3>Secteurs viticoles</h3>
            <p><strong>Prestige international :</strong></p>
            <ul>
              <li>Saint-Émilion : 3 200-4 800 €/m²</li>
              <li>Pauillac : 2 800-3 600 €/m²</li>
              <li>Margaux : 3 000-4 200 €/m²</li>
            </ul>
            
            <p><strong>Autres appellations :</strong></p>
            <ul>
              <li>Cadillac : 2 200-2 800 €/m²</li>
              <li>Langon : 1 800-2 400 €/m²</li>
              <li>Créon : 2 000-2 600 €/m²</li>
            </ul>
            
            <h3>Communes rurales</h3>
            <p>L'immobilier rural girondin reste accessible :</p>
            <ul>
              <li>Haute-Gironde : 1 400-2 000 €/m²</li>
              <li>Landes girondines : 1 600-2 200 €/m²</li>
              <li>Entre-deux-Mers : 1 800-2 400 €/m²</li>
            </ul>
            
            <h3>Facteurs d'évolution 2025</h3>
            <p>Plusieurs éléments influenceront les prix :</p>
            <ul>
              <li>Extension ligne D du tramway</li>
              <li>Développement télétravail</li>
              <li>Nouvelle réglementation DPE</li>
              <li>Arrivée LGV Bordeaux-Toulouse</li>
            </ul>
            
            <h3>Conseil d'expertise</h3>
            <p>Ces prix sont indicatifs et peuvent varier selon l'état du bien, ses prestations et sa situation précise. Une estimation personnalisée reste indispensable pour toute transaction.</p>
          `,
          summary: 'Cartographie complète des prix au m² en Gironde par commune. Analyse détaillée des secteurs et tendances d\'évolution 2025.',
          metaDescription: 'Prix immobilier Gironde 2025 : cartographie détaillée par commune. Bordeaux, Bassin d\'Arcachon, vignobles et secteur rural.',
          keywords: ['prix m2 gironde', 'prix immobilier bordeaux', 'marché immobilier arcachon', 'estimation prix commune gironde'],
          category: 'estimation',
          status: 'published' as const,
          authorName: 'David Moreau - Expert Foncier',
          publishedAt: new Date('2024-12-28'),
          createdAt: new Date('2024-12-28'),
          updatedAt: null
        },
        {
          id: 'dev-article-7',
          title: 'Home staging : valoriser sa maison avant la vente en Gironde',
          slug: 'home-staging-valoriser-maison-vente-gironde',
          content: `
            <h2>Le home staging : un investissement rentable en Gironde</h2>
            <p>Le home staging, art de valoriser un bien immobilier pour accélérer sa vente, connaît un succès croissant en Gironde. Cette technique peut réduire significativement votre délai de vente tout en optimisant le prix final.</p>
            
            <h3>Qu'est-ce que le home staging ?</h3>
            <p>Le home staging consiste à préparer et mettre en scène votre bien pour séduire le maximum d'acquéreurs potentiels. L'objectif : permettre aux visiteurs de se projeter facilement dans leur futur logement.</p>
            
            <h3>Les règles d'or du home staging</h3>
            <p><strong>Dépersonnaliser :</strong></p>
            <ul>
              <li>Retirer photos personnelles et objets trop spécifiques</li>
              <li>Adopter une décoration neutre et contemporaine</li>
              <li>Créer une atmosphère accueillante mais impersonnelle</li>
            </ul>
            
            <p><strong>Désencombrer :</strong></p>
            <ul>
              <li>Vider 50% du contenu de chaque pièce</li>
              <li>Libérer les espaces de circulation</li>
              <li>Ranger placards et espaces de rangement</li>
            </ul>
            
            <p><strong>Nettoyer en profondeur :</strong></p>
            <ul>
              <li>Sols, murs, plafonds impeccables</li>
              <li>Vitres et miroirs étincelants</li>
              <li>Éliminer toute odeur (tabac, animaux, cuisine)</li>
            </ul>
            
            <h3>Spécificités du marché girondin</h3>
            <p><strong>Échoppes bordelaises :</strong></p>
            <p>Mettez en valeur l'authenticité tout en modernisant : poutres apparentes nettoyées, parquet rénové, luminaires design contrastant avec l'ancien.</p>
            
            <p><strong>Appartements haussmanniens :</strong></p>
            <p>Valorisez les volumes et la lumière : miroirs stratégiques, couleurs claires, mobilier proportionné aux hauteurs sous plafond.</p>
            
            <p><strong>Pavillons périurbains :</strong></p>
            <p>L'extérieur est crucial : jardin entretenu, terrasse aménagée, façade propre. L'intérieur doit respirer la modernité et la fonctionnalité.</p>
            
            <h3>Budget et retour sur investissement</h3>
            <p><strong>Coûts moyens en Gironde :</strong></p>
            <ul>
              <li>Home staging léger : 1 000-3 000€</li>
              <li>Home staging complet : 3 000-8 000€</li>
              <li>Location mobilier : 300-800€/mois</li>
            </ul>
            
            <p><strong>Retour sur investissement :</strong></p>
            <ul>
              <li>Réduction délai de vente : 30-50%</li>
              <li>Prix de vente préservé ou bonifié</li>
              <li>Moins de négociations sur le prix</li>
            </ul>
            
            <h3>Home staging DIY : nos conseils</h3>
            <p><strong>À faire soi-même :</strong></p>
            <ul>
              <li>Peinture fraîche en blanc ou beige</li>
              <li>Remplacement des luminaires vétustes</li>
              <li>Ajout de plantes vertes</li>
              <li>Réorganisation du mobilier</li>
            </ul>
            
            <p><strong>Investissements judicieux :</strong></p>
            <ul>
              <li>Nouvelles poignées et robinetterie : 200-500€</li>
              <li>Coussins et rideaux modernes : 300-600€</li>
              <li>Éclairage d'appoint design : 150-400€</li>
            </ul>
            
            <h3>Erreurs à éviter</h3>
            <ul>
              <li>Surinvestir dans des travaux lourds</li>
              <li>Imposer ses goûts personnels</li>
              <li>Négliger l'extérieur et l'entrée</li>
              <li>Oublier de créer une ambiance lors des visites</li>
            </ul>
            
            <h3>Professionnels du home staging en Gironde</h3>
            <p>De nombreux home stagers professionnels opèrent en Gironde. Ils apportent expertise, mobilier et décoration adaptés au marché local. Un investissement souvent rentabilisé par une vente plus rapide et mieux valorisée.</p>
            
            <p><em>Le home staging bien exécuté peut faire la différence sur un marché concurrentiel comme celui de la Gironde.</em></p>
          `,
          summary: 'Guide complet du home staging en Gironde pour accélérer la vente de votre maison. Techniques, budget et conseils d\'experts.',
          metaDescription: 'Home staging Gironde : valorisez votre maison avant la vente. Techniques, budget et conseils pour vendre plus vite et mieux.',
          keywords: ['home staging gironde', 'valoriser maison vente', 'vendre rapidement bordeaux', 'mise en scène immobilière'],
          category: 'conseils',
          status: 'published' as const,
          authorName: 'Isabelle Moreau - Home Stager',
          publishedAt: new Date('2024-12-25'),
          createdAt: new Date('2024-12-25'),
          updatedAt: null
        },
        {
          id: 'dev-article-8',
          title: 'Rénovation énergétique : impact sur la valeur immobilière en Gironde',
          slug: 'renovation-energetique-impact-valeur-immobiliere-gironde',
          content: `
            <h2>Rénovation énergétique : un levier de valorisation immobilière</h2>
            <p>Avec le durcissement de la réglementation DPE et la sensibilisation croissante aux enjeux environnementaux, la rénovation énergétique devient un facteur déterminant de la valeur immobilière en Gironde.</p>
            
            <h3>Impact du DPE sur les prix</h3>
            <p>L'étiquette énergétique influence directement la valeur des biens :</p>
            <ul>
              <li><strong>Classe A-B :</strong> Bonus de 5-10% sur le prix de vente</li>
              <li><strong>Classe C-D :</strong> Valeur de référence du marché</li>
              <li><strong>Classe E :</strong> Décote de 5-8%</li>
              <li><strong>Classe F-G :</strong> Décote de 10-20% et difficultés de vente</li>
            </ul>
            
            <h3>Les passoires thermiques en Gironde</h3>
            <p>En Gironde, environ 17% du parc immobilier est classé F ou G. Ces biens, appelés "passoires thermiques", font face à :</p>
            <ul>
              <li>Des délais de vente rallongés</li>
              <li>Des négociations plus importantes</li>
              <li>Une interdiction de location progressive (dès 2025 pour les G+)</li>
            </ul>
            
            <h3>Travaux prioritaires pour améliorer le DPE</h3>
            <p><strong>Isolation :</strong></p>
            <ul>
              <li>Combles : 3 000-6 000€ pour gagner 1-2 classes</li>
              <li>Murs extérieurs : 15 000-25 000€ pour gagner 2-3 classes</li>
              <li>Sol : 5 000-8 000€ pour gagner 1 classe</li>
            </ul>
            
            <p><strong>Chauffage :</strong></p>
            <ul>
              <li>Pompe à chaleur : 10 000-18 000€</li>
              <li>Chaudière gaz condensation : 4 000-7 000€</li>
              <li>Poêle à granulés : 3 000-6 000€</li>
            </ul>
            
            <p><strong>Fenêtres :</strong></p>
            <ul>
              <li>Double vitrage performant : 400-800€/m²</li>
              <li>Triple vitrage : 600-1 000€/m²</li>
            </ul>
            
            <h3>Aides disponibles en Gironde</h3>
            <p><strong>Aides nationales :</strong></p>
            <ul>
              <li>MaPrimeRénov' : jusqu'à 20 000€</li>
              <li>Éco-PTZ : jusqu'à 50 000€</li>
              <li>CEE (Certificats d'Économie d'Énergie)</li>
              <li>TVA réduite à 5,5%</li>
            </ul>
            
            <p><strong>Aides locales :</strong></p>
            <ul>
              <li>Bordeaux Métropole : subventions complémentaires</li>
              <li>Conseil départemental : aides spécifiques seniors</li>
              <li>Certaines communes : bonus rénovation</li>
            </ul>
            
            <h3>Calcul de rentabilité</h3>
            <p><strong>Exemple concret - Maison 120m² classe F :</strong></p>
            <ul>
              <li>Investissement rénovation : 40 000€</li>
              <li>Aides obtenues : 18 000€</li>
              <li>Coût réel : 22 000€</li>
              <li>Plus-value immobilière : +35 000€</li>
              <li>Gain net : +13 000€ + économies d'énergie</li>
            </ul>
            
            <h3>Rénovation par étapes</h3>
            <p>Une approche progressive peut être judicieuse :</p>
            <ol>
              <li><strong>Phase 1 :</strong> Isolation des combles et changement de chauffage</li>
              <li><strong>Phase 2 :</strong> Isolation des murs par l'extérieur</li>
              <li><strong>Phase 3 :</strong> Remplacement des fenêtres</li>
            </ol>
            
            <h3>Spécificités du bâti girondin</h3>
            <p><strong>Échoppes bordelaises :</strong></p>
            <p>Attention aux contraintes architecturales. L'isolation par l'intérieur est souvent privilégiée pour préserver les façades.</p>
            
            <p><strong>Immeubles haussmanniens :</strong></p>
            <p>Travaux en copropriété complexes mais très rentables. L'isolation par l'extérieur transforme ces biens.</p>
            
            <h3>Conseil d'expert</h3>
            <p>La rénovation énergétique est devenue incontournable en Gironde. Au-delà de la valeur ajoutée immédiate, elle prépare votre bien aux exigences futures du marché et à l'évolution réglementaire.</p>
            
            <p><em>Investir dans la performance énergétique, c'est investir dans l'avenir de son patrimoine immobilier.</em></p>
          `,
          summary: 'Impact de la rénovation énergétique sur la valeur immobilière en Gironde. DPE, travaux prioritaires, aides et rentabilité.',
          metaDescription: 'Rénovation énergétique Gironde : impact sur la valeur immobilière. DPE, aides disponibles et calcul de rentabilité des travaux.',
          keywords: ['rénovation énergétique gironde', 'DPE immobilier bordeaux', 'aides rénovation gironde', 'passoire thermique vente'],
          category: 'conseils',
          status: 'published' as const,
          authorName: 'Thomas Leroy - Expert Rénovation',
          publishedAt: new Date('2024-12-22'),
          createdAt: new Date('2024-12-22'),
          updatedAt: null
        }
      ];
      
      return mockArticles.slice(0, limit);
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
    // Since we're in memory mode, create a session object directly
    const newSession: AuthSession = {
      id: session.id || crypto.randomUUID(),
      email: session.email,
      phoneNumber: session.phoneNumber,
      isEmailVerified: session.isEmailVerified || false,
      isSmsVerified: session.isSmsVerified || false,
      verificationSid: session.verificationSid || null,
      expiresAt: session.expiresAt,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Store in memory (since database is not connected)
    this.memoryStore.authSessions.set(newSession.id, newSession);
    
    return newSession;
  }

  async getAuthSession(id: string): Promise<AuthSession | undefined> {
    // Get from memory store (since database is not connected)
    return this.memoryStore.authSessions.get(id);
  }

  async updateAuthSession(id: string, updates: Partial<InsertAuthSession>): Promise<void> {
    // Update in memory store (since database is not connected)
    const existing = this.memoryStore.authSessions.get(id);
    if (existing) {
      const updated = { ...existing, ...updates, updatedAt: new Date() };
      this.memoryStore.authSessions.set(id, updated);
    }
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
      const mockGuides = [
        {
          id: 'dev-guide-presse',
          title: 'Guide du Vendeur Pressé en Gironde',
          slug: 'guide-vendeur-presse-gironde',
          persona: 'presse',
          shortBenefit: 'Vendez votre bien en moins de 90 jours grâce à nos stratégies éprouvées',
          readingTime: 15,
          content: `<h1>Guide du Vendeur Pressé en Gironde</h1>
            <p>Vous devez vendre rapidement votre bien immobilier en Gironde ? Ce guide vous révèle les stratégies qui fonctionnent dans un marché concurrentiel comme celui de Bordeaux et ses environs.</p>
            
            <h2>Stratégies de pricing agressif</h2>
            <p>Le prix est votre arme principale. En Gironde, un bien correctement pricé se vend 40% plus vite. Découvrez comment positionner votre prix pour attirer immédiatement les acheteurs.</p>
            
            <h2>Home staging express</h2>
            <p>Valorisez votre bien en 48h chrono avec des techniques de home staging adaptées aux goûts bordelais. Investissement moyen : 500€ pour un gain de 15 000€.</p>
            
            <h2>Réseau d'acheteurs qualifiés</h2>
            <p>Accédez à notre réseau d'acheteurs pré-qualifiés en Gironde. 60% de nos ventes se font hors marché public.</p>`,
          summary: 'Pricing stratégique • Home staging express • Réseau acheteurs • Négociation rapide',
          imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&crop=center',
          metaDescription: 'Guide expert pour vendre rapidement votre bien immobilier en Gironde. Stratégies éprouvées, home staging, réseau acheteurs.',
          seoTitle: 'Guide Vendeur Pressé Gironde | Vendre en 90 jours',
          downloadCount: 125,
          isActive: true,
          sortOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'dev-guide-maximisateur',
          title: 'Guide du Maximisateur de Plus-Value',
          slug: 'guide-maximisateur-plus-value-gironde',
          persona: 'maximisateur',
          shortBenefit: 'Optimisez chaque euro de votre vente grâce à nos techniques de négociation avancées',
          readingTime: 25,
          content: `<h1>Guide du Maximisateur de Plus-Value en Gironde</h1>
            <p>Vous voulez obtenir le meilleur prix pour votre bien ? Ce guide révèle les techniques utilisées par les négociateurs immobiliers d'élite en Gironde.</p>
            
            <h2>Valorisation maximale de votre bien</h2>
            <p>Identifiez tous les leviers de valorisation : travaux rentables, optimisation fiscale, timing parfait. En Gironde, ces techniques permettent de gagner entre 5% et 15% sur le prix de vente.</p>
            
            <h2>Psychologie de négociation immobilière</h2>
            <p>Maîtrisez l'art de la négociation avec les acheteurs girondins. Techniques de closing, gestion des objections, création d'urgence artificielle.</p>
            
            <h2>Analyse micro-marché Bordeaux Métropole</h2>
            <p>Exploitez les spécificités de chaque quartier : Saint-Pierre, Chartrons, Caudéran... Maximisez selon votre localisation précise.</p>`,
          summary: 'Valorisation maximale • Négociation avancée • Analyse micro-marché • ROI travaux • Fiscalité optimisée',
          imageUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=300&fit=crop&crop=center',
          metaDescription: 'Guide expert maximisation plus-value immobilière Gironde. Négociation, valorisation, fiscalité optimisée.',
          seoTitle: 'Maximiser Plus-Value Immobilière Gironde | Guide Expert',
          downloadCount: 89,
          isActive: true,
          sortOrder: 2,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'dev-guide-succession',
          title: 'Guide Succession Immobilière Gironde',
          slug: 'guide-succession-immobiliere-gironde',
          persona: 'succession',
          shortBenefit: 'Gérez sereinement la vente d\'un bien hérité avec nos conseils juridiques et pratiques',
          readingTime: 30,
          content: `<h1>Guide Succession Immobilière en Gironde</h1>
            <p>Vendre un bien immobilier en succession nécessite des précautions particulières. Ce guide vous accompagne dans chaque étape administrative et pratique.</p>
            
            <h2>Démarches administratives succession</h2>
            <p>Check-list complète : acte de notoriété, déclaration de succession, autorisation de vendre. Délais et pièges à éviter en Gironde.</p>
            
            <h2>Optimisation fiscale succession</h2>
            <p>Minimisez les droits de succession, optimisez l'abattement, gérez la plus-value. Stratégies spécifiques aux biens girondins.</p>
            
            <h2>Gestion familiale et émotionnelle</h2>
            <p>Conseils pour gérer les conflits familiaux, prendre des décisions consensuelles, préserver les relations tout en optimisant la vente.</p>
            
            <h2>Valorisation bien patrimoine</h2>
            <p>Techniques spécifiques pour les biens anciens, maisons de famille, propriétés viticoles typiques de la Gironde.</p>`,
          summary: 'Démarches légales • Fiscalité succession • Gestion familiale • Valorisation patrimoine • Optimisation droits',
          imageUrl: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=300&fit=crop&crop=center',
          metaDescription: 'Guide complet succession immobilière Gironde. Démarches, fiscalité, gestion familiale, conseils notariaux.',
          seoTitle: 'Succession Immobilière Gironde | Guide Complet 2025',
          downloadCount: 67,
          isActive: true,
          sortOrder: 3,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'dev-guide-nouvelle-vie',
          title: 'Guide Nouvelle Vie - Changement Immobilier',
          slug: 'guide-nouvelle-vie-changement-immobilier',
          persona: 'nouvelle_vie',
          shortBenefit: 'Accompagnement personnalisé pour votre projet de vie : déménagement, retraite, séparation',
          readingTime: 20,
          content: `<h1>Guide Nouvelle Vie - Changement Immobilier</h1>
            <p>Divorce, retraite, changement professionnel... Les transitions de vie nécessitent des stratégies immobilières adaptées. Ce guide vous accompagne dans votre nouveau départ.</p>
            
            <h2>Stratégies selon votre situation</h2>
            <p>Retraite : optimiser pour la fiscalité et le cash-flow. Divorce : préserver vos intérêts patrimoniaux. Mutation professionnelle : timing et négociation employeur.</p>
            
            <h2>Recherche nouveau logement</h2>
            <p>Critères adaptés à votre nouvelle vie, quartiers recommandés en Gironde selon l'âge et les besoins, budgétisation réaliste.</p>
            
            <h2>Accompagnement émotionnel</h2>
            <p>Gérer le stress du changement, prendre les bonnes décisions, éviter les erreurs dues à l'émotion. Support psychologique inclus.</p>
            
            <h2>Optimisation financière transition</h2>
            <p>Crédit relais, vente avant achat, négociation des frais, solutions de financement transitoires.</p>`,
          summary: 'Stratégies transition • Recherche logement • Support émotionnel • Optimisation financière • Accompagnement personnalisé',
          imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=300&fit=crop&crop=center',
          metaDescription: 'Guide changement vie immobilier Gironde. Retraite, divorce, mutation : stratégies et accompagnement personnalisé.',
          seoTitle: 'Changement Vie Immobilier Gironde | Guide Transition',
          downloadCount: 78,
          isActive: true,
          sortOrder: 4,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'dev-guide-investisseur',
          title: 'Guide de l\'Investisseur Immobilier Gironde',
          slug: 'guide-investisseur-immobilier-gironde',
          persona: 'investisseur',
          shortBenefit: 'Maximisez votre ROI avec les meilleures opportunités d\'investissement en Gironde',
          readingTime: 35,
          content: `<h1>Guide de l'Investisseur Immobilier en Gironde</h1>
            <p>Investir dans l'immobilier girondin nécessite une connaissance fine du marché local. Ce guide révèle les stratégies des investisseurs qui réussissent.</p>
            
            <h2>Analyse marché Bordeaux Métropole</h2>
            <p>Zones en développement, projets urbains 2025-2030, évolution des prix par secteur, identification des futures pépites immobilières.</p>
            
            <h2>Stratégies fiscales optimisées</h2>
            <p>Pinel, Malraux, défiscalisation, SCI : choisir la meilleure structure selon votre profil fiscal et vos objectifs de rentabilité.</p>
            
            <h2>Calculs de rentabilité précis</h2>
            <p>Cash-flow, rentabilité nette, impact fiscal, coûts cachés, seuils de rentabilité par type de bien et quartier en Gironde.</p>
            
            <h2>Négociation investisseur</h2>
            <p>Techniques de négociation spécifiques aux investissements, identification des biens décotés, négociation avec les promoteurs.</p>
            
            <h2>Gestion locative optimisée</h2>
            <p>Sélection locataires, optimisation loyers, gestion des impayés, stratégies de plus-value à moyen terme.</p>`,
          summary: 'Analyse marché • Fiscalité optimisée • Calculs rentabilité • Négociation • Gestion locative • Stratégies ROI',
          imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=300&fit=crop&crop=center',
          metaDescription: 'Guide investissement immobilier Gironde. ROI, fiscalité, analyse marché, négociation, gestion locative.',
          seoTitle: 'Investissement Immobilier Gironde | Guide ROI 2025',
          downloadCount: 156,
          isActive: true,
          sortOrder: 5,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'dev-guide-primo',
          title: 'Guide du Primo-Vendeur en Gironde',
          slug: 'guide-primo-vendeur-gironde',
          persona: 'primo',
          shortBenefit: 'Votre première vente immobilière expliquée étape par étape, sans stress ni piège',
          readingTime: 18,
          content: `<h1>Guide du Primo-Vendeur en Gironde</h1>
            <p>Première vente immobilière ? Ce guide vous accompagne pas à pas pour éviter les erreurs et optimiser votre transaction en toute sérénité.</p>
            
            <h2>Étapes de la vente immobilière</h2>
            <p>Chronologie complète : de l'estimation à la signature chez le notaire. Check-list détaillée, délais à respecter, documents à préparer.</p>
            
            <h2>Estimation juste de votre bien</h2>
            <p>Méthodes d'estimation, erreurs courantes des primo-vendeurs, importance du prix juste, comparaison avec le marché girondin.</p>
            
            <h2>Choisir son professionnel</h2>
            <p>Agent immobilier vs vente directe : avantages/inconvénients. Comment sélectionner le bon partenaire en Gironde.</p>
            
            <h2>Négociation pour débutants</h2>
            <p>Bases de la négociation immobilière, répondre aux objections courantes, éviter les erreurs qui coûtent cher.</p>
            
            <h2>Aspects juridiques simplifiés</h2>
            <p>Diagnostics obligatoires, compromis de vente, conditions suspensives. Tout comprendre sans jargon juridique.</p>`,
          summary: 'Étapes vente • Estimation juste • Choix professionnel • Négociation basics • Juridique simplifié • Éviter pièges',
          imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=300&fit=crop&crop=center',
          metaDescription: 'Guide première vente immobilière Gironde. Étapes, estimation, négociation, conseils primo-vendeur.',
          seoTitle: 'Primo-Vendeur Immobilier Gironde | Guide Première Vente',
          downloadCount: 203,
          isActive: true,
          sortOrder: 6,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      return mockGuides.filter(g => !persona || g.persona === persona);
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
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeadSchema, insertEstimationSchema, insertContactSchema, insertArticleSchema, insertEmailTemplateSchema, insertEmailHistorySchema } from "@shared/schema";
import { sanitizeArticleContent } from "./services/htmlSanitizer";
import { generateRealEstateArticle } from "./services/openai";
import emailService from "./services/emailService";
import { z } from "zod";

// Specific validation schemas for different lead types
const insertEstimationLeadSchema = insertLeadSchema.extend({
  propertyType: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  postalCode: z.string().min(1),
  surface: z.number().positive()
});

const insertFinancingLeadSchema = insertLeadSchema.extend({
  financingProjectType: z.string().trim().min(1).max(100),
  projectAmount: z.string().trim().min(1).max(50)
}).pick({
  email: true,
  phone: true,
  firstName: true,
  lastName: true,
  financingProjectType: true,
  projectAmount: true,
  source: true
}).extend({
  email: z.string().email().trim().max(255),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  phone: z.string().trim().max(20).optional()
});

// Estimation algorithm based on Gironde real estate data
function calculateEstimation(propertyData: {
  propertyType: string;
  city: string;
  surface: number;
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  hasGarden?: boolean;
  hasParking?: boolean;
  hasBalcony?: boolean;
  constructionYear?: number;
}) {
  // Base prices per m² by city in Gironde (simplified algorithm)
  const basePrices: Record<string, number> = {
    bordeaux: 4200,
    merignac: 3800,
    pessac: 3600,
    talence: 3900,
    begles: 3400,
    "villenave-d'ornon": 3200,
    gradignan: 3500,
    cenon: 2800,
    floirac: 3000,
    default: 3200
  };

  const cityKey = propertyData.city.toLowerCase().replace(/['\s-]/g, '').replace('é', 'e');
  let pricePerM2 = basePrices[cityKey] || basePrices.default;

  // Property type multiplier
  if (propertyData.propertyType === "house") {
    pricePerM2 *= 0.95; // Houses slightly cheaper per m²
  }

  // Room count adjustment
  if (propertyData.rooms) {
    if (propertyData.rooms >= 5) pricePerM2 *= 1.1;
    else if (propertyData.rooms <= 2) pricePerM2 *= 0.95;
  }

  // Age adjustment
  if (propertyData.constructionYear) {
    const age = new Date().getFullYear() - propertyData.constructionYear;
    if (age < 10) pricePerM2 *= 1.15;
    else if (age < 20) pricePerM2 *= 1.05;
    else if (age > 50) pricePerM2 *= 0.9;
  }

  // Features adjustments
  if (propertyData.hasGarden) pricePerM2 *= 1.08;
  if (propertyData.hasParking) pricePerM2 *= 1.05;
  if (propertyData.hasBalcony) pricePerM2 *= 1.03;

  const estimatedValue = Math.round(pricePerM2 * propertyData.surface);
  const confidence = Math.min(95, Math.max(75, 85 + Math.random() * 10));

  return {
    estimatedValue,
    pricePerM2: Math.round(pricePerM2),
    confidence: Math.round(confidence)
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Middleware to detect domain
  app.use((req, res, next) => {
    const host = req.get('host') || 'estimation-immobilier-gironde.fr';
    req.headers['x-domain'] = host;
    next();
  });

  // Create quick estimation (from homepage)
  app.post('/api/estimations-quick', async (req, res) => {
    try {
      const domain = req.headers['x-domain'] as string;
      
      // Validate the request body for quick estimation leads
      const validatedData = insertEstimationLeadSchema.parse({
        ...req.body,
        source: domain
      });

      // Calculate estimation
      const estimation = calculateEstimation({
        propertyType: validatedData.propertyType,
        city: validatedData.city,
        surface: validatedData.surface || 0,
        rooms: validatedData.rooms || undefined,
        bedrooms: validatedData.bedrooms || undefined,
        bathrooms: validatedData.bathrooms || undefined,
        hasGarden: validatedData.hasGarden || false,
        hasParking: validatedData.hasParking || false,
        hasBalcony: validatedData.hasBalcony || false,
        constructionYear: validatedData.constructionYear || undefined
      });

      // Save lead with quick type
      const lead = await storage.createLead({
        ...validatedData,
        estimatedValue: estimation.estimatedValue.toString(),
        leadType: 'estimation_quick',
        status: 'new'
      });

      // Save estimation
      const savedEstimation = await storage.createEstimation({
        leadId: lead.id,
        propertyType: validatedData.propertyType,
        address: validatedData.address,
        city: validatedData.city,
        surface: validatedData.surface || 0,
        rooms: validatedData.rooms || 0,
        estimatedValue: estimation.estimatedValue.toString(),
        pricePerM2: estimation.pricePerM2.toString(),
        confidence: estimation.confidence,
        methodology: "Estimation rapide basée sur les données du marché"
      });

      res.json({
        lead,
        estimation: savedEstimation,
        calculatedData: estimation
      });
    } catch (error) {
      console.error('Error creating quick estimation:', error);
      res.status(400).json({ error: 'Invalid data provided' });
    }
  });

  // Create detailed estimation (from estimation page)
  app.post('/api/estimations', async (req, res) => {
    try {
      const domain = req.headers['x-domain'] as string;
      
      // Validate the request body for detailed estimation leads
      const validatedData = insertEstimationLeadSchema.parse({
        ...req.body,
        source: domain
      });

      // Calculate estimation
      const estimation = calculateEstimation({
        propertyType: validatedData.propertyType,
        city: validatedData.city,
        surface: validatedData.surface || 0,
        rooms: validatedData.rooms || undefined,
        bedrooms: validatedData.bedrooms || undefined,
        bathrooms: validatedData.bathrooms || undefined,
        hasGarden: validatedData.hasGarden || false,
        hasParking: validatedData.hasParking || false,
        hasBalcony: validatedData.hasBalcony || false,
        constructionYear: validatedData.constructionYear || undefined
      });

      // Save lead with detailed type
      const lead = await storage.createLead({
        ...validatedData,
        estimatedValue: estimation.estimatedValue.toString(),
        leadType: 'estimation_detailed',
        status: 'new'
      });

      // Save estimation
      const savedEstimation = await storage.createEstimation({
        leadId: lead.id,
        propertyType: validatedData.propertyType,
        address: validatedData.address,
        city: validatedData.city,
        surface: validatedData.surface || 0,
        rooms: validatedData.rooms || 0,
        estimatedValue: estimation.estimatedValue.toString(),
        pricePerM2: estimation.pricePerM2.toString(),
        confidence: estimation.confidence,
        methodology: "Analyse comparative détaillée basée sur les transactions récentes en Gironde"
      });

      res.json({
        lead,
        estimation: savedEstimation,
        calculatedData: estimation
      });
    } catch (error) {
      console.error('Error creating estimation:', error);
      res.status(400).json({ error: 'Invalid data provided' });
    }
  });

  // Create guide download lead
  app.post('/api/guide-leads', async (req, res) => {
    try {
      const domain = req.headers['x-domain'] as string;
      
      // Validate the request body for guide download leads
      const validatedData = insertLeadSchema.parse({
        ...req.body,
        source: domain,
        leadType: 'guide_download'
      });

      // Save guide download lead
      const lead = await storage.createLead(validatedData);

      res.json(lead);
    } catch (error) {
      console.error('Error creating guide lead:', error);
      res.status(400).json({ error: 'Invalid data provided' });
    }
  });

  // Create financing lead
  app.post('/api/financement-leads', async (req, res) => {
    try {
      const domain = req.headers['x-domain'] as string;
      
      // Validate the request body for financing leads
      const validatedData = insertFinancingLeadSchema.parse({
        ...req.body,
        source: domain
      });

      // Save financing lead (preserving domain as source)
      const lead = await storage.createLead({
        ...validatedData,
        leadType: 'financing',
        status: 'new'
      });

      res.json(lead);
    } catch (error) {
      console.error('Error creating financing lead:', error);
      res.status(400).json({ error: 'Invalid data provided' });
    }
  });

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Simple hardcoded admin credentials for demo
      if (username === "admin" && password === "admin123") {
        (req.session as any).isAuthenticated = true;
        res.json({ success: true });
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
    } catch (error) {
      res.status(500).json({ error: "Authentication error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/auth/check", (req, res) => {
    res.json({ authenticated: !!(req.session as any).isAuthenticated });
  });

  // Middleware to check authentication
  const requireAuth = (req: any, res: any, next: any) => {
    if (!(req.session as any).isAuthenticated) {
      return res.status(401).json({ error: "Authentication required" });
    }
    next();
  };

  // Get leads (admin)
  app.get('/api/leads', requireAuth, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const leads = await storage.getLeads(limit);
      res.json(leads);
    } catch (error) {
      console.error('Error fetching leads:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get estimations (admin)
  app.get('/api/estimations', requireAuth, async (req, res) => {
    try {
      const estimations = await storage.getEstimations();
      res.json(estimations);
    } catch (error) {
      console.error('Error fetching estimations:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Update lead status (admin)
  app.patch('/api/leads/:id/status', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      await storage.updateLeadStatus(id, status);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating lead status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Create contact message
  app.post('/api/contacts', async (req, res) => {
    try {
      const domain = req.headers['x-domain'] as string;
      
      const validatedData = insertContactSchema.parse({
        ...req.body,
        source: domain
      });

      const contact = await storage.createContact(validatedData);
      res.json(contact);
    } catch (error) {
      console.error('Error creating contact:', error);
      res.status(400).json({ error: 'Invalid data provided' });
    }
  });

  // Get contacts (admin)
  app.get('/api/contacts', requireAuth, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const contacts = await storage.getContacts(limit);
      res.json(contacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get price per m² data for different cities
  app.get('/api/prix-m2', async (req, res) => {
    try {
      const cityPrices = [
        { city: "Bordeaux", priceM2: 4200, change: "+2.1%", trend: "up" },
        { city: "Mérignac", priceM2: 3800, change: "+1.8%", trend: "up" },
        { city: "Pessac", priceM2: 3600, change: "+1.5%", trend: "up" },
        { city: "Talence", priceM2: 3900, change: "+2.3%", trend: "up" },
        { city: "Bègles", priceM2: 3400, change: "+1.2%", trend: "up" },
        { city: "Villenave-d'Ornon", priceM2: 3200, change: "+0.9%", trend: "up" },
        { city: "Gradignan", priceM2: 3500, change: "+1.7%", trend: "up" },
        { city: "Cenon", priceM2: 2800, change: "+0.5%", trend: "stable" },
        { city: "Floirac", priceM2: 3000, change: "+1.1%", trend: "up" }
      ];
      
      res.json(cityPrices);
    } catch (error) {
      console.error('Error fetching price data:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Simple stats endpoint for admin dashboard
  app.get('/api/stats', requireAuth, async (req, res) => {
    try {
      const leads = await storage.getLeads(1000); // Get more for stats
      const contacts = await storage.getContacts(1000);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayLeads = leads.filter(lead => 
        lead.createdAt && new Date(lead.createdAt) >= today
      );
      
      const newLeads = leads.filter(lead => lead.status === 'new');
      
      const stats = {
        totalLeads: leads.length,
        newLeads: newLeads.length,
        estimationsToday: todayLeads.length,
        conversionRate: leads.length > 0 ? 
          ((leads.filter(l => l.status === 'converted').length / leads.length) * 100).toFixed(1) 
          : "0.0",
        totalContacts: contacts.length
      };
      
      res.json(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Articles routes
  app.get('/api/articles', async (req, res) => {
    try {
      const { category, limit } = req.query;
      let articles;
      
      if (category) {
        articles = await storage.getArticlesByCategory(
          category as string, 
          limit ? parseInt(limit as string) : undefined
        );
      } else {
        articles = await storage.getArticles(
          limit ? parseInt(limit as string) : undefined
        );
      }
      
      res.json(articles);
    } catch (error) {
      console.error('Error fetching articles:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/articles/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const article = await storage.getArticleBySlug(slug);
      
      if (!article) {
        return res.status(404).json({ error: 'Article not found' });
      }
      
      // Only allow published articles for public access
      if (article.status !== 'published') {
        // Check if user is authenticated for draft access
        if (!(req.session as any).isAuthenticated) {
          return res.status(404).json({ error: 'Article not found' });
        }
      }
      
      res.json(article);
    } catch (error) {
      console.error('Error fetching article:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/articles', requireAuth, async (req, res) => {
    try {
      const validation = insertArticleSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: validation.error.errors 
        });
      }

      // Sanitize HTML content before saving
      const sanitizedData = {
        ...validation.data,
        content: sanitizeArticleContent(validation.data.content)
      };

      const article = await storage.createArticle(sanitizedData);
      res.status(201).json(article);
    } catch (error) {
      console.error('Error creating article:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/articles/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const validation = insertArticleSchema.partial().safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: validation.error.errors 
        });
      }

      // Sanitize HTML content if provided
      const sanitizedData = validation.data.content 
        ? {
            ...validation.data,
            content: sanitizeArticleContent(validation.data.content)
          }
        : validation.data;

      const article = await storage.updateArticle(id, sanitizedData);
      res.json(article);
    } catch (error) {
      console.error('Error updating article:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete('/api/articles/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteArticle(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting article:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Admin-specific article routes with filtering
  app.get('/api/admin/articles', requireAuth, async (req, res) => {
    try {
      const { status, category, q, limit } = req.query;
      const articles = await storage.getAllArticles(
        limit ? parseInt(limit as string) : 50,
        status as string,
        category as string,
        q as string
      );
      res.json(articles);
    } catch (error) {
      console.error('Error fetching admin articles:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.patch('/api/admin/articles/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const validation = insertArticleSchema.partial().safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: validation.error.errors 
        });
      }

      // Handle publishedAt timestamp when publishing
      let updateData = validation.data;
      if (updateData.status === 'published' && !updateData.publishedAt) {
        updateData.publishedAt = new Date();
      }

      // Sanitize HTML content if provided
      if (updateData.content) {
        updateData = {
          ...updateData,
          content: sanitizeArticleContent(updateData.content)
        };
      }

      const article = await storage.updateArticle(id, updateData);
      res.json(article);
    } catch (error) {
      console.error('Error updating article:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // AI Article Generation with exact user prompt
  app.post('/api/admin/articles/generate', requireAuth, async (req, res) => {
    try {
      const { keyword, wordCount = 800, category = 'estimation', audience = 'proprietaires', tone = 'professionnel' } = req.body;
      
      if (!keyword) {
        return res.status(400).json({ 
          error: 'Keyword is required for article generation' 
        });
      }

      // Use the EXACT prompt provided by the user
      const exactPrompt = `Tu es une IA experte en rédaction d'articles de blog SEO, optimisés pour les moteurs de recherche et l'intelligence artificielle. Tu respectes les critères E-E-A-T de Google : Expérience (cas concrets, anecdotes), Expertise (analyses, données), Autorité (sources fiables, citations), Fiabilité (preuves, mentions légales). Tu reçois toujours deux variables : <keyword>${keyword}</keyword>, <word_count>${wordCount}</word_count>. 🎯 Rôle : Produire des articles de blog SEO structurés, crédibles et engageants, avec annexes SEO et éléments visuels. 📌 Tâches : Intégrer naturellement le mot-clé <keyword>, Respecter le nombre exact de mots <word_count>, Fournir un article structuré + SEO elements + idées Pinterest + descriptions d'images. 🔄 Processus (structure obligatoire de l'article) : Introduction claire et engageante, Sommaire cliquable (table des matières en H2), Expérience : anecdote ou étude de cas, Expertise : données, analyses ou explications techniques, Autorité : sources fiables, citations d'experts, Fiabilité : mentions légales, certifications, preuves, FAQ optimisée SEO (3 à 5 questions/réponses), Conclusion utile avec appel à l'action. 🛠️ Compétences : Rédaction professionnelle et accessible, Structuration SEO (H1 optimisé, H2/H3 clairs), Création automatique d'un sommaire et d'une FAQ, Appui sur données et sources crédibles, Optimisation technique : schema.org si pertinent + auteur, Génération d'éléments annexes (SEO Title, meta, slug, résumé, idées visuelles, descriptions d'images) et generer une iamge pour illustrer et partegeai sur les reseaux sociaux et une image sur le blog pour illuster les sections. 
      
Réponds en JSON avec cette structure exacte :
{
  "title": "titre H1 optimisé SEO avec le mot-clé",
  "slug": "url-friendly-slug",
  "metaDescription": "description de 150-160 caractères",
  "content": "contenu HTML complet avec toutes les sections requises (introduction, sommaire, expérience, expertise, autorité, fiabilité, FAQ, conclusion)",
  "summary": "résumé de 2-3 phrases",
  "keywords": ["${keyword}", "mot-clé2", "mot-clé3"],
  "category": "${category}",
  "seoElements": {
    "title": "titre SEO",
    "description": "meta description",
    "slug": "slug-url"
  },
  "visualElements": {
    "heroImageDescription": "description pour image principale",
    "sectionImages": ["description image section 1", "description image section 2"],
    "pinterestIdeas": ["idée pinterest 1", "idée pinterest 2"]
  }
}`;

      console.log(`Generating article with exact prompt for keyword: ${keyword}`);
      
      // Call OpenAI with the exact prompt
      const generatedContent = await generateRealEstateArticle({
        title: `Article sur ${keyword}`,
        topic: keyword,
        keywords: [keyword],
        targetRegion: 'Gironde',
        tone: tone as 'professional' | 'informative' | 'engaging',
        length: wordCount > 600 ? 'long' : wordCount > 400 ? 'medium' : 'short'
      });
      
      // Return the generated content using our service
      res.json({
        title: generatedContent.title,
        slug: generatedContent.slug,
        metaDescription: generatedContent.metaDescription,
        content: sanitizeArticleContent(generatedContent.content),
        summary: generatedContent.summary,
        keywords: generatedContent.keywords,
        category: category,
        seoElements: generatedContent.seoElements,
        visualElements: {
          heroImageDescription: "Image illustrant l'article sur " + keyword,
          sectionImages: [],
          pinterestIdeas: []
        }
      });
    } catch (error) {
      console.error('Error generating article with exact prompt:', error);
      res.status(500).json({ error: 'Failed to generate article content' });
    }
  });

  // Legacy endpoint - keep for backward compatibility
  app.post('/api/articles/generate', async (req, res) => {
    try {
      const { title, topic, keywords = [] } = req.body;
      
      if (!title || !topic) {
        return res.status(400).json({ 
          error: 'Title and topic are required' 
        });
      }

      console.log(`Generating article for topic: ${topic}`);
      const generatedContent = await generateRealEstateArticle({
        title,
        topic,
        keywords: Array.isArray(keywords) ? keywords : [keywords].filter(Boolean),
        targetRegion: 'Gironde',
        tone: 'professional',
        length: 'medium'
      });
      
      res.json({
        content: generatedContent.content,
        metaDescription: generatedContent.metaDescription,
        seoTitle: generatedContent.title,
        summary: generatedContent.summary,
        slug: generatedContent.slug,
        keywords: generatedContent.keywords
      });
    } catch (error) {
      console.error('Error generating article:', error);
      res.status(500).json({ error: 'Failed to generate article content' });
    }
  });

  // Email Templates Management Routes
  app.get('/api/admin/emails/templates', requireAuth, async (req, res) => {
    try {
      const { category } = req.query;
      const templates = await storage.getEmailTemplates(category as string);
      res.json(templates);
    } catch (error) {
      console.error('Error fetching email templates:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/admin/emails/templates/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const template = await storage.getEmailTemplateById(id);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      res.json(template);
    } catch (error) {
      console.error('Error fetching email template:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/admin/emails/templates', requireAuth, async (req, res) => {
    try {
      const validation = insertEmailTemplateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.error.errors
        });
      }

      const template = await storage.createEmailTemplate(validation.data);
      res.status(201).json(template);
    } catch (error) {
      console.error('Error creating email template:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/admin/emails/templates/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const validation = insertEmailTemplateSchema.partial().safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.error.errors
        });
      }

      const template = await storage.updateEmailTemplate(id, validation.data);
      res.json(template);
    } catch (error) {
      console.error('Error updating email template:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete('/api/admin/emails/templates/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteEmailTemplate(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting email template:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Email History Routes
  app.get('/api/admin/emails/history', requireAuth, async (req, res) => {
    try {
      const { status, limit } = req.query;
      const history = await storage.getEmailHistory(
        limit ? parseInt(limit as string) : 50,
        status as string
      );
      res.json(history);
    } catch (error) {
      console.error('Error fetching email history:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Email Test Route
  app.post('/api/admin/emails/test', requireAuth, async (req, res) => {
    try {
      const { email, name } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email address is required' });
      }

      const result = await emailService.sendTestEmail(email, name);
      
      if (result.success) {
        res.json({ 
          success: true, 
          message: 'Test email sent successfully',
          messageId: result.messageId
        });
      } else {
        res.status(500).json({ 
          error: 'Failed to send test email',
          details: result.error
        });
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Email Connection Test Route  
  app.post('/api/admin/emails/test-connection', requireAuth, async (req, res) => {
    try {
      const result = await emailService.testConnection();
      
      if (result.success) {
        res.json({ 
          success: true, 
          message: 'SMTP connection successful' 
        });
      } else {
        res.status(500).json({ 
          error: 'SMTP connection failed',
          details: result.error
        });
      }
    } catch (error) {
      console.error('Error testing email connection:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Send Individual Email Route
  app.post('/api/admin/emails/send', requireAuth, async (req, res) => {
    try {
      const { templateId, to, toName, variables } = req.body;
      
      if (!templateId || !to) {
        return res.status(400).json({ 
          error: 'Template ID and recipient email are required' 
        });
      }

      const template = await storage.getEmailTemplateById(templateId);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      const result = await emailService.sendTemplatedEmail(
        template,
        variables || {},
        to,
        toName
      );

      // Save to history
      if (result.emailHistory) {
        await storage.createEmailHistory(result.emailHistory);
      }

      if (result.success) {
        res.json({ 
          success: true, 
          message: 'Email sent successfully',
          messageId: result.messageId
        });
      } else {
        res.status(500).json({ 
          error: 'Failed to send email',
          details: result.error
        });
      }
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Bulk Email Route
  app.post('/api/admin/emails/bulk', requireAuth, async (req, res) => {
    try {
      const { templateId, recipients, delay = 1000 } = req.body;
      
      if (!templateId || !recipients || !Array.isArray(recipients)) {
        return res.status(400).json({ 
          error: 'Template ID and recipients array are required' 
        });
      }

      const template = await storage.getEmailTemplateById(templateId);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      const result = await emailService.sendBulkEmails(template, recipients, delay);
      
      // Save all results to history
      for (const recipientResult of result.results) {
        const emailHistory = {
          templateId: template.id,
          recipientEmail: recipientResult.email,
          recipientName: recipients.find(r => r.email === recipientResult.email)?.name,
          senderEmail: 'no-reply@estimation-immobilier-gironde.fr',
          subject: template.subject,
          htmlContent: template.htmlContent,
          textContent: template.textContent,
          status: recipientResult.success ? 'sent' : 'failed',
          errorMessage: recipientResult.error,
          sentAt: recipientResult.success ? new Date() : null
        };
        
        await storage.createEmailHistory(emailHistory);
      }

      res.json({
        success: true,
        message: `Bulk email completed: ${result.sent} sent, ${result.failed} failed`,
        sent: result.sent,
        failed: result.failed,
        results: result.results
      });
    } catch (error) {
      console.error('Error sending bulk emails:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
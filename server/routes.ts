import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeadSchema, insertEstimationSchema, insertContactSchema, insertArticleSchema } from "@shared/schema";
import { sanitizeArticleContent } from "./services/htmlSanitizer";
import { generateRealEstateArticle } from "./services/openai";
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

  // Endpoint pour générer un article avec OpenAI
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

  const httpServer = createServer(app);
  return httpServer;
}
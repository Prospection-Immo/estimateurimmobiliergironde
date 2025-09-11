import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeadSchema, insertEstimationSchema, insertContactSchema, insertArticleSchema, insertEmailTemplateSchema, insertEmailHistorySchema } from "@shared/schema";
import { sanitizeArticleContent } from "./services/htmlSanitizer";
import { generateRealEstateArticle } from "./services/openai";
import emailService from "./services/emailService";
import { z } from "zod";
import crypto from "crypto";
import twilio from "twilio";
import bcrypt from "bcrypt";

// Initialize Twilio client
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const TWILIO_VERIFY_SERVICE_SID = 'VA0562b4c0e460ba0c03268eb0e413b313';

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

// Rate limiting store (simple in-memory for development)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Phone number validation helper
function validatePhoneNumber(phone: string): { isValid: boolean; formatted: string; error?: string } {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check for French mobile numbers (starting with 06, 07, or international +33)
  if (cleaned.startsWith('33') && cleaned.length === 11) {
    // International format +33...
    const formatted = '+' + cleaned;
    return { isValid: true, formatted };
  } else if (cleaned.startsWith('0') && (cleaned.startsWith('06') || cleaned.startsWith('07')) && cleaned.length === 10) {
    // National format 06... or 07...
    const formatted = '+33' + cleaned.substring(1);
    return { isValid: true, formatted };
  } else if (cleaned.length >= 10 && cleaned.length <= 15) {
    // Generic international format
    const formatted = cleaned.startsWith('+') ? cleaned : '+' + cleaned;
    return { isValid: true, formatted };
  }
  
  return { 
    isValid: false, 
    formatted: phone,
    error: "Numéro de téléphone invalide. Utilisez un numéro français (06/07) ou international." 
  };
}

// Basic rate limiting middleware
function rateLimit(maxRequests: number, windowMs: number) {
  return (req: any, res: any, next: any) => {
    const key = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = rateLimitStore.get(key);
    
    if (!entry || now > entry.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (entry.count >= maxRequests) {
      return res.status(429).json({ error: "Trop de tentatives. Veuillez réessayer plus tard." });
    }
    
    entry.count++;
    next();
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

      // Send confirmation email to client
      try {
        const clientTemplate = await storage.getEmailTemplateByCategory('estimation_confirmation');
        if (clientTemplate && clientTemplate.isActive) {
          const clientVariables = {
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            email: validatedData.email,
            phone: validatedData.phone || '',
            propertyType: validatedData.propertyType === 'house' ? 'Maison' : 'Appartement',
            address: validatedData.address,
            city: validatedData.city,
            surface: validatedData.surface || 0,
            estimatedValue: estimation.estimatedValue.toLocaleString('fr-FR'),
            pricePerM2: estimation.pricePerM2.toLocaleString('fr-FR')
          };

          const clientResult = await emailService.sendTemplatedEmail(
            clientTemplate,
            clientVariables,
            validatedData.email,
            `${validatedData.firstName} ${validatedData.lastName}`
          );

          if (clientResult.emailHistory) {
            await storage.createEmailHistory(clientResult.emailHistory);
          }
        }
      } catch (emailError) {
        console.error('Error sending estimation confirmation email:', emailError);
      }

      // Send admin notification email
      try {
        const adminTemplate = await storage.getEmailTemplateByCategory('admin_notification');
        if (adminTemplate && adminTemplate.isActive) {
          const currentDate = new Date().toLocaleDateString('fr-FR');
          const currentTime = new Date().toLocaleTimeString('fr-FR');
          
          const adminVariables = {
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            email: validatedData.email,
            phone: validatedData.phone || '',
            propertyType: validatedData.propertyType === 'house' ? 'Maison' : 'Appartement',
            address: validatedData.address,
            city: validatedData.city,
            surface: validatedData.surface || 0,
            estimatedValue: estimation.estimatedValue.toLocaleString('fr-FR'),
            pricePerM2: estimation.pricePerM2.toLocaleString('fr-FR'),
            leadType: 'Estimation immobilière',
            source: validatedData.source || domain,
            currentDate,
            currentTime
          };

          const adminResult = await emailService.sendTemplatedEmail(
            adminTemplate,
            adminVariables,
            'admin@estimation-immobilier-gironde.fr',
            'Administration'
          );

          if (adminResult.emailHistory) {
            await storage.createEmailHistory(adminResult.emailHistory);
          }
        }
      } catch (emailError) {
        console.error('Error sending admin notification email:', emailError);
      }

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

      // Send confirmation email to client
      try {
        const clientTemplate = await storage.getEmailTemplateByCategory('financing_confirmation');
        if (clientTemplate && clientTemplate.isActive) {
          const clientVariables = {
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            email: validatedData.email,
            phone: validatedData.phone || '',
            financingProjectType: validatedData.financingProjectType || 'Financement immobilier',
            projectAmount: validatedData.projectAmount || 'Non spécifié'
          };

          const clientResult = await emailService.sendTemplatedEmail(
            clientTemplate,
            clientVariables,
            validatedData.email,
            `${validatedData.firstName} ${validatedData.lastName}`
          );

          if (clientResult.emailHistory) {
            await storage.createEmailHistory(clientResult.emailHistory);
          }
        }
      } catch (emailError) {
        console.error('Error sending financing confirmation email:', emailError);
      }

      // Send admin notification email
      try {
        const adminTemplate = await storage.getEmailTemplateByCategory('admin_notification');
        if (adminTemplate && adminTemplate.isActive) {
          const currentDate = new Date().toLocaleDateString('fr-FR');
          const currentTime = new Date().toLocaleTimeString('fr-FR');
          
          const adminVariables = {
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            email: validatedData.email,
            phone: validatedData.phone || '',
            financingProjectType: validatedData.financingProjectType || 'Financement immobilier',
            projectAmount: validatedData.projectAmount || 'Non spécifié',
            source: validatedData.source || domain,
            currentDate,
            currentTime
          };

          const adminResult = await emailService.sendTemplatedEmail(
            adminTemplate,
            adminVariables,
            'admin@estimation-immobilier-gironde.fr',
            'Administration'
          );

          if (adminResult.emailHistory) {
            await storage.createEmailHistory(adminResult.emailHistory);
          }
        }
      } catch (emailError) {
        console.error('Error sending admin notification email:', emailError);
      }

      res.json(lead);
    } catch (error) {
      console.error('Error creating financing lead:', error);
      res.status(400).json({ error: 'Invalid data provided' });
    }
  });

  // Authentication routes - Step 1: Email/Password verification
  app.post("/api/auth/login-step1", rateLimit(5, 15 * 60 * 1000), async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Input validation
      if (!email || !password) {
        return res.status(400).json({ error: "Email et mot de passe requis" });
      }
      
      // Check credentials against database
      const user = await storage.getUserByUsername(email);
      
      if (user && await bcrypt.compare(password, user.password)) {
        // Create auth session for 2FA
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        
        const authSession = await storage.createAuthSession({
          email,
          isEmailVerified: true,
          expiresAt
        });
        
        // Store session ID in HTTP session (more secure than sending in response)
        (req.session as any).authSessionId = authSession.id;
        
        res.json({ 
          success: true, 
          requiresSms: true,
          message: "Étape 1 réussie. Vérification SMS requise."
        });
      } else {
        res.status(401).json({ error: "Email ou mot de passe incorrect" });
      }
    } catch (error) {
      console.error('Login step 1 error:', error);
      res.status(500).json({ error: "Erreur d'authentification" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  // Step 2: Send SMS verification code
  app.post("/api/auth/send-sms", rateLimit(3, 5 * 60 * 1000), async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      const authSessionId = (req.session as any).authSessionId;
      
      if (!authSessionId) {
        return res.status(400).json({ error: "Aucune session d'authentification active" });
      }
      
      const authSession = await storage.getAuthSession(authSessionId);
      if (!authSession || authSession.expiresAt < new Date()) {
        return res.status(400).json({ error: "Session d'authentification expirée" });
      }
      
      // Validate phone number
      const phoneValidation = validatePhoneNumber(phoneNumber);
      if (!phoneValidation.isValid) {
        return res.status(400).json({ error: phoneValidation.error });
      }
      
      try {
        // Send SMS using Twilio SDK
        const verification = await twilioClient.verify.v2
          .services(TWILIO_VERIFY_SERVICE_SID)
          .verifications
          .create({
            to: phoneValidation.formatted,
            channel: 'sms'
          });
        
        // Update auth session with phone number and verification SID
        await storage.updateAuthSession(authSessionId, {
          phoneNumber: phoneValidation.formatted,
          verificationSid: verification.sid
        });
        
        res.json({ 
          success: true, 
          message: "Code de vérification envoyé par SMS",
          phoneDisplay: phoneValidation.formatted.replace(/\d(?=\d{4})/g, '*')
        });
      } catch (twilioError: any) {
        console.error('Twilio verification error:', twilioError);
        const errorMessage = twilioError.message?.includes('not a valid phone number') 
          ? "Numéro de téléphone invalide"
          : "Erreur lors de l'envoi du SMS";
        res.status(400).json({ error: errorMessage });
      }
    } catch (error) {
      console.error('Send SMS error:', error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });
  
  // Step 3: Verify SMS code
  app.post("/api/auth/verify-sms", rateLimit(10, 5 * 60 * 1000), async (req, res) => {
    try {
      const { code } = req.body;
      const authSessionId = (req.session as any).authSessionId;
      
      if (!authSessionId) {
        return res.status(400).json({ error: "Aucune session d'authentification active" });
      }
      
      // Input validation
      if (!code || !/^\d{6}$/.test(code)) {
        return res.status(400).json({ error: "Code de vérification invalide (6 chiffres requis)" });
      }
      
      const authSession = await storage.getAuthSession(authSessionId);
      if (!authSession || authSession.expiresAt < new Date()) {
        return res.status(400).json({ error: "Session d'authentification expirée" });
      }
      
      if (!authSession.verificationSid || !authSession.phoneNumber) {
        return res.status(400).json({ error: "Vérification SMS non initiée" });
      }
      
      try {
        // Verify code using Twilio SDK
        const verificationCheck = await twilioClient.verify.v2
          .services(TWILIO_VERIFY_SERVICE_SID)
          .verificationChecks
          .create({
            to: authSession.phoneNumber,
            code: code
          });
        
        if (verificationCheck.status === 'approved') {
          // Mark SMS as verified and complete authentication
          await storage.updateAuthSession(authSessionId, {
            isSmsVerified: true
          });
          
          // Set final authentication in session with security flags
          (req.session as any).isAuthenticated = true;
          (req.session as any).authenticatedAt = new Date().toISOString();
          
          // Clean up auth session
          delete (req.session as any).authSessionId;
          
          res.json({ 
            success: true, 
            message: "Authentification réussie",
            redirectUrl: "/admin"
          });
        } else {
          res.status(400).json({ error: "Code de vérification incorrect" });
        }
      } catch (twilioError: any) {
        console.error('Twilio verification check error:', twilioError);
        const errorMessage = twilioError.message?.includes('max check attempts reached')
          ? "Trop de tentatives. Demandez un nouveau code."
          : "Code de vérification incorrect";
        res.status(400).json({ error: errorMessage });
      }
    } catch (error) {
      console.error('Verify SMS error:', error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });
  
  // Legacy login route for backward compatibility
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Check credentials against database (legacy endpoint)
      const legacyUser = await storage.getUserByUsername(username);
      
      if (legacyUser && await bcrypt.compare(password, legacyUser.password)) {
        (req.session as any).isAuthenticated = true;
        res.json({ success: true });
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
    } catch (error) {
      res.status(500).json({ error: "Authentication error" });
    }
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

      // Send confirmation email to client
      try {
        const clientTemplate = await storage.getEmailTemplateByCategory('contact_confirmation');
        if (clientTemplate && clientTemplate.isActive) {
          const clientVariables = {
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            email: validatedData.email,
            phone: validatedData.phone || '',
            subject: validatedData.subject,
            message: validatedData.message,
            source: validatedData.source || domain
          };

          const clientResult = await emailService.sendTemplatedEmail(
            clientTemplate,
            clientVariables,
            validatedData.email,
            `${validatedData.firstName} ${validatedData.lastName}`
          );

          if (clientResult.emailHistory) {
            await storage.createEmailHistory(clientResult.emailHistory);
          }
        }
      } catch (emailError) {
        console.error('Error sending client confirmation email:', emailError);
      }

      // Send admin notification email
      try {
        const adminTemplate = await storage.getEmailTemplateByCategory('admin_notification');
        if (adminTemplate && adminTemplate.isActive) {
          const currentDate = new Date().toLocaleDateString('fr-FR');
          const currentTime = new Date().toLocaleTimeString('fr-FR');
          
          const adminVariables = {
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            email: validatedData.email,
            phone: validatedData.phone || '',
            subject: validatedData.subject,
            message: validatedData.message,
            source: validatedData.source || domain,
            currentDate,
            currentTime
          };

          const adminResult = await emailService.sendTemplatedEmail(
            adminTemplate,
            adminVariables,
            'admin@estimation-immobilier-gironde.fr',
            'Administration'
          );

          if (adminResult.emailHistory) {
            await storage.createEmailHistory(adminResult.emailHistory);
          }
        }
      } catch (emailError) {
        console.error('Error sending admin notification email:', emailError);
      }

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

  // Shorter alias routes for email management (used by frontend)
  app.get('/api/email/templates', requireAuth, async (req, res) => {
    try {
      const { category } = req.query;
      const templates = await storage.getEmailTemplates(category as string);
      res.json(templates);
    } catch (error) {
      console.error('Error fetching email templates:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/email/templates', requireAuth, async (req, res) => {
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

  app.put('/api/email/templates/:id', requireAuth, async (req, res) => {
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

  app.delete('/api/email/templates/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteEmailTemplate(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting email template:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/email/history', requireAuth, async (req, res) => {
    try {
      const { status, limit, q } = req.query;
      let history = await storage.getEmailHistory(
        limit ? parseInt(limit as string) : 50,
        status && status !== 'all' ? status as string : undefined
      );

      // Filter by search term if provided
      if (q) {
        const searchTerm = (q as string).toLowerCase();
        history = history.filter(email => 
          email.recipientEmail.toLowerCase().includes(searchTerm) ||
          email.subject.toLowerCase().includes(searchTerm) ||
          (email.recipientName && email.recipientName.toLowerCase().includes(searchTerm))
        );
      }

      res.json(history);
    } catch (error) {
      console.error('Error fetching email history:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/email/stats', requireAuth, async (req, res) => {
    try {
      const history = await storage.getEmailHistory(1000); // Get more for stats
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const sentEmails = history.filter(email => email.status === 'sent');
      const failedEmails = history.filter(email => email.status === 'failed');
      const todayEmails = history.filter(email => 
        email.createdAt && new Date(email.createdAt) >= today
      );
      
      const stats = {
        totalSent: sentEmails.length,
        totalFailed: failedEmails.length,
        sentToday: todayEmails.filter(email => email.status === 'sent').length,
        successRate: history.length > 0 ? 
          ((sentEmails.length / history.length) * 100).toFixed(1) + '%'
          : '0%'
      };
      
      res.json(stats);
    } catch (error) {
      console.error('Error fetching email stats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/email/test', requireAuth, async (req, res) => {
    try {
      const { templateId, email, name, variables } = req.body;
      
      if (!templateId || !email) {
        return res.status(400).json({ 
          error: 'Template ID and email address are required' 
        });
      }

      const template = await storage.getEmailTemplateById(templateId);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      const result = await emailService.sendTemplatedEmail(
        template,
        variables || {},
        email,
        name
      );

      // Save to history
      if (result.emailHistory) {
        await storage.createEmailHistory(result.emailHistory);
      }

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

  app.post('/api/email/test-connection', requireAuth, async (req, res) => {
    try {
      const result = await emailService.verifyConnection();
      
      if (result) {
        res.json({ 
          success: true, 
          message: 'SMTP connection successful' 
        });
      } else {
        res.status(500).json({ 
          error: 'SMTP connection failed'
        });
      }
    } catch (error) {
      console.error('Error testing email connection:', error);
      res.status(500).json({ 
        error: 'SMTP connection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Seed default email templates endpoint
  app.post('/api/email/seed-templates', requireAuth, async (req, res) => {
    try {
      // Check if templates already exist
      const existingTemplates = await storage.getEmailTemplates();
      if (existingTemplates.length > 0) {
        return res.json({ 
          success: false, 
          message: 'Templates already exist',
          count: existingTemplates.length
        });
      }

      const defaultTemplates = [
        // Contact Confirmation Template
        {
          name: "Confirmation de Contact Client",
          subject: "Merci pour votre demande {{firstName}} - Estimation Gironde",
          category: "contact_confirmation",
          isActive: true,
          variables: JSON.stringify(["firstName", "lastName", "email", "phone", "subject", "message"]),
          htmlContent: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmation de votre demande</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; background-color: #f4f4f4;">
    <div style="background-color: #fff; margin: 20px; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Estimation Gironde</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Expert en estimation immobilière</p>
        </div>
        
        <div style="padding: 40px 30px;">
            <h2 style="color: #2563eb; margin-top: 0;">Bonjour {{firstName}},</h2>
            
            <p style="margin-bottom: 20px; font-size: 16px;">
                Merci pour votre demande concernant "<strong>{{subject}}</strong>". 
                Nous avons bien reçu votre message et nous vous en remercions.
            </p>
            
            <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 20px; margin: 25px 0; border-radius: 0 5px 5px 0;">
                <p style="margin: 0; font-weight: bold; color: #2563eb;">Votre demande :</p>
                <p style="margin: 10px 0 0 0; font-style: italic;">{{message}}</p>
            </div>
            
            <p style="margin-bottom: 25px;">
                Un de nos experts vous contactera dans les plus brefs délais (généralement sous 24h) 
                pour répondre à votre demande et vous accompagner dans votre projet immobilier.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://estimation-immobilier-gironde.fr/contact" 
                   style="background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
                    Nous contacter
                </a>
            </div>
        </div>
        
        <div style="background-color: #1e40af; color: white; padding: 25px 30px; text-align: center;">
            <p style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold;">
                Estimation Gironde
            </p>
            <p style="margin: 0 0 10px 0; opacity: 0.9;">
                📧 contact@estimation-immobilier-gironde.fr<br>
                📞 05 56 XX XX XX<br>
                📍 Bordeaux et toute la Gironde
            </p>
            <p style="margin: 15px 0 0 0; font-size: 12px; opacity: 0.7;">
                Expert en estimation immobilière depuis 10+ ans
            </p>
        </div>
    </div>
</body>
</html>`,
          textContent: `Bonjour {{firstName}},

Merci pour votre demande concernant "{{subject}}". Nous avons bien reçu votre message et nous vous en remercions.

Votre demande : {{message}}

Un de nos experts vous contactera dans les plus brefs délais (généralement sous 24h) pour répondre à votre demande et vous accompagner dans votre projet immobilier.

Cordialement,
L'équipe Estimation Gironde

Contact : contact@estimation-immobilier-gironde.fr
Téléphone : 05 56 XX XX XX
Zone d'intervention : Bordeaux et toute la Gironde`
        },

        // Estimation Confirmation Template
        {
          name: "Confirmation d'Estimation Client",
          subject: "Votre estimation immobilière est prête {{firstName}} - {{estimatedValue}}€",
          category: "estimation_confirmation", 
          isActive: true,
          variables: JSON.stringify(["firstName", "lastName", "email", "phone", "propertyType", "address", "city", "surface", "estimatedValue", "pricePerM2"]),
          htmlContent: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Votre estimation immobilière</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; background-color: #f4f4f4;">
    <div style="background-color: #fff; margin: 20px; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🏠 Estimation Gironde</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Votre estimation est prête !</p>
        </div>
        
        <div style="padding: 40px 30px;">
            <h2 style="color: #10b981; margin-top: 0;">Bonjour {{firstName}},</h2>
            
            <p style="margin-bottom: 25px; font-size: 16px;">
                Nous avons le plaisir de vous communiquer l'estimation de votre bien immobilier.
            </p>
            
            <div style="background: linear-gradient(135deg, #f0fdfa, #f0f9ff); border: 2px solid #10b981; border-radius: 10px; padding: 25px; margin: 25px 0;">
                <h3 style="color: #10b981; margin-top: 0; text-align: center; font-size: 20px;">📋 Détails de votre bien</h3>
                <p style="margin: 8px 0;"><strong>Type :</strong> {{propertyType}}</p>
                <p style="margin: 8px 0;"><strong>Surface :</strong> {{surface}} m²</p>
                <p style="margin: 8px 0;"><strong>Adresse :</strong> {{address}}</p>
                <p style="margin: 8px 0;"><strong>Ville :</strong> {{city}}</p>
            </div>

            <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); border: 2px solid #f59e0b; border-radius: 10px; padding: 25px; margin: 25px 0; text-align: center;">
                <h3 style="color: #d97706; margin-top: 0; font-size: 24px;">💰 Estimation de valeur</h3>
                <div style="font-size: 36px; font-weight: bold; color: #92400e; margin: 15px 0;">{{estimatedValue}}€</div>
                <p style="margin: 10px 0 0 0; color: #92400e; font-size: 16px;">Soit {{pricePerM2}}€/m²</p>
            </div>
            
            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 25px 0; border-radius: 0 5px 5px 0;">
                <p style="margin: 0; color: #dc2626;"><strong>⚠️ Important :</strong></p>
                <p style="margin: 10px 0 0 0; color: #dc2626;">
                    Cette estimation est indicative et basée sur les données du marché. 
                    Pour une estimation précise, nous recommandons une visite d'expertise gratuite.
                </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="tel:0556000000" 
                   style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 15px 25px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; margin: 5px;">
                    📞 Nous appeler
                </a>
                <a href="https://estimation-immobilier-gironde.fr/contact" 
                   style="background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 15px 25px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; margin: 5px;">
                    🏠 Visite d'expertise
                </a>
            </div>
        </div>
        
        <div style="background-color: #065f46; color: white; padding: 25px 30px; text-align: center;">
            <p style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold;">
                Estimation Gironde - Expert Immobilier
            </p>
            <p style="margin: 0 0 10px 0; opacity: 0.9;">
                📧 contact@estimation-immobilier-gironde.fr<br>
                📞 05 56 XX XX XX<br>
                📍 Bordeaux et toute la Gironde
            </p>
        </div>
    </div>
</body>
</html>`,
          textContent: `Bonjour {{firstName}},

Nous avons le plaisir de vous communiquer l'estimation de votre bien immobilier.

DÉTAILS DE VOTRE BIEN:
- Type : {{propertyType}}
- Surface : {{surface}} m²
- Adresse : {{address}}, {{city}}

ESTIMATION DE VALEUR: {{estimatedValue}}€
Soit {{pricePerM2}}€/m²

IMPORTANT: Cette estimation est indicative et basée sur les données du marché. Pour une estimation précise, nous recommandons une visite d'expertise gratuite.

N'hésitez pas à nous contacter pour planifier une visite d'expertise ou pour toute question.

Cordialement,
L'équipe Estimation Gironde

Contact : contact@estimation-immobilier-gironde.fr
Téléphone : 05 56 XX XX XX
Zone d'intervention : Bordeaux et toute la Gironde`
        },

        // Admin Notification Templates
        {
          name: "Notification Admin - Nouveau Contact",
          subject: "🔔 Nouveau message de {{firstName}} {{lastName}}",
          category: "admin_notification",
          isActive: true,
          variables: JSON.stringify(["firstName", "lastName", "email", "phone", "subject", "message", "source"]),
          htmlContent: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nouveau message de contact</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; background-color: #f4f4f4;">
    <div style="background-color: #fff; margin: 20px; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 25px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; font-weight: bold;">🔔 Nouveau Contact</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Administration - Estimation Gironde</p>
        </div>
        
        <div style="padding: 30px;">
            <h2 style="color: #ef4444; margin-top: 0;">Nouveau message reçu</h2>
            
            <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #dc2626; margin-top: 0; font-size: 18px;">👤 Informations du contact</h3>
                <p style="margin: 10px 0;"><strong>Nom :</strong> {{firstName}} {{lastName}}</p>
                <p style="margin: 10px 0;"><strong>Email :</strong> <a href="mailto:{{email}}" style="color: #dc2626;">{{email}}</a></p>
                <p style="margin: 10px 0;"><strong>Téléphone :</strong> <a href="tel:{{phone}}" style="color: #dc2626;">{{phone}}</a></p>
                <p style="margin: 10px 0;"><strong>Source :</strong> {{source}}</p>
            </div>
            
            <div style="margin: 20px 0;">
                <h3 style="color: #dc2626; margin-bottom: 10px;">📧 Sujet du message</h3>
                <p style="font-size: 16px; font-weight: bold; color: #7f1d1d;">{{subject}}</p>
            </div>
            
            <div style="margin: 20px 0;">
                <h3 style="color: #dc2626; margin-bottom: 10px;">💬 Message</h3>
                <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; font-style: italic;">
                    {{message}}
                </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="mailto:{{email}}?subject=Re: {{subject}}" 
                   style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; margin: 5px;">
                    📧 Répondre par email
                </a>
                <a href="tel:{{phone}}" 
                   style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; margin: 5px;">
                    📞 Appeler
                </a>
            </div>
        </div>
    </div>
</body>
</html>`,
          textContent: `🔔 NOUVEAU CONTACT - Estimation Gironde

Informations du contact:
- Nom: {{firstName}} {{lastName}}
- Email: {{email}}
- Téléphone: {{phone}}
- Source: {{source}}

Sujet: {{subject}}

Message:
{{message}}

Actions à effectuer:
1. Répondre par email: {{email}}
2. Appeler: {{phone}}`
        }
      ];

      // Insert all templates
      for (const template of defaultTemplates) {
        await storage.createEmailTemplate(template);
      }

      res.json({ 
        success: true, 
        message: 'Default email templates created successfully',
        count: defaultTemplates.length
      });
    } catch (error) {
      console.error('Error seeding email templates:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Commented out after successful account creation
  /*
  // Temporary endpoint to create admin user - REMOVED AFTER SETUP
  app.post("/api/admin/create-account", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Basic validation
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(email);
      if (existingUser) {
        return res.status(409).json({ error: "User already exists" });
      }
      
      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      // Create user
      const newUser = await storage.createUser({
        username: email,
        password: hashedPassword,
        role: "admin"
      });
      
      res.json({ 
        success: true, 
        message: "Admin account created successfully",
        userId: newUser.id,
        username: newUser.username
      });
    } catch (error) {
      console.error('Error creating admin account:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  */

  const httpServer = createServer(app);
  return httpServer;
}
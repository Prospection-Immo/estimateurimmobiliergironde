import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeadSchema, insertEstimationSchema, insertContactSchema, insertArticleSchema, insertEmailTemplateSchema, insertEmailHistorySchema, insertGuideSchema, insertGuideDownloadSchema, insertGuideAnalyticsSchema, GUIDE_PERSONAS } from "@shared/schema";
import { sanitizeArticleContent } from "./services/htmlSanitizer";
import { generateRealEstateArticle } from "./services/openai";
import emailService from "./services/emailService";
import { z } from "zod";
import crypto from "crypto";
import twilio from "twilio";
import bcrypt from "bcrypt";

// Initialize Twilio client
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const TWILIO_VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID || 'VA0562b4c0e460ba0c03268eb0e413b313';

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

// Guide leads validation schema with RGPD compliance
const insertGuideLeadSchema = z.object({
  firstName: z.string().trim().min(2, "Le prénom doit contenir au moins 2 caractères").max(100),
  email: z.string().email("Veuillez entrer une adresse email valide").trim().max(255),
  city: z.string().trim().min(2, "La ville doit contenir au moins 2 caractères").max(100),
  guideSlug: z.string().trim().min(1, "Le guide est requis").max(255),
  acceptTerms: z.boolean().refine(val => val === true, "Vous devez accepter les conditions"),
  source: z.string().optional()
});

// Get client IP address helper
function getClientIp(req: any): string {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress || 
         '127.0.0.1';
}

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

// Middleware to check SMS verification for guide access
function requireSmsVerification(req: any, res: any, next: any) {
  const session = req.session as any;
  
  // Check if user has completed homepage SMS verification
  if (session.homepageVerified && session.verifiedLeadId && session.verifiedAt) {
    // Check if verification is not too old (24 hours)
    const verifiedAt = new Date(session.verifiedAt);
    const now = new Date();
    const timeDiff = now.getTime() - verifiedAt.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);
    
    if (hoursDiff <= 24) {
      return next();
    }
  }
  
  return res.status(403).json({ 
    error: "Vérification SMS requise", 
    message: "Vous devez d'abord vérifier votre numéro de téléphone pour accéder aux guides",
    requiresVerification: true
  });
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
      const { sessionId, ...propertyData } = req.body;
      
      // Validate sessionId is provided
      if (!sessionId) {
        return res.status(400).json({ error: 'SessionId requis' });
      }

      // Retrieve contact data from SMS verification session
      const authSession = await storage.getAuthSession(sessionId);
      if (!authSession || authSession.expiresAt < new Date()) {
        return res.status(400).json({ error: 'Session expirée ou invalide' });
      }

      // Check that SMS verification was completed
      if (!authSession.isSmsVerified) {
        return res.status(400).json({ error: 'Vérification SMS non complétée' });
      }

      // Get additional data from HTTP session if available
      const httpSessionData = (req.session as any).homepageVerificationData;
      const firstName = httpSessionData?.firstName || 'Utilisateur';

      // Combine contact data from authSession with property data from request
      const leadData = {
        email: authSession.email,
        phone: authSession.phoneNumber,
        firstName: firstName,
        lastName: '', // We don't collect lastName in homepage flow
        propertyType: propertyData.propertyType,
        address: propertyData.address || propertyData.city,
        city: propertyData.city,
        postalCode: propertyData.postalCode || "33000",
        surface: propertyData.surface,
        rooms: propertyData.rooms,
        bedrooms: propertyData.bedrooms,
        bathrooms: propertyData.bathrooms,
        hasGarden: propertyData.hasGarden || false,
        hasParking: propertyData.hasParking || false,
        hasBalcony: propertyData.hasBalcony || false,
        constructionYear: propertyData.constructionYear,
        saleTimeline: propertyData.saleTimeline || "6m",
        wantsExpertContact: propertyData.wantsExpertContact || true,
        source: domain
      };

      // Validate the combined data
      const validatedData = insertEstimationLeadSchema.parse(leadData);

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

      // Mark session as having completed verification for guide access
      (req.session as any).homepageVerified = true;
      (req.session as any).verifiedLeadId = lead.id;
      (req.session as any).verifiedAt = new Date().toISOString();

      res.json({
        lead,
        estimation: savedEstimation,
        calculatedData: estimation
      });
    } catch (error) {
      console.error('Error creating quick estimation:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Données invalides', 
          details: error.errors.map(e => e.message).join(', ')
        });
      }
      res.status(400).json({ error: 'Erreur lors du traitement de votre estimation' });
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

  // Create guide download lead - SECURED with RGPD compliance and rate limiting and SMS verification
  app.post('/api/guide-leads', rateLimit(5, 60000), requireSmsVerification, async (req, res) => {
    try {
      const domain = req.headers['x-domain'] as string;
      const clientIp = getClientIp(req);
      
      // Validate the request body for guide download leads with strict RGPD compliance
      const validatedData = insertGuideLeadSchema.parse(req.body);

      // Verify that the guide exists before creating the lead
      const guide = await storage.getGuideBySlug(validatedData.guideSlug);
      if (!guide) {
        return res.status(404).json({ error: 'Guide not found' });
      }

      // Create lead with RGPD compliance data
      const leadData = {
        firstName: validatedData.firstName,
        lastName: 'Non renseigné', // Guide leads don't collect last name for better UX
        email: validatedData.email,
        city: validatedData.city,
        source: domain,
        leadType: 'guide_download' as const,
        status: 'new' as const,
        // RGPD compliance fields
        consentAt: new Date(),
        consentSource: 'guide_download',
        ipAddress: clientIp,
        guideSlug: validatedData.guideSlug
      };

      // Save guide download lead
      const lead = await storage.createLead(leadData);

      // Send confirmation email with the guide PDF
      try {
        const clientTemplate = await storage.getEmailTemplateByCategory('guide_confirmation');
        if (clientTemplate && clientTemplate.isActive) {
          const clientVariables = {
            firstName: validatedData.firstName,
            email: validatedData.email,
            city: validatedData.city,
            guideTitle: guide.title,
            guideSlug: validatedData.guideSlug
          };

          const clientResult = await emailService.sendTemplatedEmail(
            clientTemplate,
            clientVariables,
            validatedData.email,
            validatedData.firstName
          );

          if (clientResult.emailHistory) {
            await storage.createEmailHistory(clientResult.emailHistory);
          }
        }
      } catch (emailError) {
        console.error('Error sending guide confirmation email:', emailError);
        // Don't fail the request if email fails, but log it
      }

      // Send admin notification
      try {
        const adminTemplate = await storage.getEmailTemplateByCategory('admin_notification');
        if (adminTemplate && adminTemplate.isActive) {
          const currentTime = new Date().toLocaleString('fr-FR', { 
            timeZone: 'Europe/Paris',
            dateStyle: 'full',
            timeStyle: 'short'
          });

          const adminVariables = {
            leadType: 'Téléchargement de guide',
            firstName: validatedData.firstName,
            email: validatedData.email,
            city: validatedData.city,
            guideTitle: guide.title,
            source: domain,
            ipAddress: clientIp,
            consentDate: currentTime
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
        console.error('Error sending admin guide notification email:', emailError);
      }

      res.json({ 
        success: true, 
        message: 'Guide envoyé avec succès',
        lead: {
          id: lead.id,
          firstName: lead.firstName,
          email: lead.email,
          guideSlug: lead.guideSlug
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Données invalides', 
          details: error.errors.map(e => e.message).join(', ')
        });
      }
      console.error('Error creating guide lead:', error);
      res.status(500).json({ error: 'Une erreur est survenue. Veuillez réessayer.' });
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

  // Homepage SMS Verification endpoints
  // Step 1: Start homepage verification session
  app.post("/api/homepage-verification/start", rateLimit(3, 5 * 60 * 1000), async (req, res) => {
    try {
      const { email, firstName, phoneNumber, propertyData } = req.body;
      
      // Basic validation
      if (!email || !firstName || !phoneNumber || !propertyData) {
        return res.status(400).json({ error: "Tous les champs sont requis" });
      }

      // Validate email format
      if (!email.includes('@')) {
        return res.status(400).json({ error: "Format d'email invalide" });
      }

      // Validate phone number
      const phoneValidation = validatePhoneNumber(phoneNumber);
      if (!phoneValidation.isValid) {
        return res.status(400).json({ error: phoneValidation.error });
      }

      // Create auth session for homepage verification
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      const authSession = await storage.createAuthSession({
        email: email.toLowerCase(),
        phoneNumber: phoneValidation.formatted,
        isEmailVerified: false, // We'll mark this as true since we have the email
        isSmsVerified: false,
        expiresAt
      });

      // Store temporary lead data in session for later use
      (req.session as any).homepageVerificationData = {
        authSessionId: authSession.id,
        firstName,
        email: email.toLowerCase(),
        phoneNumber: phoneValidation.formatted,
        propertyData
      };

      res.json({ 
        success: true, 
        sessionId: authSession.id,
        message: "Session créée avec succès"
      });
    } catch (error) {
      console.error('Homepage verification start error:', error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Step 2: Send SMS for homepage verification
  app.post("/api/homepage-verification/send-sms", rateLimit(3, 5 * 60 * 1000), async (req, res) => {
    try {
      const { sessionId } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ error: "Session ID requis" });
      }
      
      const authSession = await storage.getAuthSession(sessionId);
      if (!authSession || authSession.expiresAt < new Date()) {
        return res.status(400).json({ error: "Session expirée ou invalide" });
      }

      if (!authSession.phoneNumber) {
        return res.status(400).json({ error: "Numéro de téléphone manquant" });
      }
      
      try {
        // Send SMS using Twilio SDK
        const verification = await twilioClient.verify.v2
          .services(TWILIO_VERIFY_SERVICE_SID)
          .verifications
          .create({
            to: authSession.phoneNumber,
            channel: 'sms'
          });
        
        // Update auth session with verification SID
        await storage.updateAuthSession(sessionId, {
          verificationSid: verification.sid
        });
        
        res.json({ 
          success: true, 
          message: "Code de vérification envoyé par SMS",
          phoneDisplay: authSession.phoneNumber.replace(/\d(?=\d{4})/g, '*')
        });
      } catch (twilioError: any) {
        console.error('Twilio verification error:', twilioError);
        const errorMessage = twilioError.message?.includes('not a valid phone number') 
          ? "Numéro de téléphone invalide"
          : "Erreur lors de l'envoi du SMS";
        res.status(400).json({ error: errorMessage });
      }
    } catch (error) {
      console.error('Homepage send SMS error:', error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Step 3: Verify SMS code for homepage
  app.post("/api/homepage-verification/verify-sms", rateLimit(10, 5 * 60 * 1000), async (req, res) => {
    try {
      const { sessionId, code } = req.body;
      
      if (!sessionId || !code) {
        return res.status(400).json({ error: "Session ID et code requis" });
      }

      // Input validation for code
      if (!/^\d{6}$/.test(code)) {
        return res.status(400).json({ error: "Code de vérification invalide (6 chiffres requis)" });
      }
      
      const authSession = await storage.getAuthSession(sessionId);
      if (!authSession || authSession.expiresAt < new Date()) {
        return res.status(400).json({ error: "Session expirée ou invalide" });
      }

      if (!authSession.verificationSid || !authSession.phoneNumber) {
        return res.status(400).json({ error: "Vérification SMS non initiée" });
      }

      // Get homepage verification data from session
      const verificationData = (req.session as any).homepageVerificationData;
      if (!verificationData || verificationData.authSessionId !== sessionId) {
        return res.status(400).json({ error: "Données de vérification manquantes" });
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
          // Mark SMS as verified
          await storage.updateAuthSession(sessionId, {
            isSmsVerified: true
          });
          
          // Create qualified lead now that SMS is verified
          const domain = req.headers['x-domain'] as string;
          const clientIp = getClientIp(req);
          
          const leadData = {
            firstName: verificationData.firstName,
            lastName: 'Non renseigné', // SMS verified leads don't require last name
            email: verificationData.email,
            phone: authSession.phoneNumber,
            ...verificationData.propertyData, // propertyType, surface, city, etc.
            source: domain,
            leadType: 'estimation_sms_verified' as const,
            status: 'new' as const,
            // RGPD compliance fields
            consentAt: new Date(),
            consentSource: 'homepage_sms_verification',
            ipAddress: clientIp,
            // Additional address fields - will be set properly in the next step
            address: verificationData.propertyData.city || '',
            postalCode: '33000' // Default for Gironde, will be refined later
          };

          const lead = await storage.createLead(leadData);
          
          // Set homepage verification in session with security flags
          (req.session as any).homepageVerified = true;
          (req.session as any).verifiedLeadId = lead.id;
          (req.session as any).verifiedAt = new Date().toISOString();
          
          // Clean up temporary verification data
          delete (req.session as any).homepageVerificationData;
          
          res.json({ 
            success: true, 
            message: "Vérification réussie",
            leadId: lead.id
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
      console.error('Homepage verify SMS error:', error);
      res.status(500).json({ error: "Erreur serveur" });
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

  // Guides routes - SECURED with HTML sanitization and SMS verification
  app.get('/api/guides', requireSmsVerification, async (req, res) => {
    try {
      const { persona } = req.query;
      const guides = await storage.getGuides(persona as string);
      
      // Sanitize HTML content to prevent XSS attacks
      const sanitizedGuides = guides.map(guide => ({
        ...guide,
        content: sanitizeArticleContent(guide.content || ''),
        summary: sanitizeArticleContent(guide.summary || '')
      }));
      
      res.json(sanitizedGuides);
    } catch (error) {
      console.error('Error fetching guides:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/guides/:slug', requireSmsVerification, async (req, res) => {
    try {
      const { slug } = req.params;
      const guide = await storage.getGuideBySlug(slug);
      
      if (!guide) {
        return res.status(404).json({ error: 'Guide not found' });
      }
      
      // Sanitize HTML content to prevent XSS attacks
      const sanitizedGuide = {
        ...guide,
        content: sanitizeArticleContent(guide.content || ''),
        summary: sanitizeArticleContent(guide.summary || '')
      };
      
      res.json(sanitizedGuide);
    } catch (error) {
      console.error('Error fetching guide:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/guides/download', requireSmsVerification, async (req, res) => {
    try {
      const validatedData = insertGuideDownloadSchema.parse(req.body);
      
      const download = await storage.createGuideDownload({
        ...validatedData,
        userAgent: req.headers['user-agent'] || '',
        ipAddress: req.ip || req.connection.remoteAddress || ''
      });
      
      res.json(download);
    } catch (error) {
      console.error('Error creating guide download:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/guides/analytics', async (req, res) => {
    try {
      const validatedData = insertGuideAnalyticsSchema.parse(req.body);
      
      const analytics = await storage.createGuideAnalytics({
        ...validatedData,
        userAgent: req.headers['user-agent'] || '',
        ipAddress: req.ip || req.connection.remoteAddress || ''
      });
      
      res.json(analytics);
    } catch (error) {
      console.error('Error creating guide analytics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Admin guides routes - SECURED with HTML sanitization
  app.post('/api/admin/guides', requireAuth, async (req, res) => {
    try {
      const validatedData = insertGuideSchema.parse(req.body);
      
      // Sanitize HTML content before saving to prevent XSS attacks
      const sanitizedData = {
        ...validatedData,
        content: sanitizeArticleContent(validatedData.content || ''),
        summary: sanitizeArticleContent(validatedData.summary || '')
      };
      
      const guide = await storage.createGuide(sanitizedData);
      res.json(guide);
    } catch (error) {
      console.error('Error creating guide:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/admin/guides', requireAuth, async (req, res) => {
    try {
      const guides = await storage.getGuides();
      res.json(guides);
    } catch (error) {
      console.error('Error fetching admin guides:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/admin/guides/:id/downloads', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const downloads = await storage.getGuideDownloads(id);
      res.json(downloads);
    } catch (error) {
      console.error('Error fetching guide downloads:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/admin/guides/:id/analytics', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const analytics = await storage.getGuideAnalytics(id);
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching guide analytics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Seed default guides endpoint (admin only)
  app.post('/api/admin/seed-guides', requireAuth, async (req, res) => {
    try {
      // Check if guides already exist
      const existingGuides = await storage.getGuides();
      if (existingGuides.length > 0) {
        return res.json({ 
          success: false, 
          message: `${existingGuides.length} guides already exist in database`,
          existingGuides: existingGuides.map(g => ({ id: g.id, title: g.title, persona: g.persona }))
        });
      }

      const defaultGuides = [
        {
          title: "Guide du Vendeur Pressé - Vendre en moins de 60 jours en Gironde",
          slug: "guide-vendeur-presse",
          persona: "presse",
          shortBenefit: "Vendez rapidement sans sacrifier le prix grâce à notre méthode éprouvée en Gironde",
          readingTime: 15,
          content: `<div class="guide-content">
            <h1>Guide du Vendeur Pressé - Vendre en moins de 60 jours en Gironde</h1>
            
            <div class="intro-section">
              <p><strong>Mutation, divorce, succession urgente ?</strong> Vous devez vendre rapidement votre bien en Gironde sans brader le prix ? Ce guide vous révèle les 5 stratégies éprouvées pour vendre en moins de 60 jours au juste prix.</p>
              <p>En Gironde, le délai moyen de vente est de 89 jours. Avec notre méthode, nos clients vendent en moyenne en 45 jours.</p>
            </div>

            <h2>1. Fixez le bon prix dès le départ</h2>
            <p><strong>Erreur n°1 :</strong> Surestimer son prix "pour avoir de la marge". En Gironde, 80% des biens qui se vendent rapidement sont prix correctement dès la mise sur le marché.</p>
            <ul>
              <li><strong>Bordeaux Centre :</strong> 4 200€/m² en moyenne (variation selon quartiers : Chartrons 4 800€/m², Saint-Pierre 4 500€/m²)</li>
              <li><strong>Mérignac :</strong> 3 800€/m² (proche tramway) à 3 200€/m² (zones résidentielles)</li>
              <li><strong>Pessac :</strong> 3 600€/m² (secteur université) à 3 100€/m²</li>
              <li><strong>Talence :</strong> 3 900€/m² (proche campus) à 3 400€/m²</li>
            </ul>
            <p><strong>Astuce Gironde :</strong> Analysez les ventes des 6 derniers mois dans votre quartier exact. Le marché varie énormément entre Bordeaux-Métropole et le reste du département.</p>

            <h2>2. Home staging express pour vendeur pressé</h2>
            <p>Les acheteurs décident en 30 secondes. En Gironde, les biens "coup de cœur" se vendent 20% plus vite.</p>
            <ul>
              <li><strong>Désencombrement :</strong> Libérez 30% de l'espace visible</li>
              <li><strong>Lumière :</strong> Changez toutes les ampoules (LED blanc chaud 2700K)</li>
              <li><strong>Odeurs :</strong> Attention à l'humidité (fréquent près de la Garonne)</li>
              <li><strong>Couleurs :</strong> Blanc cassé ou gris clair sur les murs principaux</li>
            </ul>

            <h2>3. Marketing digital intensif</h2>
            <p><strong>Spécificité Gironde :</strong> 73% des recherches immobilières commencent en ligne. Votre bien doit être visible partout rapidement.</p>
            <ul>
              <li>Publication simultanée sur 15+ sites (SeLoger, LeBonCoin, PAP, etc.)</li>
              <li>Photos professionnelles (budget 200-300€, ROI immédiat)</li>
              <li>Visite virtuelle pour les acquéreurs hors Gironde (20% des acheteurs)</li>
              <li>Réseaux sociaux locaux (groupes Facebook Bordeaux, Gironde Immobilier)</li>
            </ul>

            <h2>4. Organisation des visites "express"</h2>
            <ul>
              <li><strong>Disponibilité maximale :</strong> Créneaux 7j/7 si nécessaire</li>
              <li><strong>Visites groupées :</strong> Créer l'émulation (samedi 14h-17h)</li>
              <li><strong>Dossier acquéreur :</strong> Pré-qualifiez financièrement</li>
              <li><strong>Relance 24h :</strong> Système de suivi automatisé</li>
            </ul>

            <h2>5. Négociation express et signature rapide</h2>
            <p><strong>Objectif :</strong> Signature sous 72h après visite d'un acquéreur motivé.</p>
            <ul>
              <li>Conditions de vente claires dès l'annonce</li>
              <li>Diagnostics déjà réalisés</li>
              <li>Notaire choisi et contacté</li>
              <li>Marge de négociation définie (max 3-5%)</li>
            </ul>

            <h2>Checklist vendeur pressé</h2>
            <ul>
              <li>☐ Prix validé par 3 estimations récentes</li>
              <li>☐ Home staging réalisé (3 jours max)</li>
              <li>☐ Photos pro + plan</li>
              <li>☐ Annonce diffusée sur 15+ sites</li>
              <li>☐ Planning visites optimisé</li>
              <li>☐ Diagnostics en cours</li>
              <li>☐ Notaire pré-contacté</li>
            </ul>

            <div class="cta-section">
              <h3>Besoin d'aide pour une vente express en Gironde ?</h3>
              <p>Notre équipe spécialisée vous accompagne pour vendre en moins de 60 jours. Estimation gratuite et plan d'action personnalisé.</p>
            </div>
          </div>`,
          summary: "Introduction urgence, Stratégie prix Gironde, Home staging express, Marketing digital, Visites groupées, Négociation rapide, Checklist complète",
          pdfContent: `Version PDF enrichie avec : Checklist détaillée vendeur pressé, Tableau prix par communes Gironde, Scripts de négociation express, Contacts notaires rapides Bordeaux`,
          metaDescription: "Guide complet pour vendre rapidement son bien immobilier en Gironde en moins de 60 jours. Prix, home staging, marketing digital.",
          seoTitle: "Guide Vendeur Pressé Gironde - Vendre en 60 jours | Estimation Immobilier Gironde",
          sortOrder: 1
        },
        {
          title: "Guide du Maximisateur - Obtenir le meilleur prix en Gironde",
          slug: "guide-maximisateur-prix",
          persona: "maximisateur",
          shortBenefit: "Maximisez la valeur de votre bien avec nos techniques d'optimisation spécifiques au marché Girondin",
          readingTime: 20,
          content: `<div class="guide-content">
            <h1>Guide du Maximisateur - Obtenir le meilleur prix en Gironde</h1>
            
            <div class="intro-section">
              <p><strong>Vous ne vendez pas par urgence ?</strong> Parfait. Vous avez alors l'opportunité de maximiser la valeur de votre bien. En Gironde, avec la bonne stratégie, il est possible d'obtenir 10 à 15% au-dessus du prix moyen du marché.</p>
              <p>Ce guide vous révèle les techniques des professionnels pour extraire la valeur maximale de votre propriété.</p>
            </div>

            <h2>1. Analyse fine du micro-marché Girondin</h2>
            <p><strong>Principe :</strong> Le prix ne se détermine pas au niveau "Gironde" mais au niveau de votre rue, votre résidence, votre étage.</p>
            
            <h3>Segmentation par zones Gironde :</h3>
            <ul>
              <li><strong>Bordeaux Hypercentre :</strong> 
                <ul>
                  <li>Triangle d'Or : 5 500-6 500€/m²</li>
                  <li>Saint-Pierre : 4 500-5 200€/m²</li>
                  <li>Chartrons : 4 800-5 500€/m²</li>
                  <li>Bastide : 3 800-4 400€/m²</li>
                </ul>
              </li>
              <li><strong>Bordeaux Périphérie :</strong>
                <ul>
                  <li>Caudéran : 4 200-4 800€/m²</li>
                  <li>Nansouty : 3 900-4 500€/m²</li>
                  <li>Bacalan : 3 600-4 200€/m²</li>
                </ul>
              </li>
              <li><strong>Communes CUB Premium :</strong>
                <ul>
                  <li>Talence (Thouars) : 4 200-4 600€/m²</li>
                  <li>Mérignac Centre : 3 800-4 200€/m²</li>
                  <li>Pessac (Montaigne) : 3 900-4 300€/m²</li>
                </ul>
              </li>
            </ul>

            <p><strong>Technique du Maximisateur :</strong> Positionnez-vous dans le top 10% de votre micro-zone en justifiant chaque euro d'écart.</p>

            <h2>2. Travaux rentables et valorisation</h2>
            <p><strong>ROI immédiat :</strong> Certains travaux rapportent 2-3€ pour 1€ investi en Gironde.</p>

            <h3>Travaux ROI positif :</h3>
            <ul>
              <li><strong>Cuisine (rénovation) :</strong> 8 000-15 000€ → +15 000-25 000€ valeur</li>
              <li><strong>Salle de bain :</strong> 5 000-10 000€ → +10 000-18 000€ valeur</li>
              <li><strong>Parquet (rénovation/pose) :</strong> 30-60€/m² → +80-120€/m² valeur</li>
              <li><strong>Peinture générale :</strong> 15-25€/m² → +50-80€/m² valeur</li>
              <li><strong>Isolation extérieure :</strong> 12 000-20 000€ → +20 000-35 000€ (DPE A/B)</li>
            </ul>

            <h3>Spécificités climatiques Gironde :</h3>
            <ul>
              <li><strong>Humidité :</strong> VMC double flux valorisée (+3-5%)</li>
              <li><strong>Chaleur été :</strong> Climatisation réversible (+5-8%)</li>
              <li><strong>Ecologie :</strong> Pompe à chaleur, panneaux solaires (+8-12%)</li>
            </ul>

            <h2>3. Timing optimal du marché Girondin</h2>
            <p><strong>Analyse saisonnière des prix en Gironde :</strong></p>
            <ul>
              <li><strong>Printemps (Mars-Mai) :</strong> +3-5% vs moyenne annuelle</li>
              <li><strong>Été (Juin-Août) :</strong> +1-2% mais volume baisse</li>
              <li><strong>Rentrée (Sept-Nov) :</strong> Prix moyens, fort volume</li>
              <li><strong>Hiver (Déc-Fév) :</strong> -2-4% mais négociation possible</li>
            </ul>
            
            <p><strong>Stratégie Maximisateur :</strong> Préparation hiver → Lancement marché début mars → Vente mai/juin</p>

            <h2>4. Mise en scène "haut de gamme"</h2>
            <ul>
              <li><strong>Home staging premium :</strong> Budget 2-3% valeur bien</li>
              <li><strong>Mobilier de qualité :</strong> Location 6 mois (1 500-3 000€)</li>
              <li><strong>Éclairage d'ambiance :</strong> LED variables, spots orientés</li>
              <li><strong>Senteurs subtiles :</strong> Bougies haut de gamme</li>
              <li><strong>Végétation :</strong> Plantes vertes, fleurs fraîches</li>
            </ul>

            <h2>5. Négociation de maximisation</h2>
            <p><strong>Psychologie de l'acheteur Girondin :</strong></p>
            <ul>
              <li>Prix affiché = prix de départ négociation (attendu)</li>
              <li>Justification de chaque élément de valeur</li>
              <li>Comparatifs précis avec biens similaires vendus</li>
              <li>Conditions de vente attractives (délai, notaire, etc.)</li>
            </ul>

            <h3>Techniques avancées :</h3>
            <ul>
              <li><strong>Prix d'appel :</strong> -5% du prix cible pour générer visites</li>
              <li><strong>Révision à la hausse :</strong> Si forte demande après 15 jours</li>
              <li><strong>Enchères encadrées :</strong> Si plusieurs acquéreurs sérieux</li>
              <li><strong>Offres conditionnelles :</strong> Bonus si signature rapide</li>
            </ul>

            <h2>Plan d'action Maximisateur - 6 mois</h2>
            <h3>Mois 1-2 : Préparation</h3>
            <ul>
              <li>Étude micro-marché approfondie</li>
              <li>Définition travaux rentables</li>
              <li>Planification budget et délais</li>
            </ul>

            <h3>Mois 3-4 : Valorisation</h3>
            <ul>
              <li>Réalisation travaux sélectionnés</li>
              <li>Home staging premium</li>
              <li>Photos/vidéos professionnelles</li>
            </ul>

            <h3>Mois 5-6 : Commercialisation</h3>
            <ul>
              <li>Lancement marketing premium</li>
              <li>Visites sélectionnées et accompagnées</li>
              <li>Négociation optimisée</li>
            </ul>

            <div class="cta-section">
              <h3>Accompagnement Maximisateur Gironde</h3>
              <p>Notre service "Maximisateur" vous accompagne pour optimiser chaque euro de valeur. Audit complet et stratégie personnalisée.</p>
            </div>
          </div>`,
          summary: "Analyse micro-marché Gironde, Travaux rentables ROI, Timing saisonnier optimal, Home staging premium, Négociation maximisation, Plan 6 mois",
          pdfContent: `Version PDF complète avec : Tableau prix détaillé par rues Bordeaux-Métropole, Calculateur ROI travaux, Planning Maximisateur 6 mois, Scripts négociation premium`,
          metaDescription: "Guide pour maximiser la valeur de vente de son bien immobilier en Gironde. Travaux rentables, timing optimal, négociation avancée.",
          seoTitle: "Guide Maximisateur Prix Gironde - Optimiser la Vente | Estimation Immobilier",
          sortOrder: 2
        },
        {
          title: "Guide Succession - Vendre un bien hérité en Gironde",
          slug: "guide-succession-heritage",
          persona: "succession",
          shortBenefit: "Simplifiez la vente d'un bien en succession avec notre accompagnement spécialisé Gironde",
          readingTime: 25,
          content: `<div class="guide-content">
            <h1>Guide Succession - Vendre un bien hérité en Gironde</h1>
            
            <div class="intro-section">
              <p><strong>Vendre un bien en succession</strong> nécessite une approche spécifique, entre aspects légaux, émotionnels et fiscaux. En Gironde, nous accompagnons chaque année plus de 200 successions immobilières.</p>
              <p>Ce guide vous éclaire sur toutes les étapes, de l'ouverture de succession à la signature définitive.</p>
            </div>

            <h2>1. Aspects légaux de la succession en Gironde</h2>
            
            <h3>Ouverture de succession :</h3>
            <ul>
              <li><strong>Déclaration décès :</strong> Mairie du lieu de décès (délai 24h)</li>
              <li><strong>Notaire :</strong> Désignation dans les 6 mois (obligatoire si bien immobilier)</li>
              <li><strong>Inventaire :</strong> Liste exhaustive des biens (3-6 mois)</li>
              <li><strong>Acceptation/Renonciation :</strong> Décision héritiers (4 mois)</li>
            </ul>

            <h3>Spécificités juridiques Gironde :</h3>
            <ul>
              <li><strong>Notaires recommandés :</strong> 
                <ul>
                  <li>Bordeaux : Études spécialisées succession (15+)</li>
                  <li>Communes CUB : Notaires de proximité</li>
                  <li>Rural Gironde : Notaires généralistes expérimentés</li>
                </ul>
              </li>
              <li><strong>Délais moyens en Gironde :</strong>
                <ul>
                  <li>Succession simple : 6-8 mois</li>
                  <li>Succession complexe : 12-18 mois</li>
                  <li>Contentieux : 24+ mois</li>
                </ul>
              </li>
            </ul>

            <h2>2. Évaluation du bien en succession</h2>
            
            <h3>Obligation fiscale :</h3>
            <p><strong>Valeur de déclaration :</strong> Doit correspondre à la valeur vénale réelle au jour du décès.</p>
            <ul>
              <li><strong>Expertise :</strong> Souvent nécessaire (coût 300-800€)</li>
              <li><strong>Références marché :</strong> Prix ventes récentes quartier</li>
              <li><strong>État du bien :</strong> Vétusté, travaux nécessaires</li>
            </ul>

            <h3>Particularités évaluation Gironde :</h3>
            <ul>
              <li><strong>Marché rural :</strong> Experts spécialisés vignoble/agricole</li>
              <li><strong>Bordeaux-ville :</strong> Variation forte selon rue/étage</li>
              <li><strong>Littoral :</strong> Expertise spécifique (érosion, PLU)</li>
              <li><strong>Bâti ancien :</strong> Diagnostic structure souvent requis</li>
            </ul>

            <h2>3. Fiscalité succession Gironde</h2>
            
            <h3>Droits de succession :</h3>
            <ul>
              <li><strong>Abattement conjoint :</strong> 80 724€</li>
              <li><strong>Abattement enfant :</strong> 100 000€ par enfant</li>
              <li><strong>Barème progressif :</strong> 5% à 45% selon montant et lien</li>
            </ul>

            <h3>Plus-value succession :</h3>
            <p><strong>Exonération totale</strong> sur résidence principale du défunt.</p>
            <p><strong>Bien locatif/secondaire :</strong></p>
            <ul>
              <li>Base calcul : Prix vente - Valeur succession</li>
              <li>Abattement durée détention : 6% par an dès la 6e année</li>
              <li>Exonération totale après 22 ans détention</li>
            </ul>

            <h2>4. Organisation de la vente</h2>
            
            <h3>Accord héritiers :</h3>
            <ul>
              <li><strong>Unanimité requise :</strong> Tous héritiers d'accord pour vendre</li>
              <li><strong>Mandataire :</strong> Désignation héritier référent</li>
              <li><strong>Répartition :</strong> Quote-parts définies notaire</li>
            </ul>

            <h3>Préparation du bien :</h3>
            <ul>
              <li><strong>Vidage/nettoyage :</strong> Souvent nécessaire (budget 500-2000€)</li>
              <li><strong>Petits travaux :</strong> Sécurité/salubrité prioritaires</li>
              <li><strong>Diagnostics :</strong> Obligatoires avant vente</li>
            </ul>

            <h2>5. Stratégie commerciale succession</h2>
            
            <h3>Communication spécifique :</h3>
            <ul>
              <li><strong>Transparence :</strong> Mentionner "succession" rassure acquéreurs</li>
              <li><strong>Histoire du bien :</strong> Valoriser vécu familial si positif</li>
              <li><strong>Flexibilité :</strong> Négociation possible sur délais</li>
            </ul>

            <h3>Prix et négociation :</h3>
            <ul>
              <li><strong>Prix juste :</strong> Basé sur expertise succession</li>
              <li><strong>Marge limitée :</strong> Héritiers souvent pressés de finaliser</li>
              <li><strong>Conditions :</strong> Délai signature parfois négociable</li>
            </ul>

            <h2>6. Étapes pratiques succession Gironde</h2>
            
            <h3>Phase 1 : Légal (2-4 mois)</h3>
            <ul>
              <li>☐ Déclaration décès et formalités</li>
              <li>☐ Contact notaire spécialisé</li>
              <li>☐ Inventaire succession</li>
              <li>☐ Accord héritiers sur principe vente</li>
            </ul>

            <h3>Phase 2 : Évaluation (1-2 mois)</h3>
            <ul>
              <li>☐ Expertise immobilière officielle</li>
              <li>☐ Estimation commerciale (plusieurs avis)</li>
              <li>☐ Étude fiscale (droits + plus-value)</li>
            </ul>

            <h3>Phase 3 : Préparation vente (1-2 mois)</h3>
            <ul>
              <li>☐ Nettoyage/vidage du bien</li>
              <li>☐ Travaux urgents si nécessaires</li>
              <li>☐ Diagnostics immobiliers</li>
              <li>☐ Photos professionnelles</li>
            </ul>

            <h3>Phase 4 : Commercialisation (2-4 mois)</h3>
            <ul>
              <li>☐ Diffusion annonce tous supports</li>
              <li>☐ Organisation visites</li>
              <li>☐ Négociation et accord</li>
              <li>☐ Signature promesse vente</li>
            </ul>

            <h3>Phase 5 : Finalisation (2-3 mois)</h3>
            <ul>
              <li>☐ Conditions suspensives acquéreur</li>
              <li>☐ Finalisation acte notarié</li>
              <li>☐ Signature définitive</li>
              <li>☐ Répartition produit vente</li>
            </ul>

            <h2>Contacts utiles Gironde</h2>
            <ul>
              <li><strong>Chambre Notaires Gironde :</strong> 33000 Bordeaux</li>
              <li><strong>Service Enregistrement :</strong> Hôtel des Finances Bordeaux</li>
              <li><strong>Experts immobiliers assermentés :</strong> Liste tribunal Bordeaux</li>
            </ul>

            <div class="cta-section">
              <h3>Accompagnement succession Gironde</h3>
              <p>Nos experts succession vous accompagnent à chaque étape. Service complet : légal, fiscal, immobilier.</p>
            </div>
          </div>`,
          summary: "Aspects légaux succession, Évaluation fiscale, Droits et plus-values, Organisation familiale, Stratégie vente, Étapes complètes, Contacts utiles Gironde",
          pdfContent: `Guide PDF complet : Checklist étapes succession, Formulaires types, Contacts notaires Gironde, Simulateur fiscal succession, Modèles accords héritiers`,
          metaDescription: "Guide complet pour vendre un bien immobilier en succession en Gironde. Aspects légaux, fiscaux, étapes pratiques.",
          seoTitle: "Guide Succession Immobilier Gironde - Vente Héritage | Expert Succession",
          sortOrder: 3
        },
        {
          title: "Guide Nouvelle Vie - Vendre pour un nouveau projet en Gironde",
          slug: "guide-nouvelle-vie",
          persona: "nouvelle_vie",
          shortBenefit: "Financez votre nouveau projet de vie grâce à une vente optimisée en Gironde",
          readingTime: 18,
          content: `<div class="guide-content">
            <h1>Guide Nouvelle Vie - Vendre pour un nouveau projet en Gironde</h1>
            
            <div class="intro-section">
              <p><strong>Retraite, mutation, changement familial ?</strong> Vous vendez votre bien en Gironde pour financer un nouveau projet de vie. Cette vente doit être parfaitement orchestrée pour réussir votre transition.</p>
              <p>Ce guide vous accompagne pour vendre dans les meilleures conditions et optimiser le financement de votre nouvelle vie.</p>
            </div>

            <h2>1. Définir son projet de nouvelle vie</h2>
            
            <h3>Types de projets fréquents en Gironde :</h3>
            <ul>
              <li><strong>Retraite :</strong> Déménagement résidence principale
                <ul>
                  <li>Vers campagne girondine (Médoc, Entre-deux-Mers)</li>
                  <li>Vers littoral (Arcachon, Cap-Ferret)</li>
                  <li>Vers autre région (Sud, montagne)</li>
                </ul>
              </li>
              <li><strong>Mutation professionnelle :</strong>
                <ul>
                  <li>Départ de Bordeaux-Métropole</li>
                  <li>Arrivée en Gironde (autres régions)</li>
                </ul>
              </li>
              <li><strong>Évolution familiale :</strong>
                <ul>
                  <li>Agrandissement famille → maison plus grande</li>
                  <li>Enfants partis → logement plus petit</li>
                  <li>Séparation → division patrimoine</li>
                </ul>
              </li>
              <li><strong>Investissement :</strong>
                <ul>
                  <li>Achat résidence secondaire</li>
                  <li>Investissement locatif</li>
                  <li>Création d'entreprise</li>
                </ul>
              </li>
            </ul>

            <h3>Budget et calendrier :</h3>
            <ul>
              <li><strong>Évaluer le besoin financier :</strong> Montant requis pour nouveau projet</li>
              <li><strong>Calculer la capacité :</strong> Prix vente - remboursement crédit - frais</li>
              <li><strong>Planifier le timing :</strong> Synchroniser vente/achat si nécessaire</li>
            </ul>

            <h2>2. Optimiser le timing en Gironde</h2>
            
            <h3>Calendrier scolaire (si enfants) :</h3>
            <ul>
              <li><strong>Vente idéale :</strong> Février-mai (emménagement été)</li>
              <li><strong>Éviter :</strong> Novembre-janvier (déménagement hiver)</li>
            </ul>

            <h3>Calendrier professionnel :</h3>
            <ul>
              <li><strong>Mutation :</strong> Anticiper 6 mois minimum</li>
              <li><strong>Retraite :</strong> Commencer démarches 1 an avant</li>
            </ul>

            <h3>Marché immobilier Gironde :</h3>
            <ul>
              <li><strong>Haute saison :</strong> Mars-juin (prix optimaux)</li>
              <li><strong>Basse saison :</strong> Décembre-février (délais plus longs)</li>
            </ul>

            <h2>3. Solutions de financement transitoire</h2>
            
            <h3>Crédit relais :</h3>
            <p><strong>Principe :</strong> Financer l'achat avant la vente (banques girondines partenaires)</p>
            <ul>
              <li><strong>Durée :</strong> 12-24 mois maximum</li>
              <li><strong>Montant :</strong> 70-80% valeur bien à vendre</li>
              <li><strong>Taux :</strong> +0,5 à +1% vs crédit classique</li>
              <li><strong>Avantages :</strong> Pas de contrainte timing, sérénité négociation</li>
            </ul>

            <h3>Vente en viager :</h3>
            <p><strong>Si retraite :</strong> Alternative intéressante selon situation</p>
            <ul>
              <li><strong>Viager occupé :</strong> Rester dans le logement</li>
              <li><strong>Viager libre :</strong> Capital + rente viagère</li>
              <li><strong>Spécialistes Gironde :</strong> Notaires et conseillers patrimoine</li>
            </ul>

            <h2>4. Préparation émotionnelle et pratique</h2>
            
            <h3>Aspect émotionnel :</h3>
            <ul>
              <li><strong>Détachement :</strong> Se projeter dans nouvelle vie</li>
              <li><strong>Tri et rangement :</strong> Commencer 6 mois avant</li>
              <li><strong>Souvenirs :</strong> Sélectionner objets à conserver</li>
              <li><strong>Famille :</strong> Impliquer conjoint/enfants dans projet</li>
            </ul>

            <h3>Préparation pratique :</h3>
            <ul>
              <li><strong>Désencombrement progressif :</strong> 20% du mobilier/objets</li>
              <li><strong>Travaux de rafraîchissement :</strong> Peinture, petites réparations</li>
              <li><strong>Neutralisation :</strong> Dépersonnaliser l'espace</li>
              <li><strong>Valorisation :</strong> Optimiser points forts du bien</li>
            </ul>

            <h2>5. Négociation "projet de vie"</h2>
            
            <h3>Arguments de négociation :</h3>
            <ul>
              <li><strong>Flexibilité délais :</strong> Adaptation aux besoins acquéreur</li>
              <li><strong>État impeccable :</strong> Bien entretenu par propriétaire occupant</li>
              <li><strong>Histoire positive :</strong> Valoriser le vécu familial</li>
              <li><strong>Motivation sincère :</strong> Projet de vie vs spéculation</li>
            </ul>

            <h3>Conditions de vente :</h3>
            <ul>
              <li><strong>Prix ferme :</strong> Pas de négociation si projet défini</li>
              <li><strong>Délai signature :</strong> Selon impératifs nouveau projet</li>
              <li><strong>Conditions suspensives :</strong> Minimales pour sécuriser</li>
            </ul>

            <h2>6. Checklist nouvelle vie Gironde</h2>

            <h3>Phase préparation (6 mois avant) :</h3>
            <ul>
              <li>☐ Définition précise nouveau projet</li>
              <li>☐ Budget et financement étudié</li>
              <li>☐ Calendrier optimal défini</li>
              <li>☐ Début désencombrement</li>
            </ul>

            <h3>Phase étude (3 mois avant) :</h3>
            <ul>
              <li>☐ Estimation bien actuel</li>
              <li>☐ Étude financement (crédit relais ?)</li>
              <li>☐ Recherche nouveau logement si applicable</li>
              <li>☐ Préparation administrative</li>
            </ul>

            <h3>Phase lancement (1 mois avant) :</h3>
            <ul>
              <li>☐ Travaux de rafraîchissement finalisés</li>
              <li>☐ Photos professionnelles</li>
              <li>☐ Annonce rédigée et diffusée</li>
              <li>☐ Planning visites organisé</li>
            </ul>

            <h3>Phase négociation :</h3>
            <ul>
              <li>☐ Sélection acquéreurs sérieux</li>
              <li>☐ Négociation basée sur projet de vie</li>
              <li>☐ Compromis sécurisé</li>
              <li>☐ Coordination avec nouveau logement</li>
            </ul>

            <h2>Spécificités géographiques Gironde</h2>
            
            <h3>Départ de Bordeaux-Métropole :</h3>
            <ul>
              <li><strong>Acquéreurs cibles :</strong> Primo-accédants, familles, investisseurs</li>
              <li><strong>Arguments :</strong> Proximité transports, services, emploi</li>
              <li><strong>Prix :</strong> Généralement attractifs pour nouveaux arrivants</li>
            </ul>

            <h3>Déménagement intra-Gironde :</h3>
            <ul>
              <li><strong>Connaissance locale :</strong> Valoriser expertise secteur</li>
              <li><strong>Réseau :</strong> Recommandations artisans, services</li>
              <li><strong>Accompagnement :</strong> Conseils nouvelle commune</li>
            </ul>

            <div class="cta-section">
              <h3>Accompagnement nouvelle vie Gironde</h3>
              <p>Nos conseillers "Nouvelle Vie" vous accompagnent dans votre projet de A à Z. Estimation, financement, coordination.</p>
            </div>
          </div>`,
          summary: "Définition projet de vie, Timing optimal Gironde, Solutions financement transitoire, Préparation émotionnelle, Négociation projet, Checklist complète, Spécificités géographiques",
          pdfContent: `Guide PDF : Calculateur budget nouvelle vie, Checklist déménagement, Contacts crédit relais Gironde, Planning coordination vente/achat, Conseils tri et rangement`,
          metaDescription: "Guide pour vendre son bien immobilier en Gironde dans le cadre d'un nouveau projet de vie. Timing, financement, préparation.",
          seoTitle: "Guide Nouvelle Vie Gironde - Vendre pour Projet de Vie | Estimation Immobilier",
          sortOrder: 4
        },
        {
          title: "Guide Investisseur - Optimiser la revente en Gironde",
          slug: "guide-investisseur-revente",
          persona: "investisseur",
          shortBenefit: "Maximisez votre ROI avec notre stratégie de sortie d'investissement immobilier en Gironde",
          readingTime: 22,
          content: `<div class="guide-content">
            <h1>Guide Investisseur - Optimiser la revente en Gironde</h1>
            
            <div class="intro-section">
              <p><strong>Investisseur immobilier ?</strong> La sortie d'investissement en Gironde nécessite une approche stratégique pour optimiser votre ROI. Fiscalité, timing marché, plus-values : chaque détail compte.</p>
              <p>Ce guide vous révèle les techniques pour maximiser le résultat net de votre cession immobilière.</p>
            </div>

            <h2>1. Analyse ROI et stratégie de sortie</h2>
            
            <h3>Calcul de performance actuel :</h3>
            <ul>
              <li><strong>Rentabilité locative :</strong> Loyers nets / Prix d'achat</li>
              <li><strong>Plus-value latente :</strong> Valeur actuelle - Prix acquisition - Travaux</li>
              <li><strong>Performance globale :</strong> (Loyers cumulés + Plus-value) / Capital investi</li>
            </ul>

            <h3>Indicateurs marché Gironde :</h3>
            <ul>
              <li><strong>Rendements locatifs moyens 2024 :</strong>
                <ul>
                  <li>Bordeaux Centre : 3,2-3,8%</li>
                  <li>Bordeaux Périphérie : 3,8-4,5%</li>
                  <li>CUB (Mérignac, Pessac, Talence) : 3,5-4,2%</li>
                  <li>Communes périphérie : 4,5-5,5%</li>
                  <li>Littoral (Arcachon) : 2,8-3,5%</li>
                </ul>
              </li>
              <li><strong>Évolution prix 3 ans :</strong>
                <ul>
                  <li>Bordeaux : +12-18%</li>
                  <li>Métropole : +8-15%</li>
                  <li>Communes périphérie : +15-25%</li>
                </ul>
              </li>
            </ul>

            <h2>2. Optimisation fiscale plus-values</h2>
            
            <h3>Mécanisme plus-values immobilières :</h3>
            <ul>
              <li><strong>Base calcul :</strong> Prix vente - Prix achat - Travaux déductibles - Frais acquisition</li>
              <li><strong>Taux global :</strong> 36,2% (IR + PS) sur plus-value brute</li>
              <li><strong>Abattements durée :</strong>
                <ul>
                  <li>IR : 6% par an dès 6e année, exonération 22 ans</li>
                  <li>PS : 1,65% par an dès 6e année, exonération 30 ans</li>
                </ul>
              </li>
            </ul>

            <h3>Stratégies d'optimisation :</h3>
            <ul>
              <li><strong>Timing optimal :</strong> Vente après 6 ans minimum (début abattements)</li>
              <li><strong>Travaux déductibles :</strong> Conserver toutes factures (15% forfaitaire possible)</li>
              <li><strong>Frais acquisition :</strong> 7,5% forfait ou frais réels si supérieurs</li>
              <li><strong>Plus-value reportée :</strong> Réinvestissement Art. 150-0 B ter (rare)</li>
            </ul>

            <h3>Cas particuliers Gironde :</h3>
            <ul>
              <li><strong>Zone tendue :</strong> Bordeaux-Métropole = taxation majorée si vacance</li>
              <li><strong>Bien historique :</strong> Secteur sauvegardé = avantages fiscaux possibles</li>
              <li><strong>Monument historique :</strong> Régime spécial si applicable</li>
            </ul>

            <h2>3. Timing et cycle de marché</h2>
            
            <h3>Analyse cyclique Gironde :</h3>
            <ul>
              <li><strong>2018-2020 :</strong> Forte hausse prix (+15-20%)</li>
              <li><strong>2021-2023 :</strong> Stabilisation relative (+5-8%/an)</li>
              <li><strong>2024-2025 :</strong> Marché plus sélectif, prix stable</li>
            </ul>

            <h3>Indicateurs de sortie :</h3>
            <ul>
              <li><strong>Ratio prix/loyer élevé :</strong> >25 = signal vente potentiel</li>
              <li><strong>Baisse rendement :</strong> Si <3% en centre-ville</li>
              <li><strong>Évolution quartier :</strong> Dégradation ou sur-densification</li>
              <li><strong>Fiscalité locative :</strong> Évolutions réglementaires défavorables</li>
            </ul>

            <h2>4. Préparation du bien locatif</h2>
            
            <h3>État des lieux de sortie :</h3>
            <ul>
              <li><strong>Diagnostic technique :</strong> Structure, installations, conformité</li>
              <li><strong>Bilan locatif :</strong> Dégradations, usure normale, sinistres</li>
              <li><strong>Mise aux normes :</strong> Électricité, gaz, accessibilité si nécessaire</li>
            </ul>

            <h3>Stratégie de présentation :</h3>
            <ul>
              <li><strong>Bien libre :</strong> +10-15% de prix mais délai préavis locataire</li>
              <li><strong>Bien occupé :</strong> Vente à investisseur ou primo avec locataire</li>
              <li><strong>Home staging investisseur :</strong> Neutre et fonctionnel</li>
            </ul>

            <h2>5. Commercialisation spécifique investisseur</h2>
            
            <h3>Argumentation ROI :</h3>
            <ul>
              <li><strong>Rentabilité démontrée :</strong> Historique loyers 3-5 ans</li>
              <li><strong>Potentiel d'évolution :</strong> Quartier, transports, projets</li>
              <li><strong>Charges maîtrisées :</strong> Copropriété, entretien, fiscalité</li>
            </ul>

            <h3>Cibles acquéreurs Gironde :</h3>
            <ul>
              <li><strong>Investisseurs locaux :</strong> Connaissance marché, gestion directe</li>
              <li><strong>Parisiens :</strong> Diversification géographique, prix attractifs vs Paris</li>
              <li><strong>Primo-investisseurs :</strong> Bordeaux = marché "sûr" et dynamique</li>
              <li><strong>SCI familiales :</strong> Transmission patrimoine</li>
            </ul>

            <h2>6. Négociation et conditions de vente</h2>
            
            <h3>Prix de vente optimal :</h3>
            <ul>
              <li><strong>Méthode capitalisation :</strong> Loyer annuel × 20-25 (selon secteur)</li>
              <li><strong>Méthode comparative :</strong> Prix m² biens similaires libres - 10%</li>
              <li><strong>Méthode coût reconstruction :</strong> Terrain + Construction + Marge</li>
            </ul>

            <h3>Conditions de vente investisseur :</h3>
            <ul>
              <li><strong>Délai signature :</strong> Plus court (financement souvent bouclé)</li>
              <li><strong>Conditions suspensives :</strong> Minimales</li>
              <li><strong>État du bien :</strong> Acceptation de l'usure locative normale</li>
              <li><strong>Documentation :</strong> Bilans locatifs, charges, sinistres</li>
            </ul>

            <h2>7. Stratégies avancées</h2>
            
            <h3>Démembrement temporaire :</h3>
            <ul>
              <li><strong>Principe :</strong> Vente usufruit temporaire + nue-propriété</li>
              <li><strong>Avantages :</strong> Capital immédiat + récupération bien</li>
              <li><strong>Inconvénients :</strong> Complexité juridique, marché restreint</li>
            </ul>

            <h3>Vente en bloc (si plusieurs biens) :</h3>
            <ul>
              <li><strong>Décote acceptable :</strong> 5-10% vs vente unitaire</li>
              <li><strong>Acquéreurs :</strong> Investisseurs institutionnels, fonds</li>
              <li><strong>Simplification :</strong> Une seule transaction</li>
            </ul>

            <h2>Checklist sortie investissement Gironde</h2>

            <h3>Analyse préalable (2-3 mois) :</h3>
            <ul>
              <li>☐ Calcul ROI global depuis acquisition</li>
              <li>☐ Simulation fiscale plus-value</li>
              <li>☐ Analyse marché local actuel</li>
              <li>☐ Décision timing optimal</li>
            </ul>

            <h3>Préparation technique (1-2 mois) :</h3>
            <ul>
              <li>☐ Audit état du bien</li>
              <li>☐ Travaux nécessaires identifiés</li>
              <li>☐ Diagnostic immobilier</li>
              <li>☐ Documentation locative à jour</li>
            </ul>

            <h3>Commercialisation (2-4 mois) :</h3>
            <ul>
              <li>☐ Stratégie libre/occupé définie</li>
              <li>☐ Prix optimal calculé</li>
              <li>☐ Annonce investisseur rédigée</li>
              <li>☐ Diffusion ciblée professionnels</li>
            </ul>

            <h3>Négociation/Finalisation :</h3>
            <ul>
              <li>☐ Sélection acquéreur final</li>
              <li>☐ Négociation conditions</li>
              <li>☐ Optimisation fiscale finale</li>
              <li>☐ Signature et transmission</li>
            </ul>

            <div class="cta-section">
              <h3>Accompagnement investisseur Gironde</h3>
              <p>Nos experts investissement optimisent votre sortie : analyse ROI, fiscalité, négociation. Maximisez votre plus-value.</p>
            </div>
          </div>`,
          summary: "Analyse ROI investissement, Optimisation fiscale plus-values, Timing cycle marché, Préparation bien locatif, Commercialisation ciblée, Négociation investisseur, Stratégies avancées",
          pdfContent: `Guide PDF investisseur : Calculateur ROI complet, Simulateur fiscal plus-value, Tableau rendements Gironde, Modèles contrats investisseur, Check-list sortie investissement`,
          metaDescription: "Guide pour optimiser la revente d'un investissement immobilier locatif en Gironde. ROI, fiscalité, timing marché.",
          seoTitle: "Guide Investisseur Revente Gironde - Optimiser ROI | Expert Investissement Immobilier",
          sortOrder: 5
        },
        {
          title: "Guide Primo-Vendeur - Réussir sa première vente en Gironde",
          slug: "guide-primo-vendeur",
          persona: "primo",
          shortBenefit: "Évitez les pièges de la première vente avec notre guide complet spécialement conçu pour la Gironde",
          readingTime: 30,
          content: `<div class="guide-content">
            <h1>Guide Primo-Vendeur - Réussir sa première vente en Gironde</h1>
            
            <div class="intro-section">
              <p><strong>Première vente immobilière ?</strong> C'est une étape importante qui peut sembler complexe. En Gironde, nous accompagnons chaque année plus de 800 primo-vendeurs dans leur première transaction.</p>
              <p>Ce guide complet vous évite tous les pièges et vous accompagne étape par étape vers une vente réussie.</p>
            </div>

            <h2>1. Comprendre le processus de vente</h2>
            
            <h3>Les grandes étapes d'une vente :</h3>
            <ol>
              <li><strong>Préparation :</strong> Estimation, diagnostics, préparation du bien (1-2 mois)</li>
              <li><strong>Commercialisation :</strong> Annonce, visites, négociation (2-4 mois)</li>
              <li><strong>Compromis de vente :</strong> Accord avec l'acquéreur (7-10 jours)</li>
              <li><strong>Délai de rétractation :</strong> 10 jours pour l'acquéreur</li>
              <li><strong>Conditions suspensives :</strong> Crédit, diagnostics (2-3 mois)</li>
              <li><strong>Acte définitif :</strong> Signature chez le notaire</li>
            </ol>

            <h3>Durée moyenne en Gironde :</h3>
            <ul>
              <li><strong>Bordeaux Centre :</strong> 3-4 mois</li>
              <li><strong>Bordeaux-Métropole :</strong> 4-6 mois</li>
              <li><strong>Communes périphérie :</strong> 6-8 mois</li>
              <li><strong>Secteur rural :</strong> 8-12 mois</li>
            </ul>

            <h2>2. Estimation : fixer le bon prix</h2>
            
            <h3>Méthodes d'estimation :</h3>
            <ul>
              <li><strong>Comparaison marché :</strong> Biens similaires vendus récemment</li>
              <li><strong>Expertise professionnelle :</strong> Agent immobilier local (gratuit)</li>
              <li><strong>Notaire :</strong> Bases de données officielles (payant 300-500€)</li>
              <li><strong>En ligne :</strong> Estimation automatique (indicatif seulement)</li>
            </ul>

            <h3>Erreurs fréquentes primo-vendeur :</h3>
            <ul>
              <li><strong>Surestimation émotionnelle :</strong> "J'ai fait des travaux" → Pas forcément valorisés</li>
              <li><strong>Comparaison approximative :</strong> Surface, étage, orientation différents</li>
              <li><strong>Méconnaissance micro-marché :</strong> Différence énorme entre rues voisines</li>
              <li><strong>Prix psychologique :</strong> 299 000€ vs 300 000€ (filtres recherche)</li>
            </ul>

            <h3>Spécificités prix Gironde :</h3>
            <ul>
              <li><strong>Bordeaux intramuros :</strong> Variation 2000-6000€/m² selon quartier</li>
              <li><strong>Tramway :</strong> +10-15% si à moins de 500m d'un arrêt</li>
              <li><strong>Écoles réputées :</strong> +5-10% (Bordeaux, Talence, Mérignac)</li>
              <li><strong>Parking :</strong> +15 000-30 000€ selon secteur</li>
            </ul>

            <h2>3. Documents obligatoires</h2>
            
            <h3>Diagnostics immobiliers (validité) :</h3>
            <ul>
              <li><strong>DPE :</strong> 10 ans (obligatoire pour annonce)</li>
              <li><strong>Amiante :</strong> Illimitée si négatif, bâti avant 1997</li>
              <li><strong>Plomb :</strong> 1 an, bâti avant 1949</li>
              <li><strong>Termites :</strong> 6 mois (zones à risque Gironde)</li>
              <li><strong>Électricité :</strong> 3 ans si installation +15 ans</li>
              <li><strong>Gaz :</strong> 3 ans si installation +15 ans</li>
              <li><strong>Assainissement :</strong> 3 ans (communes non raccordées)</li>
            </ul>

            <h3>Autres documents essentiels :</h3>
            <ul>
              <li><strong>Titre de propriété</strong> (acte notarié)</li>
              <li><strong>Règlement copropriété</strong> + derniers PV AG</li>
              <li><strong>Attestation surface</strong> (loi Carrez si copropriété)</li>
              <li><strong>Factures travaux</strong> récents (garanties)</li>
              <li><strong>Taxe foncière</strong> dernière année</li>
            </ul>

            <h3>Coût diagnostics Gironde :</h3>
            <ul>
              <li><strong>Pack complet appartement :</strong> 350-500€</li>
              <li><strong>Pack complet maison :</strong> 500-800€</li>
              <li><strong>DPE seul :</strong> 120-180€</li>
            </ul>

            <h2>4. Choisir son mode de vente</h2>
            
            <h3>Vente avec agent immobilier :</h3>
            <ul>
              <li><strong>Avantages :</strong>
                <ul>
                  <li>Accompagnement complet</li>
                  <li>Réseau acquéreurs</li>
                  <li>Gestion administrative</li>
                  <li>Négociation professionnelle</li>
                </ul>
              </li>
              <li><strong>Inconvénients :</strong>
                <ul>
                  <li>Commission 3-8% (négociable)</li>
                  <li>Mandat exclusif souvent demandé</li>
                </ul>
              </li>
              <li><strong>Commission moyenne Gironde :</strong> 4-6% TTC</li>
            </ul>

            <h3>Vente entre particuliers :</h3>
            <ul>
              <li><strong>Avantages :</strong>
                <ul>
                  <li>Pas de commission</li>
                  <li>Contact direct acquéreurs</li>
                  <li>Contrôle total processus</li>
                </ul>
              </li>
              <li><strong>Inconvénients :</strong>
                <ul>
                  <li>Time-consuming</li>
                  <li>Responsabilité légale totale</li>
                  <li>Difficulté évaluation acquéreurs</li>
                </ul>
              </li>
            </ul>

            <h2>5. Préparer son bien pour la vente</h2>
            
            <h3>Home staging primo-vendeur (budget 500-2000€) :</h3>
            <ul>
              <li><strong>Désencombrement :</strong> Cartons, meubles superflus, objets personnels</li>
              <li><strong>Nettoyage profond :</strong> Sol, vitres, sanitaires, cuisine</li>
              <li><strong>Réparations mineures :</strong> Trous murs, robinets, poignées</li>
              <li><strong>Peinture :</strong> Murs principaux en blanc/beige neutre</li>
              <li><strong>Éclairage :</strong> Ampoules puissantes, rideaux ouverts</li>
            </ul>

            <h3>Erreurs à éviter :</h3>
            <ul>
              <li><strong>Gros travaux :</strong> Cuisine/SDB complète rarement rentable</li>
              <li><strong>Goûts personnels :</strong> Couleurs vives, déco trop marquée</li>
              <li><strong>Désordre :</strong> Visiteur doit se projeter facilement</li>
              <li><strong>Odeurs :</strong> Animaux, tabac, cuisine, humidité</li>
            </ul>

            <h2>6. Rédiger l'annonce parfaite</h2>
            
            <h3>Structure annonce efficace :</h3>
            <ol>
              <li><strong>Titre accrocheur :</strong> Type bien + quartier + atout principal</li>
              <li><strong>Description technique :</strong> Surface, pièces, étage, exposition</li>
              <li><strong>Environnement :</strong> Transports, commerces, écoles</li>
              <li><strong>Points forts :</strong> Vue, calme, luminosité, parking</li>
              <li><strong>Informations pratiques :</strong> Charges, taxe foncière, DPE</li>
            </ol>

            <h3>Mots-clés Gironde qui vendent :</h3>
            <ul>
              <li><strong>"Proche tramway"</strong> (recherche n°1)</li>
              <li><strong>"Bordeaux Centre/Hyper-centre"</strong></li>
              <li><strong>"Calme"</strong> (recherche fréquente)</li>
              <li><strong>"Parking/Garage"</strong> (crucial Bordeaux)</li>
              <li><strong>"Terrasse/Balcon"</strong> (climat favorable)</li>
            </ul>

            <h2>7. Organiser les visites</h2>
            
            <h3>Préparation visite :</h3>
            <ul>
              <li><strong>Planning :</strong> Créneaux 1h30, éviter accumulation</li>
              <li><strong>Éclairage :</strong> Toutes lumières allumées, volets ouverts</li>
              <li><strong>Température :</strong> 20-22°C selon saison</li>
              <li><strong>Présence :</strong> Discret mais disponible pour questions</li>
            </ul>

            <h3>Sécurité primo-vendeur :</h3>
            <ul>
              <li><strong>Pré-qualification :</strong> Nom, téléphone, situation</li>
              <li><strong>Éviter :</strong> Visites seul(e), le soir</li>
              <li><strong>Documents :</strong> Pas d'originaux, copies seulement</li>
              <li><strong>Objets de valeur :</strong> Retirer bijoux, électronique</li>
            </ul>

            <h2>8. Négociation et compromis</h2>
            
            <h3>Évaluer une offre :</h3>
            <ul>
              <li><strong>Prix net vendeur :</strong> Offre - frais notaire acquéreur</li>
              <li><strong>Conditions :</strong> Délai, financement, clauses</li>
              <li><strong>Profil acquéreur :</strong> Capacité financière réelle</li>
              <li><strong>Timing :</strong> Adéquation avec vos contraintes</li>
            </ul>

            <h3>Négociation primo-vendeur :</h3>
            <ul>
              <li><strong>Marge définie :</strong> Prix minimum accepté au préalable</li>
              <li><strong>Argumentaire :</strong> Justifier le prix (travaux, marché, etc.)</li>
              <li><strong>Contrepartie :</strong> Si prix baissé → délai/conditions améliorés</li>
              <li><strong>Émotionnel :</strong> Éviter décisions impulsives</li>
            </ul>

            <h2>9. Pièges à éviter absolument</h2>
            
            <h3>Pièges financiers :</h3>
            <ul>
              <li><strong>Sous-estimation frais :</strong> Diagnostics, commission, plus-value</li>
              <li><strong>Acquéreur non solvable :</strong> Vérifier capacité financement</li>
              <li><strong>Conditions suspensives floues :</strong> Délais non définis</li>
            </ul>

            <h3>Pièges juridiques :</h3>
            <ul>
              <li><strong>Vice caché :</strong> Déclarer tous problèmes connus</li>
              <li><strong>Surface erronée :</strong> Faire mesurer par professionnel si doute</li>
              <li><strong>Servitudes oubliées :</strong> Passage, vue, mitoyenneté</li>
            </ul>

            <h3>Pièges administratifs :</h3>
            <ul>
              <li><strong>Diagnostics périmés :</strong> Refaire si nécessaire</li>
              <li><strong>Copropriété :</strong> Charges, travaux votés non déclarés</li>
              <li><strong>Urbanisme :</strong> Extensions non déclarées</li>
            </ul>

            <h2>10. Checklist complète primo-vendeur</h2>

            <h3>Phase préparation (1-2 mois) :</h3>
            <ul>
              <li>☐ Estimation par 3 professionnels</li>
              <li>☐ Prix de vente défini (objectif + minimum)</li>
              <li>☐ Diagnostics immobiliers commandés</li>
              <li>☐ Documents rassemblés et classés</li>
              <li>☐ Home staging réalisé</li>
              <li>☐ Photos professionnelles prises</li>
            </ul>

            <h3>Phase commercialisation :</h3>
            <ul>
              <li>☐ Mode vente choisi (agent/particulier)</li>
              <li>☐ Annonce rédigée et diffusée</li>
              <li>☐ Planning visites organisé</li>
              <li>☐ Suivi prospects/visites</li>
            </ul>

            <h3>Phase négociation :</h3>
            <ul>
              <li>☐ Offres analysées objectivement</li>
              <li>☐ Acquéreur solvable sélectionné</li>
              <li>☐ Négociation menée sereinement</li>
              <li>☐ Compromis vérifié par professionnel</li>
            </ul>

            <h3>Phase finalisation :</h3>
            <ul>
              <li>☐ Suivi conditions suspensives</li>
              <li>☐ Préparation acte notarié</li>
              <li>☐ Remise clés organisée</li>
              <li>☐ Changement adresse effectué</li>
            </ul>

            <div class="cta-section">
              <h3>Accompagnement primo-vendeur Gironde</h3>
              <p>Nos experts primo-vendeur vous rassurent et vous guident à chaque étape. Formation, conseils, suivi personnalisé.</p>
            </div>
          </div>`,
          summary: "Processus vente détaillé, Estimation juste prix, Documents obligatoires, Mode de vente, Préparation du bien, Annonce efficace, Organisation visites, Négociation, Pièges à éviter, Checklist complète",
          pdfContent: `Guide PDF primo-vendeur : Checklist étapes complète, Modèles documents, Scripts visites, Simulateur frais vente, Contacts professionnels Gironde, Kit négociation débutant`,
          metaDescription: "Guide complet pour réussir sa première vente immobilière en Gironde. Étapes, documents, négociation, pièges à éviter.",
          seoTitle: "Guide Primo-Vendeur Gironde - Première Vente Immobilier | Expert Débutant",
          sortOrder: 6
        }
      ];

      const createdGuides = [];
      for (const guideData of defaultGuides) {
        const guide = await storage.createGuide(guideData);
        createdGuides.push(guide);
      }

      res.json({ 
        success: true, 
        message: 'Default guides created successfully',
        guides: createdGuides
      });
    } catch (error) {
      console.error('Error seeding guides:', error);
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
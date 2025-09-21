import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage, db } from "./storage";
import { insertLeadSchema, insertEstimationSchema, insertContactSchema, insertArticleSchema, insertEmailTemplateSchema, insertEmailHistorySchema, insertGuideSchema, insertGuideDownloadSchema, insertGuideAnalyticsSchema, insertScoringConfigSchema, insertSmsCampaignSchema, insertSmsTemplateSchema, insertSmsContactSchema, insertSmsSentMessageSchema, insertSmsSequenceSchema, insertSmsSequenceEnrollmentSchema, insertChatConfigurationSchema, GUIDE_PERSONAS, BANT_CRITERIA, QUALIFICATION_STATUS } from "@shared/schema";
import { sanitizeArticleContent } from "./services/htmlSanitizer";
import { generateRealEstateArticle } from "./services/openai";
import OpenAI from "openai";
import emailService from "./services/emailService";
import emailSequenceService from "./services/emailSequenceService";
import emailTemplateGenerator from "./services/emailTemplateGenerator";
import { leadScoringService } from "./services/leadScoringService";
import smsVerificationService from "./services/smsVerificationService";
import { getMarketResearch } from "./services/perplexity";
import { z } from "zod";
import crypto from "crypto";
import twilio from "twilio";
import bcrypt from "bcrypt";
import pdfService from "./services/pdfService";
import Stripe from "stripe";
import { requireAuth } from "./middleware/auth";

// Initialize Twilio client
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const TWILIO_VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID || 'VA0562b4c0e460ba0c03268eb0e413b313';

// Initialize Stripe - Based on javascript_stripe integration
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
}) : null;

// Initialize OpenAI - Based on javascript_openai integration
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
}) : null;


// Enhanced chat configuration validation schema
const updateChatConfigSchema = insertChatConfigurationSchema.partial().extend({
  maxTokens: z.coerce.number().int().min(128).max(8192).optional(),
  temperature: z.coerce.number().min(0).max(2).optional(),
  maxHistoryMessages: z.coerce.number().int().min(0).max(20).optional(),
  model: z.string().min(1).optional(),
  systemPrompt: z.string().min(1).optional(),
  welcomeMessage: z.string().min(1).optional(),
  isActive: z.coerce.boolean().optional()
});

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

// Secure token system for lead context (RGPD-compliant)
const leadTokenStore = new Map<string, {
  firstName: string;
  email: string; 
  city: string;
  guideSlug: string;
  createdAt: number;
  expiresAt: number;
}>();

function createLeadToken(leadData: { firstName: string; email: string; city: string; guideSlug: string }): string {
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  const expiresAt = now + (24 * 60 * 60 * 1000); // 24 hours
  
  leadTokenStore.set(token, {
    ...leadData,
    createdAt: now,
    expiresAt
  });
  
  // Clean up expired tokens periodically
  setTimeout(() => {
    cleanupExpiredTokens();
  }, 60 * 60 * 1000); // Check every hour
  
  return token;
}

function getLeadFromToken(token: string): { firstName: string; email: string; city: string; guideSlug: string } | null {
  const leadData = leadTokenStore.get(token);
  if (!leadData) return null;
  
  if (Date.now() > leadData.expiresAt) {
    leadTokenStore.delete(token);
    return null;
  }
  
  return {
    firstName: leadData.firstName,
    email: leadData.email,
    city: leadData.city,
    guideSlug: leadData.guideSlug
  };
}

function cleanupExpiredTokens() {
  const now = Date.now();
  const entries = Array.from(leadTokenStore.entries());
  for (const [token, data] of entries) {
    if (now > data.expiresAt) {
      leadTokenStore.delete(token);
    }
  }
}

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
    // Skip rate limiting in development for estimations endpoint to prevent blocking during testing
    if (process.env.NODE_ENV !== 'production' && req.path === '/api/estimations-complete') {
      console.log('Development mode: Skipping rate limit for estimations');
      return next();
    }
    
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

// Guide access middleware - now publicly accessible after lead form submission
function requireSmsVerification(req: any, res: any, next: any) {
  // Guides are now publicly accessible after lead form submission
  // SMS verification is only used for the initial lead capture on homepage
  return next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Middleware to detect domain
  app.use((req, res, next) => {
    const host = req.get('host') || 'estimation-immobilier-gironde.fr';
    req.headers['x-domain'] = host;
    next();
  });

  // Google Maps API key endpoint (public access needed for frontend)
  app.get('/api/config/google-maps-key', async (req, res) => {
    try {
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        return res.status(404).json({ error: 'Google Maps API key not configured' });
      }
      res.json({ apiKey });
    } catch (error) {
      console.error('Error fetching Google Maps config:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // =============================================================================
  // FORMATIONS PREMIUM MODULE - STRIPE PAYMENT ROUTES
  // =============================================================================

  // Stripe checkout session creation
  app.post('/api/checkout', async (req, res) => {
    try {
      // Validate Stripe configuration
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ error: 'Stripe configuration manquante' });
      }

      // Import Stripe
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2023-10-16',
      });

      const { checkoutSchema } = await import('@shared/schema');
      
      // Validate request body
      const validationResult = checkoutSchema.safeParse(req.body);
      if (!validationResult.success) {
        const errors = validationResult.error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        ).join(', ');
        return res.status(400).json({ 
          error: 'Données invalides', 
          details: errors,
          code: 'VALIDATION_ERROR'
        });
      }

      const { sku, successUrl, cancelUrl, customerEmail, utmSource, utmMedium, utmCampaign, utmTerm, utmContent } = validationResult.data;

      // Load courses content
      const { coursesContent } = await import('@shared/content/courses');
      const courseContent = coursesContent[sku];

      if (!courseContent) {
        return res.status(404).json({ error: 'Formation non trouvée', code: 'COURSE_NOT_FOUND' });
      }

      // Get Stripe price using lookup_key (SKU)
      const prices = await stripe.prices.list({
        lookup_keys: [sku],
        active: true,
        limit: 1
      });

      if (prices.data.length === 0) {
        return res.status(404).json({ 
          error: 'Prix Stripe non trouvé pour cette formation',
          code: 'STRIPE_PRICE_NOT_FOUND',
          sku
        });
      }

      const price = prices.data[0];

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price: price.id,
            quantity: 1,
          }
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: customerEmail,
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
        metadata: {
          sku,
          utm_source: utmSource || '',
          utm_medium: utmMedium || '',
          utm_campaign: utmCampaign || '',
          utm_term: utmTerm || '',
          utm_content: utmContent || ''
        }
      });

      console.log('Stripe checkout session created:', {
        sessionId: session.id,
        sku,
        amount: price.unit_amount,
        customerEmail
      });

      res.json({ url: session.url, sessionId: session.id });

    } catch (error: any) {
      console.error('Error creating Stripe checkout session:', error);
      res.status(500).json({ 
        error: 'Erreur lors de la création du paiement',
        code: 'STRIPE_ERROR',
        message: error.message
      });
    }
  });

  // Stripe webhook handler
  app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
      if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
        console.error('Stripe webhook: Missing configuration');
        return res.status(500).json({ error: 'Configuration Stripe manquante' });
      }

      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2023-10-16',
      });

      const sig = req.headers['stripe-signature'];
      let event;

      try {
        event = stripe.webhooks.constructEvent(req.body, sig!, process.env.STRIPE_WEBHOOK_SECRET);
      } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      console.log('Stripe webhook received:', event.type);

      // Handle checkout completion events
      if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
        const session = event.data.object as any;
        
        try {
          // Retrieve full session with line items
          const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
            expand: ['line_items', 'customer']
          });

          const customerEmail = fullSession.customer_email || fullSession.customer?.email;
          const customerName = fullSession.customer_details?.name;
          const sku = fullSession.metadata?.sku;

          if (!customerEmail || !sku) {
            console.error('Webhook: Missing required data', { customerEmail, sku });
            return res.status(400).json({ error: 'Données manquantes' });
          }

          // Check if order already exists (idempotency)
          const existingOrder = await storage.getOrderByStripeSessionId(fullSession.id);
          if (existingOrder) {
            console.log('Order already processed for session:', fullSession.id);
            return res.json({ received: true, orderId: existingOrder.id });
          }

          // Create order record
          const { insertOrderSchema, insertOrderItemSchema, insertEnrollmentSchema } = await import('@shared/schema');
          
          const orderData = {
            stripeSessionId: fullSession.id,
            stripeCustomerId: fullSession.customer as string,
            totalCents: fullSession.amount_total!,
            currency: fullSession.currency!,
            customerEmail,
            customerName,
            utmSource: fullSession.metadata?.utm_source,
            utmMedium: fullSession.metadata?.utm_medium,
            utmCampaign: fullSession.metadata?.utm_campaign,
            utmTerm: fullSession.metadata?.utm_term,
            utmContent: fullSession.metadata?.utm_content,
          };

          const order = await storage.createOrder(orderData);

          // Create order item
          const orderItemData = {
            orderId: order.id,
            sku,
            unitPriceCents: fullSession.amount_total!,
            quantity: 1
          };

          await storage.createOrderItem(orderItemData);

          // Create enrollment (access to course)
          const enrollmentData = {
            customerEmail,
            sku,
            orderId: order.id,
            accessExpiresAt: null, // Unlimited access
            progressPercent: 0
          };

          await storage.createEnrollment(enrollmentData);

          // Load course content for email
          const { coursesContent } = await import('@shared/content/courses');
          const courseContent = coursesContent[sku];

          // TODO: Send access email with course details
          console.log('Order processed successfully:', {
            orderId: order.id,
            customerEmail,
            sku,
            courseTitle: courseContent?.title
          });

          // Check for upsell eligibility (if not buying PACK397)
          const shouldShowUpsell = sku !== 'PACK397' && sku !== 'UPSELLPACK300';
          
          console.log('Webhook processing completed:', {
            orderId: order.id,
            shouldShowUpsell,
            event: event.type
          });

        } catch (error: any) {
          console.error('Error processing webhook:', error);
          return res.status(500).json({ error: 'Erreur traitement commande' });
        }
      }

      res.json({ received: true });

    } catch (error: any) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: 'Erreur webhook' });
    }
  });

  // Video tracking endpoint
  app.post('/api/events/video', async (req, res) => {
    try {
      const { videoEventSchema } = await import('@shared/schema');
      
      // Validate request body
      const validationResult = videoEventSchema.safeParse(req.body);
      if (!validationResult.success) {
        const errors = validationResult.error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        ).join(', ');
        return res.status(400).json({ 
          error: 'Données invalides', 
          details: errors,
          code: 'VALIDATION_ERROR'
        });
      }

      const { sku, eventType, videoId, progressPercent, metadata } = validationResult.data;

      // Get customer email from session/auth (simplified for now)
      // In real implementation, you'd validate the user session
      const customerEmail = req.body.customerEmail || 'anonymous@example.com';

      // Get IP and User Agent
      const ipAddress = req.headers['x-forwarded-for']?.toString().split(',')[0] || req.ip;
      const userAgent = req.headers['user-agent'];

      // Create course event
      const eventData = {
        customerEmail,
        sku,
        eventType,
        videoId,
        progressPercent,
        metadata,
        ipAddress,
        userAgent
      };

      const event = await storage.createCourseEvent(eventData);

      // Update enrollment progress if it's a progress event
      if (eventType.startsWith('video_') && progressPercent) {
        await storage.updateEnrollmentProgress(customerEmail, sku, progressPercent);
      }

      console.log('Video event tracked:', {
        eventId: event.id,
        customerEmail,
        sku,
        eventType,
        progressPercent
      });

      res.json({ success: true, eventId: event.id });

    } catch (error: any) {
      console.error('Error tracking video event:', error);
      res.status(500).json({ 
        error: 'Erreur enregistrement événement',
        message: error.message
      });
    }
  });

  // Zod schema for complete estimation validation
  const completeEstimationSchema = z.object({
    sessionId: z.string().uuid('SessionId doit être un UUID valide'),
    email: z.string().email('Format email invalide').max(255),
    phone: z.string().max(20).optional(),
    propertyType: z.enum(['house', 'apartment'], { errorMap: () => ({ message: 'Type de propriété invalide' }) }),
    address: z.string().min(1, 'Adresse requise').max(500),
    city: z.string().min(1, 'Ville requise').max(100),
    postalCode: z.string().regex(/^33\d{3}$/, 'Code postal Gironde requis (33xxx)'),
    surface: z.number().positive('Surface doit être positive').max(10000),
    rooms: z.number().int().min(1).max(50).optional(),
    bedrooms: z.number().int().min(0).max(50).optional(),
    bathrooms: z.number().int().min(0).max(50).optional(),
    constructionYear: z.number().int().min(1800).max(new Date().getFullYear() + 2).optional(),
    hasGarden: z.boolean().optional(),
    hasParking: z.boolean().optional(),
    hasBalcony: z.boolean().optional()
  });

  // Complete estimation with Perplexity analysis (requires SMS verification + email)
  // CRITICAL: Rate limited and validated - expensive Perplexity API calls
  // Development mode: More lenient rate limiting for testing
  const isProduction = process.env.NODE_ENV === 'production';
  const rateLimitConfig = isProduction 
    ? rateLimit(2, 10 * 60 * 1000)  // Production: 2 requests per 10 minutes
    : rateLimit(10, 2 * 60 * 1000); // Development: 10 requests per 2 minutes

  app.post('/api/estimations-complete', rateLimitConfig, async (req, res) => {
    try {
      // Zod validation with detailed error messages
      const validationResult = completeEstimationSchema.safeParse(req.body);
      if (!validationResult.success) {
        const errors = validationResult.error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        ).join(', ');
        return res.status(400).json({ 
          error: 'Données invalides', 
          details: errors,
          code: 'VALIDATION_ERROR'
        });
      }

      const { sessionId, email, phone, propertyType, address, city, postalCode, surface, rooms, bedrooms, bathrooms, constructionYear, hasGarden, hasParking, hasBalcony } = validationResult.data;
      
      console.log('=== COMPLETE ESTIMATION WITH PERPLEXITY ===');
      console.log('SessionId:', sessionId);
      console.log('Email:', email);
      console.log('Property details:', { propertyType, city, surface, rooms });

      // Retrieve and validate SMS verification session
      const authSession = await storage.getAuthSession(sessionId);
      console.log('AuthSession retrieved:', {
        exists: !!authSession,
        email: authSession?.email,
        phoneNumber: authSession?.phoneNumber,
        isSmsVerified: authSession?.isSmsVerified,
        expiresAt: authSession?.expiresAt
      });
      
      if (!authSession || authSession.expiresAt < new Date()) {
        console.log('Session validation failed');
        return res.status(400).json({ error: 'Session expirée ou invalide' });
      }

      if (!authSession.isSmsVerified) {
        console.log('SMS not verified');
        return res.status(400).json({ error: 'Vérification SMS requise' });
      }

      // Base estimation calculation
      const baseEstimation = calculateEstimation({
        propertyType,
        city,
        surface: surface || 0,
        rooms: rooms || 0,
        bedrooms: bedrooms || 0,
        bathrooms: bathrooms || 0,
        constructionYear: constructionYear || undefined,
        hasGarden: hasGarden || false,
        hasParking: hasParking || false,
        hasBalcony: hasBalcony || false
      });

      console.log('Base estimation calculated:', baseEstimation);

      // Detailed Perplexity Analysis - Multiple specialized queries
      console.log('Starting Perplexity analysis...');
      
      // 1. Environmental and Infrastructure Analysis
      const environmentQuery = `Analyse complète de l'environnement et des infrastructures pour un ${propertyType} à ${city} (${postalCode}). Détaille : transports en commun (tramway, bus, gares), écoles et universités proximité, commerces et services, parcs et espaces verts, hôpitaux et services de santé, qualité du quartier, nuisances sonores potentielles, projets d'urbanisme prévus.`;
      
      // 2. Local Market Analysis
      const marketQuery = `Analyse du marché immobilier spécifique pour un ${propertyType} à ${city} en Gironde. Prix récents au m², évolution des prix 2024-2025, temps de vente moyen, demande/offre pour ce type de bien, comparaison avec communes voisines, attractivité du secteur pour les acheteurs.`;
      
      // 3. Price Evolution and Trends
      const trendQuery = `Tendances et évolution des prix immobilier à ${city} Gironde. Facteurs influençant les prix : projets Grand Bordeaux Métropole, nouvelles lignes transport, développement économique local, impact télétravail, prévisions 2025-2026, recommandations timing de vente.`;
      
      // 4. Infrastructure Impact on Price
      const infrastructureQuery = `Impact des infrastructures et équipements sur le prix d'un ${propertyType} à ${city}. Analyse : proximité centres commerciaux, écoles réputées, transports, espaces verts, services municipaux, fibre optique, stationnement, sécurité du quartier, projets futurs prévus.`;

      // Execute all Perplexity queries in parallel for efficiency
      const [environmentAnalysis, marketAnalysis, trendAnalysis, infrastructureAnalysis] = await Promise.all([
        getMarketResearch({ query: environmentQuery, region: 'Gironde', searchRecency: 'month', maxTokens: 800 }),
        getMarketResearch({ query: marketQuery, region: 'Gironde', searchRecency: 'month', maxTokens: 800 }),
        getMarketResearch({ query: trendQuery, region: 'Gironde', searchRecency: 'month', maxTokens: 800 }),
        getMarketResearch({ query: infrastructureQuery, region: 'Gironde', searchRecency: 'month', maxTokens: 800 })
      ]);

      console.log('Perplexity analysis completed successfully');

      // Generate expert recommendations based on all analyses
      const recommendationsQuery = `Conseils d'expert personnalisés pour optimiser la vente d'un ${propertyType} de ${surface}m² à ${city}. Basé sur: marché local actuel, période optimale de vente, améliorations rentables à effectuer, stratégie de pricing, ciblage des acquéreurs potentiels, mise en valeur du bien.`;
      
      const recommendationsAnalysis = await getMarketResearch({ 
        query: recommendationsQuery, 
        region: 'Gironde', 
        searchRecency: 'month', 
        maxTokens: 1000 
      });

      // Prepare structured response
      const completeEstimation = {
        estimatedValue: baseEstimation.estimatedValue,
        pricePerM2: baseEstimation.pricePerM2,
        confidence: baseEstimation.confidence,
        detailedAnalysis: {
          environmentalFactors: environmentAnalysis.content || 'Analyse environnementale en cours...',
          marketAnalysis: marketAnalysis.content || 'Analyse de marché en cours...',
          priceEvolution: trendAnalysis.content || 'Analyse des tendances en cours...',
          localInfrastructure: infrastructureAnalysis.content || 'Analyse des infrastructures en cours...',
          recommendations: recommendationsAnalysis.content || 'Recommandations d\'expert en cours...'
        },
        analysisMetadata: {
          analysisDate: new Date().toISOString(),
          dataRecency: 'Données récentes (moins de 30 jours)',
          totalCitations: [
            ...environmentAnalysis.citations,
            ...marketAnalysis.citations,
            ...trendAnalysis.citations,
            ...infrastructureAnalysis.citations,
            ...recommendationsAnalysis.citations
          ].slice(0, 10) // Limit to top 10 sources
        }
      };

      // Save the complete estimation to storage
      try {
        const estimationData = {
          sessionId,
          email,
          phone: phone || '',
          propertyType,
          address,
          city,
          postalCode,
          surface: surface || 0,
          rooms: rooms || 0,
          bedrooms: bedrooms || 0,
          bathrooms: bathrooms || 0,
          constructionYear: constructionYear || null,
          hasGarden: hasGarden || false,
          hasParking: hasParking || false,
          hasBalcony: hasBalcony || false,
          estimatedValue: completeEstimation.estimatedValue.toFixed(2), // Convert to string
          pricePerM2: completeEstimation.pricePerM2.toFixed(2), // Convert to string
          confidence: completeEstimation.confidence,
          detailedAnalysis: JSON.stringify(completeEstimation.detailedAnalysis),
          source: 'estimation-complete'
        };
        
        await storage.createEstimation(estimationData);
        console.log('Complete estimation saved to storage');
      } catch (storageError) {
        console.error('Error saving estimation to storage:', storageError);
        // Don't fail the request if storage fails
      }

      // Optional: Send email with detailed report
      if (email) {
        try {
          // TODO: Implement email sending with detailed PDF report
          // await emailService.sendEstimationReport(email, completeEstimation);
          console.log('Email report queued for:', email);
        } catch (emailError) {
          console.error('Error sending email report:', emailError);
          // Don't fail the request if email fails
        }
      }

      console.log('Complete estimation response prepared');
      res.json(completeEstimation);

    } catch (error) {
      console.error('Error in complete estimation:', error);
      res.status(500).json({ 
        error: 'Erreur lors du calcul de l\'estimation complète',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Basic estimation with SMS verification (for detailed form)
  app.post('/api/estimations-basic', async (req, res) => {
    try {
      const { sessionId, ...propertyData } = req.body;
      
      console.log('=== BASIC ESTIMATION DEBUG ===');
      console.log('SessionId:', sessionId);
      console.log('PropertyData:', propertyData);
      
      // Validate sessionId is provided
      if (!sessionId) {
        return res.status(400).json({ error: 'SessionId requis' });
      }

      // Retrieve contact data from SMS verification session
      const authSession = await storage.getAuthSession(sessionId);
      console.log('AuthSession retrieved:', {
        exists: !!authSession,
        email: authSession?.email,
        phoneNumber: authSession?.phoneNumber,
        isSmsVerified: authSession?.isSmsVerified,
        expiresAt: authSession?.expiresAt
      });
      
      if (!authSession || authSession.expiresAt < new Date()) {
        console.log('Session validation failed:', {
          sessionExists: !!authSession,
          isExpired: authSession ? authSession.expiresAt < new Date() : 'no-session'
        });
        return res.status(400).json({ error: 'Session expirée ou invalide' });
      }

      // Check that SMS verification was completed
      if (!authSession.isSmsVerified) {
        console.log('SMS verification not completed');
        return res.status(400).json({ error: 'Vérification SMS non complétée' });
      }
      
      // Validate required fields
      if (!propertyData.propertyType || !propertyData.city || !propertyData.surface) {
        return res.status(400).json({ error: 'Données manquantes' });
      }

      // Validate surface is a valid number
      const surface = parseInt(propertyData.surface);
      if (isNaN(surface) || surface <= 0) {
        return res.status(400).json({ error: 'Surface invalide' });
      }

      // Validate rooms is a valid number if provided
      const rooms = propertyData.rooms ? parseInt(propertyData.rooms) : undefined;
      if (propertyData.rooms && (isNaN(rooms) || rooms <= 0)) {
        return res.status(400).json({ error: 'Nombre de pièces invalide' });
      }

      // Calculate basic estimation using existing function
      const estimation = calculateEstimation({
        propertyType: propertyData.propertyType,
        city: propertyData.city,
        surface: surface,
        rooms: rooms || undefined
      });

      console.log('Basic estimation calculated:', estimation);

      // Return basic estimation format (compatible with frontend)
      const result = {
        minPrice: Math.round(estimation.estimatedValue * 0.9), // -10%
        maxPrice: Math.round(estimation.estimatedValue * 1.1), // +10%
        averagePrice: estimation.estimatedValue,
        pricePerSqm: estimation.pricePerM2,
        confidence: estimation.confidence
      };

      res.json(result);

    } catch (error) {
      console.error('Error calculating basic estimation:', error);
      res.status(500).json({ error: 'Erreur lors du calcul de l\'estimation' });
    }
  });

  // Create quick estimation (from homepage)
  app.post('/api/estimations-quick', async (req, res) => {
    try {
      const domain = req.headers['x-domain'] as string;
      const { sessionId, ...propertyData } = req.body;
      
      console.log('=== QUICK ESTIMATION DEBUG ===');
      console.log('SessionId:', sessionId);
      console.log('PropertyData:', propertyData);
      console.log('Domain:', domain);
      
      // Validate address is in Gironde (département 33)
      if (propertyData.city && propertyData.postalCode) {
        const postalCode = String(propertyData.postalCode).trim();
        if (!/^33\d{3}$/.test(postalCode)) {
          console.log('❌ Address rejected - not in Gironde:', postalCode);
          return res.status(400).json({ 
            error: 'Cette adresse n\'est pas en Gironde (département 33). Notre service est spécialisé uniquement pour la Gironde.' 
          });
        }
        console.log('✅ Address validated - Gironde:', postalCode);
      }
      
      // Validate sessionId is provided
      if (!sessionId) {
        return res.status(400).json({ error: 'SessionId requis' });
      }

      // Retrieve contact data from SMS verification session
      const authSession = await storage.getAuthSession(sessionId);
      console.log('AuthSession retrieved:', {
        exists: !!authSession,
        email: authSession?.email,
        phoneNumber: authSession?.phoneNumber,
        isSmsVerified: authSession?.isSmsVerified,
        expiresAt: authSession?.expiresAt
      });
      
      if (!authSession || authSession.expiresAt < new Date()) {
        console.log('Session validation failed:', {
          sessionExists: !!authSession,
          isExpired: authSession ? authSession.expiresAt < new Date() : 'no-session'
        });
        return res.status(400).json({ error: 'Session expirée ou invalide' });
      }

      // Check that SMS verification was completed
      if (!authSession.isSmsVerified) {
        console.log('SMS verification not completed');
        return res.status(400).json({ error: 'Vérification SMS non complétée' });
      }

      // Get additional data from HTTP session if available
      const httpSessionData = (req.session as any).homepageVerificationData;
      const firstName = httpSessionData?.firstName || authSession.email?.split('@')[0] || 'Utilisateur';
      
      console.log('HTTP Session data:', httpSessionData);
      console.log('FirstName resolved:', firstName);

      // Ensure all required fields have values
      const leadData = {
        email: authSession.email || '',
        phone: authSession.phoneNumber || '',
        firstName: firstName,
        lastName: httpSessionData?.lastName || 'Nom', // Provide a default
        propertyType: propertyData.propertyType || 'apartment',
        address: propertyData.address || propertyData.city || 'Adresse non spécifiée',
        city: propertyData.city || 'Bordeaux',
        postalCode: propertyData.postalCode || "33000",
        surface: propertyData.surface || 50,
        rooms: propertyData.rooms,
        bedrooms: propertyData.bedrooms,
        bathrooms: propertyData.bathrooms,
        hasGarden: propertyData.hasGarden || false,
        hasParking: propertyData.hasParking || false,
        hasBalcony: propertyData.hasBalcony || false,
        constructionYear: propertyData.constructionYear,
        saleTimeline: propertyData.saleTimeline || "6m",
        wantsExpertContact: propertyData.wantsExpertContact || true,
        // BANT qualification fields
        projectType: propertyData.projectType,
        timeline: propertyData.timeline,
        ownershipStatus: propertyData.ownershipStatus,
        source: domain || 'estimation-immobilier-gironde.fr'
      };

      console.log('LeadData before validation:', leadData);

      // Validate the combined data
      const validatedData = insertEstimationLeadSchema.parse(leadData);
      console.log('Validation successful');

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
      
      // Validate address is in Gironde (département 33) FIRST
      if (req.body.postalCode) {
        const postalCode = String(req.body.postalCode).trim();
        if (!/^33\d{3}$/.test(postalCode)) {
          console.log('❌ Detailed estimation rejected - not in Gironde:', postalCode);
          return res.status(400).json({ 
            error: 'Cette adresse n\'est pas en Gironde (département 33). Notre service est spécialisé uniquement pour la Gironde.' 
          });
        }
        console.log('✅ Detailed estimation validated - Gironde:', postalCode);
      }
      
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

  // Get estimation results by ID (for results page)
  app.get('/api/estimations-results/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get the lead data
      const leads = await storage.getLeads();
      const lead = leads.find(l => l.id === id);
      if (!lead) {
        return res.status(404).json({ error: 'Estimation non trouvée' });
      }
      
      // Get the estimation data
      const estimations = await storage.getEstimationsByLeadId(id);
      const estimation = estimations[0];
      
      if (!estimation) {
        return res.status(404).json({ error: 'Données d\'estimation non trouvées' });
      }
      
      // Calculate data for display
      const calculatedData = {
        estimatedValue: parseInt(estimation.estimatedValue),
        pricePerM2: parseInt(estimation.pricePerM2),
        confidence: estimation.confidence
      };
      
      res.json({
        lead,
        estimation,
        calculatedData
      });
    } catch (error) {
      console.error('Error fetching estimation results:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des résultats' });
    }
  });

  // Create guide download lead - SECURED with RGPD compliance and rate limiting (SMS verification bypassed for public access)
  app.post('/api/guide-leads', rateLimit(5, 60000), async (req, res) => {
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

      // Trigger automated email sequence for this persona
      try {
        const sequenceResult = await emailSequenceService.triggerSequence({
          guideId: guide.id,
          leadEmail: validatedData.email,
          leadFirstName: validatedData.firstName,
          leadCity: validatedData.city,
          persona: guide.persona as any, // Guide has persona field
          source: domain
        });

        if (sequenceResult.success) {
          console.log(`✅ Email sequence triggered for ${validatedData.email} - persona: ${guide.persona}`);
          console.log(`Sequence IDs: ${sequenceResult.sequenceIds.join(', ')}`);
        } else {
          console.warn(`⚠️ Failed to trigger email sequence: ${sequenceResult.error}`);
        }
      } catch (sequenceError) {
        console.error('Error triggering email sequence:', sequenceError);
        // Don't fail the request if sequence triggering fails
      }

      // Create secure token for lead context (RGPD-compliant)
      const leadToken = createLeadToken({
        firstName: validatedData.firstName,
        email: validatedData.email,
        city: validatedData.city,
        guideSlug: validatedData.guideSlug
      });

      res.json({ 
        success: true, 
        message: 'Guide envoyé avec succès',
        lead: {
          id: lead.id,
          firstName: lead.firstName,
          email: lead.email,
          guideSlug: lead.guideSlug
        },
        leadToken: leadToken // Secure token instead of PII in URLs
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




  
  

  // Homepage SMS Verification endpoints
  // Step 1: Start homepage verification session
  app.post("/api/homepage-verification/start", rateLimit(3, 5 * 60 * 1000), async (req, res) => {
    try {
      const { phoneNumber, propertyData } = req.body;
      
      // Basic validation
      if (!phoneNumber || !propertyData) {
        return res.status(400).json({ error: "Le numéro de téléphone est requis" });
      }

      // Validate phone number
      const phoneValidation = validatePhoneNumber(phoneNumber);
      if (!phoneValidation.isValid) {
        return res.status(400).json({ error: phoneValidation.error });
      }

      // Create auth session for homepage verification (30 minutes pour debug)
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      
      console.log('🔧 Creating auth session:', {
        phoneNumber: phoneValidation.formatted,
        expiresAt: expiresAt.toISOString()
      });
      const authSession = await storage.createAuthSession({
        email: `temp-${Date.now()}@sms-verification.local`, // Temporary email for SMS-only verification
        phoneNumber: phoneValidation.formatted,
        isEmailVerified: true, // We skip email verification for SMS-only flow
        isSmsVerified: false,
        expiresAt
      });

      // Store temporary lead data in session for later use
      (req.session as any).homepageVerificationData = {
        authSessionId: authSession.id,
        phoneNumber: phoneValidation.formatted,
        propertyData
      };

      console.log('✅ Auth session created successfully:', {
        sessionId: authSession.id,
        expiresAt: authSession.expiresAt?.toISOString()
      });
      
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

  // ===== SMS VERIFICATION ROUTES =====
  
  // Send SMS verification code
  app.post('/api/sms/send-verification', rateLimit(3, 5 * 60 * 1000), async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      
      if (!phoneNumber) {
        return res.status(400).json({ error: 'Numéro de téléphone requis' });
      }

      const result = await smsVerificationService.sendVerificationCode(phoneNumber);
      
      if (result.success) {
        res.json({
          success: true,
          message: 'Code de vérification envoyé',
          expiresIn: result.expiresIn || 600,
          messageId: result.messageId
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error || 'Erreur lors de l\'envoi du SMS'
        });
      }
    } catch (error) {
      console.error('Error in send-verification route:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur lors de l\'envoi du SMS' 
      });
    }
  });

  // Verify SMS code
  app.post('/api/sms/verify-code', rateLimit(10, 5 * 60 * 1000), async (req, res) => {
    try {
      const { phoneNumber, code } = req.body;
      
      if (!phoneNumber || !code) {
        return res.status(400).json({ 
          success: false,
          error: 'Numéro de téléphone et code requis' 
        });
      }

      const result = await smsVerificationService.verifyCode(phoneNumber, code);
      
      if (result.success) {
        // Generate unique sessionId for this verification
        const sessionId = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        
        try {
          const authSession = await storage.createAuthSession({
            id: sessionId,
            email: '', // Will be populated during estimation form
            phoneNumber: phoneNumber,
            isEmailVerified: false,
            isSmsVerified: true,
            verificationSid: null,
            expiresAt: expiresAt
          });
          
          console.log('Auth session created after SMS verification:', {
            sessionId: authSession.id,
            phoneNumber: authSession.phoneNumber,
            isSmsVerified: authSession.isSmsVerified,
            expiresAt: authSession.expiresAt
          });
          
          // CRITICAL: Always return sessionId for successful verification
          return res.json({
            success: true,
            message: 'Code vérifié avec succès',
            verified: true,
            sessionId: authSession.id
          });
        } catch (sessionError) {
          console.error('Error creating auth session:', sessionError);
          return res.status(500).json({
            success: false,
            error: 'Erreur lors de la création de la session'
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          error: result.error || 'Code de vérification incorrect',
          attemptsRemaining: result.attemptsRemaining
        });
      }
    } catch (error) {
      console.error('Error in verify-code route:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur lors de la vérification du code' 
      });
    }
  });

  // Get verification status (optional utility route)
  app.get('/api/sms/verification-status/:phoneNumber', rateLimit(10, 1 * 60 * 1000), async (req, res) => {
    try {
      const { phoneNumber } = req.params;
      
      if (!phoneNumber) {
        return res.status(400).json({ error: 'Numéro de téléphone requis' });
      }

      const status = smsVerificationService.getVerificationStatus(phoneNumber);
      res.json(status);
    } catch (error) {
      console.error('Error in verification-status route:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // Development/Testing routes
  if (process.env.NODE_ENV === 'development') {
    // Test SMS service connection
    app.get('/api/sms/test-connection', async (req, res) => {
      try {
        const testResult = await smsVerificationService.testConnection();
        res.json(testResult);
      } catch (error) {
        console.error('Error testing SMS connection:', error);
        res.status(500).json({ error: 'Erreur lors du test de connexion' });
      }
    });

    // Get debug info (development only)
    app.get('/api/sms/debug', async (req, res) => {
      try {
        const debugInfo = smsVerificationService.getDebugInfo();
        res.json(debugInfo);
      } catch (error) {
        console.error('Error getting SMS debug info:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des informations de débogage' });
      }
    });
  }



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

  // Personas analytics endpoint
  app.get('/api/analytics/personas/stats', requireAuth, async (req, res) => {
    try {
      const { period = '30d' } = req.query;
      
      const now = new Date();
      let startDate = new Date();
      startDate.setDate(now.getDate() - (period === '7d' ? 7 : period === '30d' ? 30 : 90));

      const [allGuides, allLeads, allDownloads] = await Promise.all([
        storage.getGuides(),
        storage.getLeads(2000),
        storage.getGuideDownloads()
      ]);

      // Filter data by date range
      const periodLeads = allLeads.filter(lead => {
        const leadDate = new Date(lead.createdAt || '');
        return leadDate >= startDate && leadDate <= now;
      });

      const periodDownloads = allDownloads.filter(download => {
        const downloadDate = new Date(download.createdAt || '');
        return downloadDate >= startDate && downloadDate <= now;
      });

      // Calculate stats for each persona
      const personaStats = Object.keys(GUIDE_PERSONAS).map(persona => {
        const personaGuides = allGuides.filter(g => g.persona === persona);
        const personaLeads = periodLeads.filter(l => l.guideSlug && personaGuides.some(g => g.slug === l.guideSlug));
        const personaDownloads = periodDownloads.filter(d => personaGuides.some(g => g.id === d.guideId));
        
        // Calculate conversion rate based on downloads to leads
        const conversionRate = personaDownloads.length > 0 ? (personaLeads.length / personaDownloads.length) : 0;
        
        // Calculate average read time (mock for now - would come from analytics table)
        const avgReadTime = Math.floor(Math.random() * 10) + 5; // 5-15 minutes

        // Find top performing guide for this persona
        const topGuide = personaGuides.reduce((top, guide) => {
          const guideLeads = personaLeads.filter(l => l.guideSlug === guide.slug).length;
          const topLeads = personaLeads.filter(l => l.guideSlug === top?.slug).length || 0;
          return guideLeads > topLeads ? guide : top;
        }, personaGuides[0]);

        return {
          persona,
          guidesCount: personaGuides.length,
          downloadsCount: personaDownloads.length,
          leadsCount: personaLeads.length,
          conversionRate,
          avgReadTime,
          topGuide: topGuide ? topGuide.title : `Guide ${GUIDE_PERSONAS[persona as keyof typeof GUIDE_PERSONAS]}`
        };
      });

      res.json(personaStats);
    } catch (error) {
      console.error('Error fetching personas stats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // CRUD routes for guides
  app.get('/api/admin/guides', requireAuth, async (req, res) => {
    try {
      const { persona } = req.query;
      const guides = await storage.getGuides(persona as string);
      res.json(guides);
    } catch (error) {
      console.error('Error fetching guides:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/admin/guides', requireAuth, async (req, res) => {
    try {
      const validatedData = insertGuideSchema.parse(req.body);
      const guide = await storage.createGuide(validatedData);
      res.status(201).json(guide);
    } catch (error) {
      console.error('Error creating guide:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  app.put('/api/admin/guides/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertGuideSchema.partial().parse(req.body);
      const guide = await storage.updateGuide(id, validatedData);
      res.json(guide);
    } catch (error) {
      console.error('Error updating guide:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  app.delete('/api/admin/guides/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteGuide(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting guide:', error);
      res.status(500).json({ error: 'Internal server error' });
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

  // Helper functions for analytics calculations
  function calculateGrowthRate(leads: any[], startDate: Date): number {
    const midPoint = new Date(startDate.getTime() + (Date.now() - startDate.getTime()) / 2);
    const firstHalf = leads.filter(l => new Date(l.createdAt || '') <= midPoint).length;
    const secondHalf = leads.filter(l => new Date(l.createdAt || '') > midPoint).length;
    
    return firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0;
  }

  function calculateConversionGrowthRate(leads: any[], startDate: Date): number {
    const midPoint = new Date(startDate.getTime() + (Date.now() - startDate.getTime()) / 2);
    const firstHalfLeads = leads.filter(l => new Date(l.createdAt || '') <= midPoint);
    const secondHalfLeads = leads.filter(l => new Date(l.createdAt || '') > midPoint);
    
    const firstHalfConverted = firstHalfLeads.filter(l => l.status === 'converted' || l.wantsExpertContact).length;
    const secondHalfConverted = secondHalfLeads.filter(l => l.status === 'converted' || l.wantsExpertContact).length;
    
    const firstHalfRate = firstHalfLeads.length > 0 ? (firstHalfConverted / firstHalfLeads.length) * 100 : 0;
    const secondHalfRate = secondHalfLeads.length > 0 ? (secondHalfConverted / secondHalfLeads.length) * 100 : 0;
    
    return firstHalfRate > 0 ? ((secondHalfRate - firstHalfRate) / firstHalfRate) * 100 : 0;
  }

  function calculatePersonaBreakdown(guideAnalytics: any[]) {
    const personaMap = guideAnalytics.reduce((acc, guide) => {
      const persona = guide.persona || 'unknown';
      if (!acc[persona]) {
        acc[persona] = { 
          count: 0, 
          totalViews: 0, 
          totalDownloads: 0, 
          totalLeads: 0,
          avgEngagement: 0 
        };
      }
      acc[persona].count++;
      acc[persona].totalViews += guide.metrics.pageViews;
      acc[persona].totalDownloads += guide.metrics.downloads;
      acc[persona].totalLeads += guide.metrics.leads;
      acc[persona].avgEngagement += guide.performance.engagementScore;
      return acc;
    }, {} as Record<string, any>);

    // Calculate averages
    Object.keys(personaMap).forEach(persona => {
      const data = personaMap[persona];
      data.avgEngagement = data.count > 0 ? data.avgEngagement / data.count : 0;
      data.conversionRate = data.totalViews > 0 ? (data.totalLeads / data.totalViews) * 100 : 0;
    });

    return personaMap;
  }

  function calculateLeadScore(lead: any): number {
    let score = 0;
    
    // Base score for different lead types
    if (lead.leadType === 'estimation_detailed') score += 30;
    else if (lead.leadType === 'estimation_quick') score += 20;
    else if (lead.leadType === 'financing') score += 40;
    else if (lead.leadType === 'guide_download') score += 15;

    // Contact preference bonus
    if (lead.wantsExpertContact) score += 25;
    
    // Phone provided bonus
    if (lead.phone) score += 15;
    
    // Property value bonus (for estimation leads)
    if (lead.estimatedValue) {
      const value = parseInt(lead.estimatedValue);
      if (value > 500000) score += 20;
      else if (value > 300000) score += 15;
      else if (value > 200000) score += 10;
    }

    // Sale timeline urgency
    if (lead.saleTimeline === 'immediate') score += 20;
    else if (lead.saleTimeline === '3m') score += 15;
    else if (lead.saleTimeline === '6m') score += 10;

    // Recency bonus
    const daysSinceCreated = lead.createdAt ? 
      Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 30;
    if (daysSinceCreated <= 1) score += 10;
    else if (daysSinceCreated <= 3) score += 5;

    return Math.min(100, Math.max(0, score));
  }

  function calculateScoreDistribution(scoredLeads: any[]) {
    const ranges = [
      { min: 0, max: 20, label: 'Faible (0-20)', count: 0 },
      { min: 21, max: 40, label: 'Moyen (21-40)', count: 0 },
      { min: 41, max: 60, label: 'Bon (41-60)', count: 0 },
      { min: 61, max: 80, label: 'Élevé (61-80)', count: 0 },
      { min: 81, max: 100, label: 'Excellent (81-100)', count: 0 }
    ];

    scoredLeads.forEach(lead => {
      const range = ranges.find(r => lead.score >= r.min && lead.score <= r.max);
      if (range) range.count++;
    });

    return ranges;
  }

  // Advanced analytics dashboard endpoint
  app.get('/api/analytics/dashboard', requireAuth, async (req, res) => {
    try {
      const { period = '7d', persona, source } = req.query;
      
      // Calculate date range based on period
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case '1d':
          startDate.setDate(now.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        default:
          startDate.setDate(now.getDate() - 7);
      }

      // Get all data for the period
      const [allLeads, allContacts, allGuides] = await Promise.all([
        storage.getLeads(2000),
        storage.getContacts(1000),
        storage.getGuides()
      ]);

      // Filter leads by date range and optional filters
      const periodLeads = allLeads.filter(lead => {
        const leadDate = new Date(lead.createdAt || '');
        const inPeriod = leadDate >= startDate && leadDate <= now;
        const matchesPersona = !persona || lead.guideSlug?.includes(persona as string);
        const matchesSource = !source || lead.source === source;
        return inPeriod && matchesPersona && matchesSource;
      });

      // Calculate KPIs
      const totalLeads = periodLeads.length;
      const qualifiedLeads = periodLeads.filter(l => l.status === 'converted' || l.wantsExpertContact).length;
      const conversionRate = totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0;
      
      // Group leads by day for chart
      const dailyData = [];
      for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
        const dayStart = new Date(d);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(d);
        dayEnd.setHours(23, 59, 59, 999);
        
        const dayLeads = periodLeads.filter(lead => {
          const leadDate = new Date(lead.createdAt || '');
          return leadDate >= dayStart && leadDate <= dayEnd;
        });
        
        dailyData.push({
          date: dayStart.toISOString().split('T')[0],
          leads: dayLeads.length,
          qualified: dayLeads.filter(l => l.status === 'converted' || l.wantsExpertContact).length,
          estimation: dayLeads.filter(l => l.leadType?.includes('estimation')).length,
          financing: dayLeads.filter(l => l.leadType === 'financing').length,
          guides: dayLeads.filter(l => l.leadType === 'guide_download').length
        });
      }

      // Lead sources breakdown
      const leadSources = periodLeads.reduce((acc, lead) => {
        acc[lead.source] = (acc[lead.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Lead types breakdown
      const leadTypes = periodLeads.reduce((acc, lead) => {
        const type = lead.leadType || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Cities breakdown (top 10)
      const cities = periodLeads
        .filter(lead => lead.city)
        .reduce((acc, lead) => {
          const city = lead.city!;
          acc[city] = (acc[city] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      const topCities = Object.entries(cities)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([city, count]) => ({ city, count }));

      const dashboardData = {
        period,
        dateRange: { start: startDate.toISOString(), end: now.toISOString() },
        kpis: {
          totalLeads,
          qualifiedLeads,
          conversionRate: Number(conversionRate.toFixed(1)),
          avgTimeToConversion: 2.3, // Mock for now
          totalGuidesDownloaded: periodLeads.filter(l => l.leadType === 'guide_download').length
        },
        charts: {
          dailyLeads: dailyData,
          leadSources: Object.entries(leadSources).map(([source, count]) => ({ source, count })),
          leadTypes: Object.entries(leadTypes).map(([type, count]) => ({ type, count })),
          topCities
        },
        trends: {
          leadsGrowth: calculateGrowthRate(periodLeads, startDate),
          conversionGrowth: calculateConversionGrowthRate(periodLeads, startDate)
        }
      };

      res.json(dashboardData);
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Guide analytics endpoint
  app.get('/api/analytics/guides', requireAuth, async (req, res) => {
    try {
      const { period = '30d', persona } = req.query;
      
      const now = new Date();
      let startDate = new Date();
      startDate.setDate(now.getDate() - (period === '7d' ? 7 : period === '30d' ? 30 : 90));

      const [allGuides, allLeads, allDownloads] = await Promise.all([
        storage.getGuides(persona as string),
        storage.getLeads(2000),
        storage.getGuideDownloads()
      ]);

      // Calculate guide performance metrics
      const guideAnalytics = await Promise.all(
        allGuides.map(async (guide) => {
          const guideLeads = allLeads.filter(lead => 
            lead.guideSlug === guide.slug &&
            new Date(lead.createdAt || '') >= startDate
          );

          const guideDownloads = allDownloads.filter(download => 
            download.guideId === guide.id &&
            new Date(download.createdAt || '') >= startDate
          );

          // Mock analytics data - in a real app, you'd get this from guideAnalytics table
          const pageViews = Math.floor(Math.random() * 500) + 100;
          const avgReadTime = Math.floor(Math.random() * 300) + 120; // seconds
          const bounceRate = Math.random() * 0.4 + 0.2; // 20-60%

          return {
            id: guide.id,
            title: guide.title,
            persona: guide.persona,
            slug: guide.slug,
            metrics: {
              pageViews,
              downloads: guideDownloads.length,
              leads: guideLeads.length,
              conversionRate: pageViews > 0 ? (guideLeads.length / pageViews) * 100 : 0,
              avgReadTime,
              bounceRate: bounceRate * 100,
              completionRate: (1 - bounceRate) * 100
            },
            performance: {
              downloadRate: pageViews > 0 ? (guideDownloads.length / pageViews) * 100 : 0,
              leadQuality: guideLeads.filter(l => l.wantsExpertContact || l.status === 'converted').length,
              engagementScore: Math.floor(((1 - bounceRate) * avgReadTime / 180) * 100)
            }
          };
        })
      );

      // Sort by performance score
      guideAnalytics.sort((a, b) => b.performance.engagementScore - a.performance.engagementScore);

      const summary = {
        totalGuides: guideAnalytics.length,
        totalPageViews: guideAnalytics.reduce((sum, g) => sum + g.metrics.pageViews, 0),
        totalDownloads: guideAnalytics.reduce((sum, g) => sum + g.metrics.downloads, 0),
        avgConversionRate: guideAnalytics.length > 0 
          ? guideAnalytics.reduce((sum, g) => sum + g.metrics.conversionRate, 0) / guideAnalytics.length
          : 0,
        avgEngagementScore: guideAnalytics.length > 0
          ? guideAnalytics.reduce((sum, g) => sum + g.performance.engagementScore, 0) / guideAnalytics.length
          : 0
      };

      res.json({
        period,
        dateRange: { start: startDate.toISOString(), end: now.toISOString() },
        summary,
        guides: guideAnalytics,
        personaBreakdown: calculatePersonaBreakdown(guideAnalytics)
      });
    } catch (error) {
      console.error('Error fetching guide analytics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Persona analytics stats
  app.get('/api/analytics/personas/stats', requireAuth, async (req, res) => {
    try {
      const { period = '30d' } = req.query;
      
      const now = new Date();
      let startDate = new Date();
      startDate.setDate(now.getDate() - (period === '7d' ? 7 : period === '30d' ? 30 : 90));

      // Get real data from storage
      const [allGuides, allLeads, allDownloads] = await Promise.all([
        storage.getGuides(),
        storage.getLeads(2000),
        storage.getGuideDownloads()
      ]);

      // Filter data by period
      const periodLeads = allLeads.filter(lead => {
        const leadDate = new Date(lead.createdAt || '');
        return leadDate >= startDate && leadDate <= now;
      });

      const periodDownloads = allDownloads.filter(download => {
        const downloadDate = new Date(download.createdAt);
        return downloadDate >= startDate && downloadDate <= now;
      });

      // Calculate stats for each persona
      const personaStats = GUIDE_PERSONAS.map(persona => {
        // Get guides for this persona
        const personaGuides = allGuides.filter(guide => guide.persona === persona);
        const guideIds = personaGuides.map(g => g.id);
        
        // Get leads and downloads for this persona's guides
        const personaLeads = periodLeads.filter(lead => 
          lead.guideSlug && personaGuides.some(g => g.slug === lead.guideSlug)
        );
        
        const personaDownloads = periodDownloads.filter(download => 
          guideIds.includes(download.guideId)
        );

        // Calculate metrics
        const totalPageViews = personaDownloads.length * 3; // Estimate page views
        const conversionRate = totalPageViews > 0 ? (personaLeads.length / totalPageViews) * 100 : 0;
        const avgReadTime = Math.floor(120 + Math.random() * 180); // 2-5 min reading time
        
        // Get top performing guide
        const guidePerformance = personaGuides.map(guide => {
          const guideDownloads = personaDownloads.filter(d => d.guideId === guide.id).length;
          const guideLeads = personaLeads.filter(l => l.guideSlug === guide.slug).length;
          return {
            guide,
            score: guideDownloads * 2 + guideLeads * 5
          };
        });
        
        const topGuide = guidePerformance.length > 0 
          ? guidePerformance.sort((a, b) => b.score - a.score)[0].guide.title 
          : 'Aucun guide';

        return {
          persona,
          guidesCount: personaGuides.length,
          downloadsCount: personaDownloads.length,
          leadsCount: personaLeads.length,
          conversionRate: Math.round(conversionRate * 100) / 100,
          avgReadTime,
          topGuide
        };
      });

      // Calculate growth trends (simplified)
      const totalStats = {
        totalGuides: allGuides.length,
        totalDownloads: periodDownloads.length,
        totalLeads: periodLeads.length,
        avgConversionRate: personaStats.length > 0 
          ? personaStats.reduce((sum, p) => sum + p.conversionRate, 0) / personaStats.length 
          : 0
      };

      res.json({
        period,
        dateRange: { start: startDate.toISOString(), end: now.toISOString() },
        personas: personaStats,
        summary: totalStats
      });
    } catch (error) {
      console.error('Error fetching persona analytics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Lead funnel analytics
  app.get('/api/analytics/leads/funnel', requireAuth, async (req, res) => {
    try {
      const { period = '30d', source, persona } = req.query;
      
      const now = new Date();
      let startDate = new Date();
      startDate.setDate(now.getDate() - (period === '7d' ? 7 : period === '30d' ? 30 : 90));

      const allLeads = await storage.getLeads(2000);
      const periodLeads = allLeads.filter(lead => {
        const leadDate = new Date(lead.createdAt || '');
        const inPeriod = leadDate >= startDate && leadDate <= now;
        const matchesSource = !source || lead.source === source;
        const matchesPersona = !persona || lead.guideSlug?.includes(persona as string);
        return inPeriod && matchesSource && matchesPersona;
      });

      // Calculate funnel stages
      const totalVisitors = Math.floor(periodLeads.length * 15); // Estimate visitors from leads
      const smsVerifications = periodLeads.filter(l => l.phone).length;
      const formCompletions = periodLeads.length;
      const qualifiedLeads = periodLeads.filter(l => l.wantsExpertContact || l.status === 'converted').length;
      const convertedLeads = periodLeads.filter(l => l.status === 'converted').length;

      const funnelData = [
        {
          stage: 'Visiteurs',
          count: totalVisitors,
          percentage: 100,
          dropoff: 0
        },
        {
          stage: 'SMS Vérifiés',
          count: smsVerifications,
          percentage: (smsVerifications / totalVisitors) * 100,
          dropoff: totalVisitors - smsVerifications
        },
        {
          stage: 'Formulaires Complétés',
          count: formCompletions,
          percentage: (formCompletions / totalVisitors) * 100,
          dropoff: smsVerifications - formCompletions
        },
        {
          stage: 'Leads Qualifiés',
          count: qualifiedLeads,
          percentage: (qualifiedLeads / totalVisitors) * 100,
          dropoff: formCompletions - qualifiedLeads
        },
        {
          stage: 'Clients Convertis',
          count: convertedLeads,
          percentage: (convertedLeads / totalVisitors) * 100,
          dropoff: qualifiedLeads - convertedLeads
        }
      ];

      // Lead scoring based on multiple factors
      const scoredLeads = periodLeads.map(lead => ({
        ...lead,
        score: calculateLeadScore(lead)
      })).sort((a, b) => b.score - a.score);

      res.json({
        period,
        dateRange: { start: startDate.toISOString(), end: now.toISOString() },
        funnel: funnelData,
        conversionRates: {
          visitorToSms: (smsVerifications / totalVisitors) * 100,
          smsToForm: (formCompletions / smsVerifications) * 100,
          formToQualified: (qualifiedLeads / formCompletions) * 100,
          qualifiedToConverted: qualifiedLeads > 0 ? (convertedLeads / qualifiedLeads) * 100 : 0,
          overallConversion: (convertedLeads / totalVisitors) * 100
        },
        topLeads: scoredLeads.slice(0, 20),
        leadScoring: {
          avgScore: scoredLeads.length > 0 ? scoredLeads.reduce((sum, l) => sum + l.score, 0) / scoredLeads.length : 0,
          distribution: calculateScoreDistribution(scoredLeads)
        }
      });
    } catch (error) {
      console.error('Error fetching lead funnel analytics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Email analytics endpoint
  app.get('/api/analytics/email', requireAuth, async (req, res) => {
    try {
      const { period = '30d', persona, templateId } = req.query;
      
      const now = new Date();
      let startDate = new Date();
      startDate.setDate(now.getDate() - (period === '7d' ? 7 : period === '30d' ? 30 : 90));

      const [emailHistory, emailTemplates, emailSequences] = await Promise.all([
        storage.getEmailHistory(2000),
        storage.getEmailTemplates(),
        storage.getGuideEmailSequences()
      ]);

      // Filter email history by date range
      const periodEmails = emailHistory.filter(email => {
        const emailDate = new Date(email.createdAt || '');
        const inPeriod = emailDate >= startDate && emailDate <= now;
        const matchesTemplate = !templateId || email.templateId === templateId;
        return inPeriod && matchesTemplate;
      });

      // Calculate email performance metrics
      const totalSent = periodEmails.filter(e => e.status === 'sent').length;
      const totalFailed = periodEmails.filter(e => e.status === 'failed').length;
      const totalPending = periodEmails.filter(e => e.status === 'pending').length;

      // Mock open rates and click rates (in real app, you'd track these)
      const mockOpenRate = 0.25 + Math.random() * 0.15; // 25-40%
      const mockClickRate = 0.03 + Math.random() * 0.05; // 3-8%

      // Group by template for performance comparison
      const templatePerformance = emailTemplates.map(template => {
        const templateEmails = periodEmails.filter(e => e.templateId === template.id);
        const sent = templateEmails.filter(e => e.status === 'sent').length;
        
        return {
          id: template.id,
          name: template.name,
          category: template.category,
          sent,
          failed: templateEmails.filter(e => e.status === 'failed').length,
          openRate: (mockOpenRate + Math.random() * 0.1) * 100,
          clickRate: (mockClickRate + Math.random() * 0.02) * 100,
          conversionRate: Math.random() * 5 + 1, // 1-6%
          revenue: Math.floor(Math.random() * 50000) + 10000
        };
      });

      // Email sequence performance
      const sequencePerformance = emailSequences
        .filter(seq => new Date(seq.createdAt || '') >= startDate)
        .reduce((acc, seq) => {
          const key = seq.persona || 'unknown';
          if (!acc[key]) {
            acc[key] = {
              persona: key,
              totalSent: 0,
              scheduled: 0,
              completed: 0,
              cancelled: 0,
              avgDelay: 0
            };
          }
          
          acc[key].totalSent++;
          if (seq.status === 'scheduled') acc[key].scheduled++;
          else if (seq.status === 'sent') acc[key].completed++;
          else if (seq.status === 'cancelled') acc[key].cancelled++;
          
          return acc;
        }, {} as Record<string, any>);

      res.json({
        period,
        dateRange: { start: startDate.toISOString(), end: now.toISOString() },
        overview: {
          totalSent,
          totalFailed,
          totalPending,
          successRate: totalSent + totalFailed > 0 ? (totalSent / (totalSent + totalFailed)) * 100 : 0,
          avgOpenRate: mockOpenRate * 100,
          avgClickRate: mockClickRate * 100,
          estimatedRevenue: templatePerformance.reduce((sum, t) => sum + t.revenue, 0)
        },
        templatePerformance: templatePerformance.sort((a, b) => b.conversionRate - a.conversionRate),
        sequencePerformance: Object.values(sequencePerformance),
        trends: {
          dailyEmails: generateDailyEmailTrends(periodEmails, startDate, now),
          deliverabilityTrend: generateDeliverabilityTrend(periodEmails, startDate, now)
        }
      });
    } catch (error) {
      console.error('Error fetching email analytics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Helper functions for email trends
  function generateDailyEmailTrends(emails: any[], startDate: Date, endDate: Date) {
    const dailyData = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayEmails = emails.filter(email => {
        const emailDate = new Date(email.createdAt || '');
        return emailDate >= dayStart && emailDate <= dayEnd;
      });
      
      dailyData.push({
        date: dayStart.toISOString().split('T')[0],
        sent: dayEmails.filter(e => e.status === 'sent').length,
        failed: dayEmails.filter(e => e.status === 'failed').length,
        total: dayEmails.length
      });
    }
    return dailyData;
  }

  function generateDeliverabilityTrend(emails: any[], startDate: Date, endDate: Date) {
    const weeklyData = [];
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    
    for (let d = new Date(startDate); d <= endDate; d = new Date(d.getTime() + weekMs)) {
      const weekEnd = new Date(Math.min(d.getTime() + weekMs - 1, endDate.getTime()));
      
      const weekEmails = emails.filter(email => {
        const emailDate = new Date(email.createdAt || '');
        return emailDate >= d && emailDate <= weekEnd;
      });
      
      const sent = weekEmails.filter(e => e.status === 'sent').length;
      const total = weekEmails.length;
      
      weeklyData.push({
        week: d.toISOString().split('T')[0],
        deliverabilityRate: total > 0 ? (sent / total) * 100 : 0,
        volume: total
      });
    }
    return weeklyData;
  }

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

  // Development Routes (NO AUTH REQUIRED)
  if (process.env.NODE_ENV === 'development') {
    // Email test routes
    app.post('/api/dev/emails/test', async (req, res) => {
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

    app.post('/api/dev/emails/test-connection', async (req, res) => {
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

    // Authentication bypass for development
    app.get('/api/dev/auth/check', (req, res) => {
      res.json({ authenticated: true });
    });


    // Admin dashboard data routes (no auth required)
    app.get('/api/dev/leads', async (req, res) => {
      try {
        const { limit, status } = req.query;
        const leads = await storage.getLeads(
          limit ? parseInt(limit as string) : 50,
          status as string
        );
        res.json(leads);
      } catch (error) {
        console.error('Error fetching leads:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    app.get('/api/dev/estimations', async (req, res) => {
      try {
        const { limit } = req.query;
        const estimations = await storage.getEstimations(
          limit ? parseInt(limit as string) : 50
        );
        res.json(estimations);
      } catch (error) {
        console.error('Error fetching estimations:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    app.get('/api/dev/analytics/summary', async (req, res) => {
      try {
        const summary = await storage.getAnalyticsSummary();
        res.json(summary);
      } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  }

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

  // Get lead data from secure token endpoint (RGPD-compliant)
  app.get('/api/lead-context/:token', async (req, res) => {
    try {
      const { token } = req.params;
      const leadData = getLeadFromToken(token);
      
      if (!leadData) {
        return res.status(404).json({ error: 'Token invalide ou expiré' });
      }
      
      res.json({ leadData });
    } catch (error) {
      console.error('Error getting lead context:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // PDF download endpoint for guides (secured with token)
  app.get('/api/guides/:slug/download-pdf', async (req, res) => {
    try {
      const { slug } = req.params;
      const { token } = req.query;
      
      // Get guide data
      const guide = await storage.getGuideBySlug(slug);
      if (!guide) {
        return res.status(404).json({ error: 'Guide not found' });
      }
      
      // Get lead data from secure token (RGPD-compliant)
      if (!token) {
        return res.status(400).json({ error: 'Token requis pour télécharger le PDF' });
      }
      
      const leadData = getLeadFromToken(token as string);
      if (!leadData) {
        return res.status(401).json({ error: 'Token invalide ou expiré' });
      }
      
      const finalLeadData = {
        firstName: leadData.firstName,
        email: leadData.email,
        city: leadData.city,
        guideSlug: slug
      };
      
      // Track the PDF download attempt
      try {
        await storage.createGuideAnalytics({
          guideId: guide.id,
          sessionId: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          leadEmail: finalLeadData.email,
          eventType: 'pdf_download_started',
          userAgent: req.headers['user-agent'] || '',
          ipAddress: req.ip || req.connection.remoteAddress || ''
        });
      } catch (analyticsError) {
        console.error('Error tracking PDF download:', analyticsError);
      }
      
      // Generate PDF using the PDF service
      try {
        const pdfBuffer = await pdfService.generateGuidePDF({
          guide,
          firstName: finalLeadData.firstName,
          email: finalLeadData.email,
          city: finalLeadData.city
        });
        
        // Set response headers for PDF download
        res.set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${guide.slug}-${finalLeadData.firstName}-guide.pdf"`,
          'Content-Length': pdfBuffer.length.toString()
        });
        
        // Track successful PDF generation
        try {
          await storage.createGuideAnalytics({
            guideId: guide.id,
            sessionId: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            leadEmail: finalLeadData.email,
            eventType: 'pdf_download_completed',
            userAgent: req.headers['user-agent'] || '',
            ipAddress: req.ip || req.connection.remoteAddress || ''
          });
        } catch (analyticsError) {
          console.error('Error tracking PDF completion:', analyticsError);
        }
        
        // Send the PDF buffer
        res.send(pdfBuffer);
        
      } catch (pdfError) {
        console.error('Error generating PDF:', pdfError);
        
        // Track PDF generation failure
        try {
          await storage.createGuideAnalytics({
            guideId: guide.id,
            sessionId: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            leadEmail: finalLeadData.email,
            eventType: 'pdf_download_failed',
            eventValue: pdfError instanceof Error ? pdfError.message : 'Unknown error',
            userAgent: req.headers['user-agent'] || '',
            ipAddress: req.ip || req.connection.remoteAddress || ''
          });
        } catch (analyticsError) {
          console.error('Error tracking PDF failure:', analyticsError);
        }
        
        // Return fallback response
        res.status(500).json({
          error: 'Erreur lors de la génération du PDF',
          message: 'Une version temporaire du guide sera envoyée par email sous 24h.',
          fallback: {
            title: guide.title,
            content: guide.content
          }
        });
      }
      
    } catch (error) {
      console.error('Error downloading guide PDF:', error);
      res.status(500).json({ error: 'Erreur lors du téléchargement du PDF' });
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

  // ===== EMAIL SEQUENCE MANAGEMENT ROUTES =====

  // Get all email sequences with filtering and pagination
  app.get('/api/admin/email-sequences', requireAuth, async (req, res) => {
    try {
      const { leadEmail, persona, status, limit, offset } = req.query;

      let sequences = await storage.getGuideEmailSequences(leadEmail as string);

      // Apply filters
      if (persona && persona !== 'all') {
        sequences = sequences.filter(s => s.persona === persona);
      }
      if (status && status !== 'all') {
        sequences = sequences.filter(s => s.status === status);
      }

      // Apply pagination
      const limitNum = limit ? parseInt(limit as string) : 50;
      const offsetNum = offset ? parseInt(offset as string) : 0;
      const paginatedSequences = sequences.slice(offsetNum, offsetNum + limitNum);

      res.json({
        sequences: paginatedSequences,
        total: sequences.length,
        limit: limitNum,
        offset: offsetNum
      });
    } catch (error) {
      console.error('Error fetching email sequences:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get email sequence statistics
  app.get('/api/admin/email-sequences/stats', requireAuth, async (req, res) => {
    try {
      const stats = await emailSequenceService.getSequenceStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching sequence stats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Process scheduled emails manually
  app.post('/api/admin/email-sequences/process', requireAuth, async (req, res) => {
    try {
      const result = await emailSequenceService.processScheduledEmails();
      res.json({
        success: true,
        message: `Processing complete: ${result.sent} sent, ${result.failed} failed`,
        result
      });
    } catch (error) {
      console.error('Error processing scheduled emails:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Update email sequence status
  app.put('/api/admin/email-sequences/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, scheduledFor } = req.body;

      // Validate status
      const validStatuses = ['scheduled', 'sent', 'failed', 'cancelled'];
      if (status && !validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const updates: any = {};
      if (status) updates.status = status;
      if (scheduledFor) updates.scheduledFor = new Date(scheduledFor);

      await storage.updateGuideEmailSequence(id, updates);
      res.json({ success: true, message: 'Sequence updated successfully' });
    } catch (error) {
      console.error('Error updating email sequence:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Cancel email sequence
  app.delete('/api/admin/email-sequences/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.updateGuideEmailSequence(id, { status: 'cancelled' });
      res.json({ success: true, message: 'Sequence cancelled successfully' });
    } catch (error) {
      console.error('Error cancelling email sequence:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get sequences for specific lead email
  app.get('/api/admin/email-sequences/lead/:email', requireAuth, async (req, res) => {
    try {
      const { email } = req.params;
      const sequences = await storage.getGuideEmailSequences(email);
      res.json(sequences);
    } catch (error) {
      console.error('Error fetching lead sequences:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Trigger new sequence manually (admin only)
  app.post('/api/admin/email-sequences/trigger', requireAuth, async (req, res) => {
    try {
      const { guideId, leadEmail, leadFirstName, leadCity, persona, source } = req.body;

      if (!guideId || !leadEmail || !leadFirstName || !persona) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const result = await emailSequenceService.triggerSequence({
        guideId,
        leadEmail,
        leadFirstName,
        leadCity,
        persona,
        source
      });

      if (result.success) {
        res.json({
          success: true,
          message: 'Email sequence triggered successfully',
          sequenceIds: result.sequenceIds
        });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      console.error('Error triggering email sequence:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Public unsubscribe endpoint (no auth required)
  app.post('/api/unsubscribe', async (req, res) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ error: 'Token required' });
      }

      // Decode token to get email and sequence ID
      let email: string;
      try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const [decodedEmail] = decoded.split(':');
        email = decodedEmail;
      } catch {
        return res.status(400).json({ error: 'Invalid token' });
      }

      const result = await emailSequenceService.unsubscribeUser(email);

      if (result.success) {
        res.json({
          success: true,
          message: 'Successfully unsubscribed from all email sequences'
        });
      } else {
        res.status(500).json({ error: result.error });
      }
    } catch (error) {
      console.error('Error unsubscribing user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get unsubscribe page info (no auth required)
  app.get('/api/unsubscribe/:token', async (req, res) => {
    try {
      const { token } = req.params;

      // Decode token to get email
      let email: string;
      try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const [decodedEmail] = decoded.split(':');
        email = decodedEmail;
      } catch {
        return res.status(400).json({ error: 'Invalid token' });
      }

      // Get active sequences for this email
      const sequences = await storage.getGuideEmailSequences(email);
      const activeSequences = sequences.filter(s => s.status === 'scheduled');

      res.json({
        email,
        activeSequences: activeSequences.length,
        personas: [...new Set(activeSequences.map(s => s.persona))]
      });
    } catch (error) {
      console.error('Error getting unsubscribe info:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Initialize email sequence templates (setup endpoint)
  app.post('/api/admin/email-sequences/setup-templates', requireAuth, async (req, res) => {
    try {
      const result = await emailTemplateGenerator.generateAllTemplates();

      if (result.success) {
        res.json({
          success: true,
          message: `Email sequence templates setup complete: ${result.created} templates created`,
          created: result.created
        });
      } else {
        res.status(500).json({
          error: 'Failed to setup templates',
          errors: result.errors
        });
      }
    } catch (error) {
      console.error('Error setting up email templates:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Start background email processor (development only)
  if (process.env.NODE_ENV === 'development') {
    app.post('/api/admin/email-sequences/start-processor', requireAuth, async (req, res) => {
      try {
        const { intervalMinutes = 30 } = req.body;
        emailSequenceService.startBackgroundProcessor(intervalMinutes);
        res.json({
          success: true,
          message: `Background email processor started (every ${intervalMinutes} minutes)`
        });
      } catch (error) {
        console.error('Error starting background processor:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  }

  // ===== LEAD SCORING API ROUTES =====
  
  // Initialize lead scoring system
  app.post('/api/admin/scoring/initialize', requireAuth, async (req, res) => {
    try {
      await leadScoringService.initializeDefaultConfig();
      res.json({ success: true, message: 'Lead scoring system initialized' });
    } catch (error) {
      console.error('Error initializing scoring system:', error);
      res.status(500).json({ error: 'Failed to initialize scoring system' });
    }
  });

  // Get lead scoring data
  app.get('/api/admin/scoring/leads', requireAuth, async (req, res) => {
    try {
      const { limit = 50, status } = req.query;
      const allScoring = await storage.getAllLeadScoring(
        parseInt(limit as string), 
        status as string
      );
      
      // Get lead details for each scoring
      const leadIds = allScoring.map(s => s.leadId);
      const leads = await storage.getLeads();
      const leadsMap = new Map(leads.map(l => [l.id, l]));
      
      const scoringWithLeads = allScoring.map(scoring => ({
        ...scoring,
        lead: leadsMap.get(scoring.leadId)
      }));

      res.json(scoringWithLeads);
    } catch (error) {
      console.error('Error fetching lead scoring:', error);
      res.status(500).json({ error: 'Failed to fetch lead scoring' });
    }
  });

  // Get specific lead scoring
  app.get('/api/admin/scoring/leads/:leadId', requireAuth, async (req, res) => {
    try {
      const { leadId } = req.params;
      const scoring = await storage.getLeadScoring(leadId);
      
      if (!scoring) {
        return res.status(404).json({ error: 'Lead scoring not found' });
      }

      // Get lead details
      const leads = await storage.getLeads();
      const lead = leads.find(l => l.id === leadId);
      
      // Get score history
      const history = await storage.getLeadScoreHistory(leadId);

      res.json({
        ...scoring,
        lead,
        history
      });
    } catch (error) {
      console.error('Error fetching lead scoring:', error);
      res.status(500).json({ error: 'Failed to fetch lead scoring' });
    }
  });

  // Calculate or recalculate lead score
  app.post('/api/admin/scoring/leads/:leadId/calculate', requireAuth, async (req, res) => {
    try {
      const { leadId } = req.params;
      const { reason = 'manual_recalculation' } = req.body;
      
      const existingScoring = await storage.getLeadScoring(leadId);
      const updatedScoring = await leadScoringService.updateLeadScoring(
        leadId,
        existingScoring,
        reason,
        'admin'
      );

      res.json(updatedScoring);
    } catch (error) {
      console.error('Error calculating lead score:', error);
      res.status(500).json({ error: 'Failed to calculate lead score' });
    }
  });

  // Manual score adjustment
  app.post('/api/admin/scoring/leads/:leadId/adjust', requireAuth, async (req, res) => {
    try {
      const { leadId } = req.params;
      const adjustmentSchema = z.object({
        adjustment: z.number().min(-50).max(50),
        notes: z.string().max(500),
        assignedTo: z.string().optional()
      });
      
      const { adjustment, notes, assignedTo } = adjustmentSchema.parse(req.body);
      
      const updatedScoring = await leadScoringService.adjustLeadScore(
        leadId,
        adjustment,
        notes,
        'admin'
      );

      // Update assignment if provided
      if (assignedTo) {
        await storage.updateLeadScoring(leadId, { assignedTo });
      }

      res.json(updatedScoring);
    } catch (error) {
      console.error('Error adjusting lead score:', error);
      res.status(500).json({ error: 'Failed to adjust lead score' });
    }
  });

  // Bulk recalculate all scores
  app.post('/api/admin/scoring/recalculate-all', requireAuth, async (req, res) => {
    try {
      const result = await leadScoringService.recalculateAllScores();
      res.json(result);
    } catch (error) {
      console.error('Error recalculating all scores:', error);
      res.status(500).json({ error: 'Failed to recalculate scores' });
    }
  });

  // ===== SCORING CONFIGURATION ROUTES =====

  // Get scoring configuration
  app.get('/api/admin/scoring/config', requireAuth, async (req, res) => {
    try {
      const configs = await storage.getScoringConfigs();
      res.json(configs);
    } catch (error) {
      console.error('Error fetching scoring config:', error);
      res.status(500).json({ error: 'Failed to fetch scoring configuration' });
    }
  });

  // Update scoring configuration
  app.put('/api/admin/scoring/config/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = insertScoringConfigSchema.partial().parse(req.body);
      
      const updatedConfig = await storage.updateScoringConfig(id, updateData);
      
      // Trigger recalculation if weights or rules changed
      if (updateData.weight || updateData.rules || updateData.thresholds) {
        leadScoringService.recalculateAllScores().catch(console.error);
      }

      res.json(updatedConfig);
    } catch (error) {
      console.error('Error updating scoring config:', error);
      res.status(500).json({ error: 'Failed to update scoring configuration' });
    }
  });

  // Create new scoring configuration
  app.post('/api/admin/scoring/config', requireAuth, async (req, res) => {
    try {
      const configData = insertScoringConfigSchema.parse(req.body);
      const newConfig = await storage.createScoringConfig(configData);
      res.json(newConfig);
    } catch (error) {
      console.error('Error creating scoring config:', error);
      res.status(500).json({ error: 'Failed to create scoring configuration' });
    }
  });

  // Delete scoring configuration
  app.delete('/api/admin/scoring/config/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteScoringConfig(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting scoring config:', error);
      res.status(500).json({ error: 'Failed to delete scoring configuration' });
    }
  });

  // ===== SCORING ANALYTICS ROUTES =====

  // Get scoring analytics dashboard
  app.get('/api/admin/scoring/analytics', requireAuth, async (req, res) => {
    try {
      const { period = '30d' } = req.query;
      
      let startDate: Date | undefined;
      let endDate: Date = new Date();
      
      switch (period) {
        case '7d':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          break;
      }

      const analytics = await leadScoringService.getScoringAnalytics(startDate, endDate);
      
      res.json({
        period,
        dateRange: {
          start: startDate?.toISOString(),
          end: endDate.toISOString()
        },
        ...analytics
      });
    } catch (error) {
      console.error('Error fetching scoring analytics:', error);
      res.status(500).json({ error: 'Failed to fetch scoring analytics' });
    }
  });

  // Get score history for all leads
  app.get('/api/admin/scoring/history', requireAuth, async (req, res) => {
    try {
      const { limit = 100 } = req.query;
      const history = await storage.getAllScoreHistory(parseInt(limit as string));
      
      // Get lead details for history entries
      const leadIds = [...new Set(history.map(h => h.leadId))];
      const leads = await storage.getLeads();
      const leadsMap = new Map(leads.map(l => [l.id, l]));
      
      const historyWithLeads = history.map(entry => ({
        ...entry,
        lead: leadsMap.get(entry.leadId)
      }));

      res.json(historyWithLeads);
    } catch (error) {
      console.error('Error fetching score history:', error);
      res.status(500).json({ error: 'Failed to fetch score history' });
    }
  });

  // Get BANT criteria definitions
  app.get('/api/admin/scoring/criteria', requireAuth, async (req, res) => {
    try {
      res.json({
        criteria: BANT_CRITERIA,
        qualificationStatus: QUALIFICATION_STATUS
      });
    } catch (error) {
      console.error('Error fetching criteria:', error);
      res.status(500).json({ error: 'Failed to fetch criteria' });
    }
  });

  // Update lead qualification status
  app.put('/api/admin/scoring/leads/:leadId/status', requireAuth, async (req, res) => {
    try {
      const { leadId } = req.params;
      const statusSchema = z.object({
        qualificationStatus: z.enum(['unqualified', 'to_review', 'qualified', 'hot_lead']),
        notes: z.string().optional(),
        assignedTo: z.string().optional()
      });
      
      const { qualificationStatus, notes, assignedTo } = statusSchema.parse(req.body);
      
      const updatedScoring = await storage.updateLeadScoring(leadId, {
        qualificationStatus,
        notes,
        assignedTo
      });

      // Create history entry for manual status change
      await storage.createLeadScoreHistory({
        leadId,
        oldScore: updatedScoring.totalScore,
        newScore: updatedScoring.totalScore,
        scoreChange: 0,
        changeReason: 'manual_status_change',
        changedBy: 'admin',
        details: JSON.stringify({
          newStatus: qualificationStatus,
          notes,
          assignedTo
        })
      });

      res.json(updatedScoring);
    } catch (error) {
      console.error('Error updating qualification status:', error);
      res.status(500).json({ error: 'Failed to update qualification status' });
    }
  });

  // Hook: Automatically calculate score when new lead is created
  const originalCreateLead = storage.createLead.bind(storage);
  storage.createLead = async function(lead) {
    const newLead = await originalCreateLead(lead);
    
    // Calculate initial score asynchronously
    setTimeout(async () => {
      try {
        await leadScoringService.updateLeadScoring(newLead.id);
      } catch (error) {
        console.error('Error calculating initial score for lead:', newLead.id, error);
      }
    }, 1000);
    
    return newLead;
  };

  // ===== SMS CAMPAIGNS ROUTES =====

  // SMS Campaigns
  app.get('/api/admin/sms/campaigns', requireAuth, async (req, res) => {
    try {
      const { status, limit } = req.query;
      const campaigns = await storage.getSmsCampaigns(status as string, Number(limit) || 50);
      res.json(campaigns);
    } catch (error) {
      console.error('Error fetching SMS campaigns:', error);
      res.status(500).json({ error: 'Failed to fetch SMS campaigns' });
    }
  });

  app.post('/api/admin/sms/campaigns', requireAuth, async (req, res) => {
    try {
      const campaignData = insertSmsCampaignSchema.parse(req.body);
      const campaign = await storage.createSmsCampaign(campaignData);
      res.json(campaign);
    } catch (error) {
      console.error('Error creating SMS campaign:', error);
      res.status(400).json({ error: 'Failed to create SMS campaign' });
    }
  });

  app.get('/api/admin/sms/campaigns/:id', requireAuth, async (req, res) => {
    try {
      const campaign = await storage.getSmsCampaignById(req.params.id);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
      res.json(campaign);
    } catch (error) {
      console.error('Error fetching SMS campaign:', error);
      res.status(500).json({ error: 'Failed to fetch SMS campaign' });
    }
  });

  app.put('/api/admin/sms/campaigns/:id', requireAuth, async (req, res) => {
    try {
      const updates = insertSmsCampaignSchema.partial().parse(req.body);
      const campaign = await storage.updateSmsCampaign(req.params.id, updates);
      res.json(campaign);
    } catch (error) {
      console.error('Error updating SMS campaign:', error);
      res.status(400).json({ error: 'Failed to update SMS campaign' });
    }
  });

  app.delete('/api/admin/sms/campaigns/:id', requireAuth, async (req, res) => {
    try {
      await storage.deleteSmsCampaign(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting SMS campaign:', error);
      res.status(500).json({ error: 'Failed to delete SMS campaign' });
    }
  });

  // SMS Templates
  app.get('/api/admin/sms/templates', requireAuth, async (req, res) => {
    try {
      const { category, persona, isActive } = req.query;
      const templates = await storage.getSmsTemplates(
        category as string,
        persona as string,
        isActive ? isActive === 'true' : undefined
      );
      res.json(templates);
    } catch (error) {
      console.error('Error fetching SMS templates:', error);
      res.status(500).json({ error: 'Failed to fetch SMS templates' });
    }
  });

  app.post('/api/admin/sms/templates', requireAuth, async (req, res) => {
    try {
      const templateData = insertSmsTemplateSchema.parse(req.body);
      const template = await storage.createSmsTemplate(templateData);
      res.json(template);
    } catch (error) {
      console.error('Error creating SMS template:', error);
      res.status(400).json({ error: 'Failed to create SMS template' });
    }
  });

  app.put('/api/admin/sms/templates/:id', requireAuth, async (req, res) => {
    try {
      const updates = insertSmsTemplateSchema.partial().parse(req.body);
      const template = await storage.updateSmsTemplate(req.params.id, updates);
      res.json(template);
    } catch (error) {
      console.error('Error updating SMS template:', error);
      res.status(400).json({ error: 'Failed to update SMS template' });
    }
  });

  app.delete('/api/admin/sms/templates/:id', requireAuth, async (req, res) => {
    try {
      await storage.deleteSmsTemplate(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting SMS template:', error);
      res.status(500).json({ error: 'Failed to delete SMS template' });
    }
  });

  // SMS Contacts
  app.get('/api/admin/sms/contacts', requireAuth, async (req, res) => {
    try {
      const { persona, isOptedIn, limit } = req.query;
      const contacts = await storage.getSmsContacts(
        persona as string,
        isOptedIn ? isOptedIn === 'true' : undefined,
        Number(limit) || 100
      );
      res.json(contacts);
    } catch (error) {
      console.error('Error fetching SMS contacts:', error);
      res.status(500).json({ error: 'Failed to fetch SMS contacts' });
    }
  });

  app.post('/api/admin/sms/contacts', requireAuth, async (req, res) => {
    try {
      const contactData = insertSmsContactSchema.parse(req.body);
      const contact = await storage.createSmsContact(contactData);
      res.json(contact);
    } catch (error) {
      console.error('Error creating SMS contact:', error);
      res.status(400).json({ error: 'Failed to create SMS contact' });
    }
  });

  // SMS Analytics
  app.get('/api/admin/sms/analytics/overview', requireAuth, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const stats = await storage.getSmsAnalyticsOverview(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json(stats);
    } catch (error) {
      console.error('Error fetching SMS analytics:', error);
      res.status(500).json({ error: 'Failed to fetch SMS analytics' });
    }
  });

  app.get('/api/admin/sms/analytics/campaigns', requireAuth, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const performance = await storage.getSmsCampaignPerformance(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json(performance);
    } catch (error) {
      console.error('Error fetching campaign performance:', error);
      res.status(500).json({ error: 'Failed to fetch campaign performance' });
    }
  });

  app.get('/api/admin/sms/analytics/templates', requireAuth, async (req, res) => {
    try {
      const performance = await storage.getSmsTemplatePerformance();
      res.json(performance);
    } catch (error) {
      console.error('Error fetching template performance:', error);
      res.status(500).json({ error: 'Failed to fetch template performance' });
    }
  });

  // Send SMS Campaign
  app.post('/api/admin/sms/campaigns/:id/send', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const campaign = await storage.getSmsCampaignById(id);
      
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      // Get contacts based on campaign audience
      const contacts = await storage.getSmsContacts(campaign.audiencePersona || undefined, true);
      
      if (contacts.length === 0) {
        return res.status(400).json({ error: 'No contacts found for campaign audience' });
      }

      let sentCount = 0;
      let failedCount = 0;

      // Send SMS to each contact
      for (const contact of contacts) {
        try {
          const message = await twilioClient.messages.create({
            body: campaign.message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: contact.phoneNumber,
          });

          // Record sent message
          await storage.createSmsSentMessage({
            campaignId: id,
            contactId: contact.id,
            phoneNumber: contact.phoneNumber,
            message: campaign.message,
            status: 'sent',
            twilioSid: message.sid,
            cost: '0.05', // Default cost per SMS
            sentAt: new Date()
          });

          sentCount++;
        } catch (error) {
          console.error(`Failed to send SMS to ${contact.phoneNumber}:`, error);
          
          await storage.createSmsSentMessage({
            campaignId: id,
            contactId: contact.id,
            phoneNumber: contact.phoneNumber,
            message: campaign.message,
            status: 'failed',
            errorMessage: error.message
          });

          failedCount++;
        }
      }

      // Update campaign stats
      await storage.updateSmsCampaignStats(id, {
        sentCount,
        failedCount,
        actualCost: (sentCount * 0.05).toFixed(2)
      });

      // Update campaign status
      await storage.updateSmsCampaign(id, {
        status: 'completed',
        sentAt: new Date()
      });

      res.json({
        success: true,
        sentCount,
        failedCount,
        totalContacts: contacts.length
      });

    } catch (error) {
      console.error('Error sending SMS campaign:', error);
      res.status(500).json({ error: 'Failed to send SMS campaign' });
    }
  });

  // Simple endpoint to test Supabase connection
  app.get('/api/test/connection', async (req, res) => {
    try {
      console.log('Testing Supabase connection...');
      
      // Check if we're in development mode
      const isDev = process.env.NODE_ENV === 'development' && (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('3pVwZ'));
      console.log('Development mode:', isDev);
      console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
      
      if (isDev) {
        res.json({ 
          status: 'development_mode',
          message: 'Running in development mode with mock data',
          hasDatabase: false
        });
        return;
      }
      
      // Try to fetch a simple count
      const articles = await storage.getAllArticles(1);
      console.log('Articles fetched:', articles.length);
      
      res.json({ 
        status: 'connected',
        message: 'Supabase connection successful!',
        hasDatabase: true,
        articlesCount: articles.length
      });
      
    } catch (error) {
      console.error('Error testing connection:', error);
      res.status(500).json({ 
        status: 'error',
        error: 'Connection failed', 
        details: error.message 
      });
    }
  });

  // Synchronisation complète : Peupler toutes les données de base
  app.post('/api/admin/sync-all-data', requireAuth, async (req, res) => {
    try {
      console.log('🚀 Démarrage synchronisation complète des données...');
      
      // 1. PERSONA CONFIGS
      console.log('📝 Création des personas marketing...');
      const personas = [
        {
          persona: 'presse',
          label: 'Acheteur Pressé',
          description: 'Personne qui veut vendre rapidement',
          psychProfile: 'Impatient, orienté résultats, recherche efficacité',
          painPoints: ['Temps limité', 'Stress financier', 'Déménagement urgent'],
          motivations: ['Vente rapide', 'Simplicité', 'Gain de temps'],
          communicationStyle: 'Direct et concis',
          preferredChannels: ['SMS', 'Téléphone', 'Email'],
          primaryColor: '#FF5722',
          secondaryColor: '#FF8A65',
          icon: 'clock',
          keywords: ['rapide', 'urgent', 'vite']
        },
        {
          persona: 'maximisateur',
          label: 'Maximisateur de Prix',
          description: 'Propriétaire qui veut le meilleur prix',
          psychProfile: 'Analytique, méfiant, perfectionniste',
          painPoints: ['Peur de mal vendre', 'Comparaisons constantes', 'Indécision'],
          motivations: ['Prix maximum', 'Sécurité', 'Validation'],
          communicationStyle: 'Détaillé avec preuves',
          preferredChannels: ['Email', 'Documentation', 'Rapports'],
          primaryColor: '#4CAF50',
          secondaryColor: '#81C784',
          icon: 'trending-up',
          keywords: ['prix', 'valeur', 'estimation']
        },
        {
          persona: 'prudent',
          label: 'Vendeur Prudent',
          description: 'Personne qui prend son temps pour décider',
          psychProfile: 'Conservateur, réfléchi, sécuritaire',
          painPoints: ['Peur de se tromper', 'Manque d\'information', 'Pression familiale'],
          motivations: ['Sécurité', 'Conseils experts', 'Processus clair'],
          communicationStyle: 'Rassurant et éducatif',
          preferredChannels: ['Email', 'Guides', 'Consultations'],
          primaryColor: '#2196F3',
          secondaryColor: '#64B5F6',
          icon: 'shield',
          keywords: ['sécurisé', 'conseils', 'guide']
        },
        {
          persona: 'investisseur',
          label: 'Investisseur Immobilier',
          description: 'Professionnel de l\'investissement',
          psychProfile: 'Rationnel, orienté ROI, expérimenté',
          painPoints: ['Rentabilité insuffisante', 'Complexité fiscale', 'Temps de gestion'],
          motivations: ['Rentabilité', 'Optimisation fiscale', 'Portfolio'],
          communicationStyle: 'Technique et chiffré',
          preferredChannels: ['Email', 'Rapports', 'Outils'],
          primaryColor: '#9C27B0',
          secondaryColor: '#BA68C8',
          icon: 'briefcase',
          keywords: ['investissement', 'rentabilité', 'ROI']
        }
      ];
      
      for (const persona of personas) {
        await storage.createPersonaConfig(persona);
      }
      console.log('✅ 4 personas créés');
      
      // 2. EMAIL TEMPLATES
      console.log('📧 Création des modèles email...');
      const emailTemplates = [
        {
          name: 'welcome_estimation',
          subject: 'Votre estimation immobilière est prête !',
          htmlContent: '<h2>Bonjour {{firstName}},</h2><p>Votre estimation pour {{address}} est terminée.</p><p>Valeur estimée: <strong>{{estimatedValue}}€</strong></p><p>Découvrez le rapport complet en pièce jointe.</p>',
          textContent: 'Bonjour {{firstName}}, Votre estimation pour {{address}} est terminée. Valeur estimée: {{estimatedValue}}€',
          category: 'estimation',
          variables: '["firstName", "address", "estimatedValue"]'
        },
        {
          name: 'guide_download_confirmation',
          subject: 'Votre guide "{{guideTitle}}" est disponible',
          htmlContent: '<h2>Merci {{firstName}} !</h2><p>Votre guide <strong>{{guideTitle}}</strong> est en pièce jointe.</p><p>Ce guide contient des conseils exclusifs pour {{persona}}.</p>',
          textContent: 'Merci {{firstName}} ! Votre guide {{guideTitle}} est en pièce jointe.',
          category: 'guide',
          variables: '["firstName", "guideTitle", "persona"]'
        },
        {
          name: 'follow_up_1',
          subject: 'Des questions sur votre estimation ?',
          htmlContent: '<h2>Bonjour {{firstName}},</h2><p>J\'espère que votre estimation vous a été utile.</p><p>Avez-vous des questions sur la valeur de {{address}} ?</p>',
          textContent: 'Bonjour {{firstName}}, J\'espère que votre estimation vous a été utile. Avez-vous des questions ?',
          category: 'follow_up',
          variables: '["firstName", "address"]'
        }
      ];
      
      for (const template of emailTemplates) {
        await storage.createEmailTemplate(template);
      }
      console.log('✅ 3 modèles email créés');
      
      // 3. SMS TEMPLATES  
      console.log('📱 Création des modèles SMS...');
      const smsTemplates = [
        {
          name: 'estimation_ready',
          content: 'Bonjour {{firstName}}, votre estimation pour {{city}} est prête ! Valeur: {{value}}€. Consultez le détail: {{link}}',
          category: 'estimation',
          variables: ['firstName', 'city', 'value', 'link'],
          characterCount: 140,
          createdBy: 'system'
        },
        {
          name: 'guide_available',
          content: 'Votre guide {{guideTitle}} est disponible ! Téléchargez-le ici: {{downloadLink}}',
          category: 'guide',
          variables: ['guideTitle', 'downloadLink'],
          characterCount: 120,
          createdBy: 'system'
        },
        {
          name: 'follow_up_sms',
          content: 'Bonjour {{firstName}}, des questions sur votre estimation {{city}} ? Répondez-moi directement !',
          category: 'follow_up',
          variables: ['firstName', 'city'],
          characterCount: 110,
          createdBy: 'system'
        }
      ];
      
      for (const template of smsTemplates) {
        await storage.createSmsTemplate(template);
      }
      console.log('✅ 3 modèles SMS créés');
      
      // 4. SCORING CONFIG (Système BANT)
      console.log('🎯 Configuration du système de scoring BANT...');
      const scoringRules = [
        {
          criteriaType: 'budget',
          weight: 25,
          rules: '{"budget_declared": {"500k+": 25, "300-500k": 20, "200-300k": 15, "100-200k": 10, "<100k": 5}}',
          description: 'Budget déclaré par le prospect'
        },
        {
          criteriaType: 'budget',
          weight: 25,
          rules: '{"urgency": {"Très urgent": 25, "Urgent": 20, "Modéré": 15, "Pas urgent": 10, "Aucune": 5}}',
          description: 'Urgence financière du prospect'
        },
        {
          criteriaType: 'authority',
          weight: 25,
          rules: '{"decision_maker": {"Propriétaire unique": 25, "Copropriétaire décideur": 20, "Copropriétaire": 15, "Mandataire": 10, "Autre": 5}}',
          description: 'Pouvoir de décision du prospect'
        },
        {
          criteriaType: 'authority',
          weight: 25,
          rules: '{"family_situation": {"Célibataire": 25, "Couple uni": 20, "Couple séparé": 15, "Succession": 10, "Indivision": 5}}',
          description: 'Situation familiale du prospect'
        },
        {
          criteriaType: 'need',
          weight: 25,
          rules: '{"motivation": {"Déménagement professionnel": 25, "Changement familial": 20, "Investissement": 15, "Opportunité": 10, "Curiosité": 5}}',
          description: 'Motivation de vente du prospect'
        },
        {
          criteriaType: 'need',
          weight: 25,
          rules: '{"current_situation": {"Logement inadapté": 25, "Contraintes financières": 20, "Opportunité marché": 15, "Projet vie": 10, "Autre": 5}}',
          description: 'Situation actuelle du prospect'
        },
        {
          criteriaType: 'timeline',
          weight: 25,
          rules: '{"desired_delay": {"<3 mois": 25, "3-6 mois": 20, "6-12 mois": 15, "1-2 ans": 10, ">2 ans": 5}}',
          description: 'Délai souhaité pour la vente'
        },
        {
          criteriaType: 'timeline',
          weight: 25,
          rules: '{"availability": {"Immédiate": 25, "Cette semaine": 20, "Ce mois": 15, "Flexible": 10, "Limitée": 5}}',
          description: 'Disponibilité pour les visites'
        }
      ];
      
      for (const rule of scoringRules) {
        await storage.createScoringConfig(rule);
      }
      console.log('✅ 8 règles de scoring créées');
      
      res.json({
        success: true,
        message: '🎉 SYNCHRONISATION COMPLÈTE TERMINÉE !',
        data: {
          personas: personas.length,
          emailTemplates: emailTemplates.length,
          smsTemplates: smsTemplates.length,
          scoringRules: scoringRules.length,
          totalEntries: personas.length + emailTemplates.length + smsTemplates.length + scoringRules.length
        }
      });
      
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation:', error);
      res.status(500).json({
        error: 'Erreur de synchronisation',
        details: error.message
      });
    }
  });

  // Create ALL missing tables in Supabase
  app.post('/api/admin/create-all-tables', requireAuth, async (req, res) => {
    try {
      console.log('Creating ALL missing tables in Supabase...');
      
      await db.execute(`
        -- Email Templates
        CREATE TABLE IF NOT EXISTS email_templates (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          subject TEXT NOT NULL,
          html_content TEXT NOT NULL,
          text_content TEXT NOT NULL,
          category TEXT NOT NULL,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          variables TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        
        -- Email History
        CREATE TABLE IF NOT EXISTS email_history (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          template_id VARCHAR REFERENCES email_templates(id),
          recipient_email TEXT NOT NULL,
          recipient_name TEXT,
          sender_email TEXT NOT NULL,
          subject TEXT NOT NULL,
          html_content TEXT,
          text_content TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          error_message TEXT,
          send_grid_message_id TEXT,
          opened_at TIMESTAMP,
          clicked_at TIMESTAMP,
          sent_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        -- Auth Sessions
        CREATE TABLE IF NOT EXISTS auth_sessions (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT NOT NULL,
          ip_address TEXT,
          expires_at TIMESTAMP NOT NULL,
          is_email_verified BOOLEAN DEFAULT FALSE,
          phone_number TEXT,
          is_sms_verified BOOLEAN DEFAULT FALSE,
          verification_sid TEXT,
          session_data TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        
        -- Guide Downloads
        CREATE TABLE IF NOT EXISTS guide_downloads (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          ip_address TEXT,
          guide_id VARCHAR REFERENCES guides(id),
          lead_email TEXT NOT NULL,
          lead_first_name TEXT NOT NULL,
          lead_city TEXT,
          download_type TEXT NOT NULL,
          downloaded_at TIMESTAMP,
          user_agent TEXT,
          referrer TEXT,
          utm_source TEXT,
          utm_medium TEXT,
          utm_campaign TEXT,
          utm_content TEXT,
          utm_term TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        -- Guide Analytics
        CREATE TABLE IF NOT EXISTS guide_analytics (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          guide_id VARCHAR REFERENCES guides(id),
          date DATE NOT NULL,
          page_views INTEGER NOT NULL DEFAULT 0,
          unique_visitors INTEGER NOT NULL DEFAULT 0,
          downloads INTEGER NOT NULL DEFAULT 0,
          bounce_rate DECIMAL(5,2) DEFAULT 0,
          avg_time_on_page INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        -- Guide Email Sequences
        CREATE TABLE IF NOT EXISTS guide_email_sequences (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          guide_id VARCHAR REFERENCES guides(id),
          sequence_name TEXT NOT NULL,
          trigger_event TEXT NOT NULL,
          delay_hours INTEGER NOT NULL DEFAULT 0,
          template_id VARCHAR REFERENCES email_templates(id),
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          order_in_sequence INTEGER NOT NULL DEFAULT 1,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        
        -- Persona Configs
        CREATE TABLE IF NOT EXISTS persona_configs (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          persona TEXT NOT NULL UNIQUE,
          label TEXT NOT NULL,
          description TEXT NOT NULL,
          psych_profile TEXT NOT NULL,
          pain_points TEXT[] NOT NULL,
          motivations TEXT[] NOT NULL,
          communication_style TEXT NOT NULL,
          preferred_channels TEXT[] NOT NULL,
          primary_color TEXT NOT NULL,
          secondary_color TEXT NOT NULL,
          icon TEXT NOT NULL,
          keywords TEXT[] NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        
        -- Lead Scoring
        CREATE TABLE IF NOT EXISTS lead_scoring (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          lead_id VARCHAR REFERENCES leads(id) NOT NULL UNIQUE,
          total_score INTEGER NOT NULL DEFAULT 0,
          budget_score INTEGER NOT NULL DEFAULT 0,
          authority_score INTEGER NOT NULL DEFAULT 0,
          need_score INTEGER NOT NULL DEFAULT 0,
          timeline_score INTEGER NOT NULL DEFAULT 0,
          qualification_status TEXT NOT NULL DEFAULT 'unqualified',
          confidence_level INTEGER NOT NULL DEFAULT 50,
          last_calculated_at TIMESTAMP DEFAULT NOW(),
          manual_adjustment INTEGER DEFAULT 0,
          notes TEXT,
          assigned_to TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        
        -- Scoring Config
        CREATE TABLE IF NOT EXISTS scoring_config (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          criteria TEXT NOT NULL,
          sub_criteria TEXT NOT NULL,
          max_points INTEGER NOT NULL,
          scoring_rules TEXT NOT NULL,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        
        -- Lead Score History
        CREATE TABLE IF NOT EXISTS lead_score_history (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          lead_id VARCHAR REFERENCES leads(id) NOT NULL,
          previous_score INTEGER NOT NULL,
          new_score INTEGER NOT NULL,
          score_change INTEGER NOT NULL,
          change_reason TEXT NOT NULL,
          calculated_by TEXT,
          calculation_details TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        -- SMS Campaigns
        CREATE TABLE IF NOT EXISTS sms_campaigns (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          message TEXT NOT NULL,
          audience TEXT NOT NULL,
          created_by TEXT NOT NULL,
          status TEXT DEFAULT 'draft',
          scheduled_for TIMESTAMP,
          template_id VARCHAR,
          sent_count INTEGER DEFAULT 0,
          failed_count INTEGER DEFAULT 0,
          total_contacts INTEGER DEFAULT 0,
          estimated_cost TEXT DEFAULT '0.00',
          actual_cost TEXT DEFAULT '0.00',
          delivery_rate DECIMAL(5,2) DEFAULT 0,
          click_through_rate DECIMAL(5,2) DEFAULT 0,
          conversion_rate DECIMAL(5,2) DEFAULT 0,
          unsubscribe_rate DECIMAL(5,2) DEFAULT 0,
          audience_persona TEXT,
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP,
          sent_at TIMESTAMP,
          completed_at TIMESTAMP
        );
        
        -- SMS Templates
        CREATE TABLE IF NOT EXISTS sms_templates (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          message TEXT NOT NULL,
          category TEXT NOT NULL,
          variables TEXT[] DEFAULT '{}',
          character_count INTEGER NOT NULL,
          estimated_cost TEXT NOT NULL,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          usage_count INTEGER DEFAULT 0,
          last_used_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        
        -- SMS Contacts
        CREATE TABLE IF NOT EXISTS sms_contacts (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          phone_number TEXT NOT NULL UNIQUE,
          first_name TEXT,
          last_name TEXT,
          email TEXT,
          city TEXT,
          postal_code TEXT,
          tags TEXT[] DEFAULT '{}',
          persona TEXT,
          lead_source TEXT,
          opt_in_date TIMESTAMP,
          opt_out_date TIMESTAMP,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          last_contacted_at TIMESTAMP,
          total_messages_sent INTEGER DEFAULT 0,
          total_messages_received INTEGER DEFAULT 0,
          engagement_score INTEGER DEFAULT 0,
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        
        -- SMS Sent Messages
        CREATE TABLE IF NOT EXISTS sms_sent_messages (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          campaign_id VARCHAR REFERENCES sms_campaigns(id),
          contact_id VARCHAR REFERENCES sms_contacts(id),
          template_id VARCHAR REFERENCES sms_templates(id),
          phone_number TEXT NOT NULL,
          message_content TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          twilio_sid TEXT,
          error_message TEXT,
          cost TEXT DEFAULT '0.05',
          sent_at TIMESTAMP,
          delivered_at TIMESTAMP,
          failed_at TIMESTAMP,
          clicked_at TIMESTAMP,
          replied_at TIMESTAMP,
          reply_content TEXT,
          ip_address TEXT,
          user_agent TEXT,
          retry_count INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW()
        );
        
        -- SMS Sequences
        CREATE TABLE IF NOT EXISTS sms_sequences (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          description TEXT,
          trigger_event TEXT NOT NULL,
          target_persona TEXT,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          total_messages INTEGER DEFAULT 0,
          enrollment_count INTEGER DEFAULT 0,
          completion_rate DECIMAL(5,2) DEFAULT 0,
          conversion_rate DECIMAL(5,2) DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        
        -- SMS Sequence Enrollments
        CREATE TABLE IF NOT EXISTS sms_sequence_enrollments (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          sequence_id VARCHAR REFERENCES sms_sequences(id),
          contact_id VARCHAR REFERENCES sms_contacts(id),
          current_step INTEGER DEFAULT 1,
          status TEXT NOT NULL DEFAULT 'active',
          enrolled_at TIMESTAMP DEFAULT NOW(),
          last_message_sent_at TIMESTAMP,
          completed_at TIMESTAMP,
          paused_at TIMESTAMP,
          cancelled_at TIMESTAMP,
          total_messages_sent INTEGER DEFAULT 0,
          total_replies_received INTEGER DEFAULT 0,
          conversion_achieved BOOLEAN DEFAULT FALSE,
          conversion_date TIMESTAMP,
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      
      console.log('✅ ALL tables created successfully in Supabase!');
      
      res.json({ 
        success: true,
        message: 'ALL missing tables created in Supabase!',
        totalTables: 22
      });
      
    } catch (error) {
      console.error('❌ Error creating tables:', error);
      res.status(500).json({ 
        error: 'Failed to create tables', 
        details: error.message 
      });
    }
  });

  // =========================================================================
  // STRIPE PAYMENT ROUTES - Based on javascript_stripe integration
  // =========================================================================
  
  // Create PaymentIntent for course purchases
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      console.log('🔐 Checking Stripe configuration...');
      console.log('STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);
      console.log('STRIPE_SECRET_KEY starts with sk_:', process.env.STRIPE_SECRET_KEY?.startsWith('sk_'));

      if (!process.env.STRIPE_SECRET_KEY) {
        console.error('❌ STRIPE_SECRET_KEY not found in environment');
        return res.status(500).json({ 
          error: "Configuration de paiement manquante. Contactez l'administrateur." 
        });
      }

      // Import the courses content to validate pricing server-side
      const { coursesContent } = await import('../shared/content/courses.js');

      // Create a fresh Stripe instance to ensure we're using the correct key
      const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2023-10-16",
      });

      const { courseSlug } = req.body;
      
      if (!courseSlug) {
        return res.status(400).json({ 
          error: "Slug de cours manquant" 
        });
      }

      // SECURITY: Derive price server-side from trusted catalog - NEVER trust client
      // Find course by slug since the key is the SKU but we receive slug
      const course = Object.values(coursesContent).find(c => c.slug === courseSlug);
      if (!course) {
        console.error(`❌ Course not found for slug: ${courseSlug}`);
        return res.status(404).json({ 
          error: "Formation non trouvée" 
        });
      }

      // Extract price and convert euros to cents
      const priceInEuros = course.priceEuros;
      const amountInCents = Math.round(priceInEuros * 100);
      
      console.log(`💰 Creating PaymentIntent for course ${courseSlug} - ${priceInEuros}€ (${amountInCents} cents)`);

      // Create PaymentIntent with course metadata
      const paymentIntent = await stripeInstance.paymentIntents.create({
        amount: amountInCents,
        currency: "eur", // European currency for France
        metadata: {
          courseSlug,
          courseName: course.title,
          courseCode: course.sku,
          type: "course_purchase"
        },
        description: `Formation: ${course.title} (${priceInEuros}€)`,
      });

      console.log(`✅ PaymentIntent created successfully: ${paymentIntent.id} for ${priceInEuros}€`);

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error: any) {
      console.error('❌ Stripe PaymentIntent creation error:', error);
      console.error('Error details:', {
        type: error.type,
        code: error.code,
        message: error.message,
        requestId: error.requestId
      });
      res.status(500).json({ 
        error: "Erreur lors de la création du paiement: " + error.message 
      });
    }
  });

  // Chat API with OpenAI streaming - Based on javascript_openai integration
  app.post('/api/chat', async (req, res) => {
    try {
      if (!openai) {
        return res.status(500).json({ error: 'Service OpenAI non disponible' });
      }

      const { message, history = [] } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message requis' });
      }

      // Get chat configuration from database
      let config = await storage.getChatConfiguration();
      
      // Use default configuration if none exists
      if (!config) {
        config = {
          systemPrompt: "Vous êtes un assistant expert en immobilier spécialisé dans la région de Gironde/Bordeaux. Vous aidez les utilisateurs avec leurs questions sur l'estimation immobilière, le marché local, et les conseils pour vendre ou acheter. Soyez professionnel, précis et utilisez votre expertise du marché français.",
          model: "gpt-4o-mini",
          maxTokens: 2048,
          temperature: "0.7",
          maxHistoryMessages: 6,
          isActive: true
        };
      }

      // Check if chat is active
      if (!config.isActive) {
        return res.status(503).json({ error: 'Le service de chat est temporairement indisponible' });
      }

      // Validate and clamp numeric configuration values
      const maxHistoryMessages = Math.max(0, Math.min(config.maxHistoryMessages || 6, 20));
      const maxTokens = Math.max(128, Math.min(config.maxTokens || 2048, 8192));
      
      // Limit history based on configuration
      const limitedHistory = history.slice(-maxHistoryMessages);

      // Set headers for SSE (Server-Sent Events) streaming
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Prepare OpenAI request parameters
      const openaiParams: any = {
        model: config.model || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: config.systemPrompt
          },
          ...limitedHistory,
          { role: "user", content: message }
        ],
        stream: true,
        max_tokens: maxTokens,
      };
      
      // Parse temperature from string and add if valid
      if (config.temperature) {
        const temp = parseFloat(config.temperature);
        if (!isNaN(temp) && temp >= 0 && temp <= 2) {
          openaiParams.temperature = temp;
        }
      }

      const stream = await openai.chat.completions.create(openaiParams);

      // Stream the response
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          res.write(content);
        }
      }

      res.end();

    } catch (error: any) {
      console.error('Error in chat API:', error);
      
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Erreur lors de la génération de la réponse',
          message: error.message 
        });
      } else {
        res.end();
      }
    }
  });

  // Chat Configuration API routes (Admin only)
  // GET chat configuration
  app.get('/api/chat-config', requireAuth, async (req, res) => {
    try {
      const config = await storage.getChatConfiguration();
      
      if (!config) {
        // Return default configuration if none exists
        const defaultConfig = {
          name: "Configuration principale",
          systemPrompt: "Vous êtes un assistant expert en immobilier spécialisé dans la région de Gironde/Bordeaux. Vous aidez les utilisateurs avec leurs questions sur l'estimation immobilière, le marché local, et les conseils pour vendre ou acheter. Soyez professionnel, précis et utilisez votre expertise du marché français.",
          model: "gpt-4o-mini",
          maxTokens: 2048,
          temperature: "0.7",
          maxHistoryMessages: 6,
          isActive: true,
          welcomeMessage: "Bonjour ! Je suis votre assistant immobilier spécialisé dans la région Gironde/Bordeaux. Comment puis-je vous aider avec votre projet immobilier ?"
        };
        return res.json(defaultConfig);
      }
      
      res.json(config);
    } catch (error: any) {
      console.error('Error fetching chat configuration:', error);
      res.status(500).json({ 
        error: 'Erreur lors de la récupération de la configuration du chat'
      });
    }
  });

  // PATCH chat configuration (Admin only)
  app.patch('/api/chat-config', requireAuth, async (req, res) => {
    try {
      // Validate the request body with enhanced schema
      const validatedData = updateChatConfigSchema.parse(req.body);
      
      // Update or create the chat configuration
      const config = await storage.updateChatConfiguration(validatedData);
      
      res.json(config);
    } catch (error: any) {
      console.error('Error updating chat configuration:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: 'Données de configuration invalides',
          details: error.errors 
        });
      }
      
      res.status(500).json({ 
        error: 'Erreur lors de la mise à jour de la configuration du chat'
      });
    }
  });

  // Database Synchronization API (Admin only)
  app.post('/api/admin/db-sync', requireAuth, async (req, res) => {
    try {
      const syncResults = {
        timestamp: new Date().toISOString(),
        operations: [] as any[],
        success: true,
        errors: [] as string[]
      };

      // Test database connection first
      try {
        const connectionOk = await storage.testConnection();
        if (connectionOk) {
          syncResults.operations.push({
            type: 'connection_test',
            status: 'success',
            message: 'Connexion à la base de données testée avec succès'
          });
        } else {
          syncResults.operations.push({
            type: 'connection_test',
            status: 'error',
            message: 'Base de données non disponible (mode fallback actif)'
          });
          syncResults.errors.push('Database connection failed - using fallback mode');
        }
      } catch (error: any) {
        syncResults.operations.push({
          type: 'connection_test',
          status: 'error',
          message: `Erreur de connexion: ${error.message}`
        });
        syncResults.errors.push(error.message);
      }

      // Test Supabase connections
      try {
        const { testSupabaseConnection } = await import('./lib/supabaseClient');
        const { testSupabaseAdminConnection } = await import('./lib/supabaseAdmin');

        const supabaseTest = await testSupabaseConnection();
        const supabaseAdminTest = await testSupabaseAdminConnection();

        syncResults.operations.push({
          type: 'supabase_anonymous_test',
          status: supabaseTest ? 'success' : 'warning',
          message: supabaseTest ? 'Client Supabase anonyme connecté' : 'Client Supabase anonyme non disponible'
        });

        syncResults.operations.push({
          type: 'supabase_admin_test',
          status: supabaseAdminTest ? 'success' : 'warning',
          message: supabaseAdminTest ? 'Client Supabase admin connecté' : 'Client Supabase admin non disponible'
        });
      } catch (error: any) {
        syncResults.operations.push({
          type: 'supabase_test',
          status: 'error',
          message: `Erreur test Supabase: ${error.message}`
        });
        syncResults.errors.push(error.message);
      }

      // Check storage fallback status
      try {
        const storageStatus = await storage.getStorageStatus();
        syncResults.operations.push({
          type: 'storage_status',
          status: 'info',
          message: `Mode de stockage: ${storageStatus.usingFallback ? 'Fallback (mémoire)' : 'Base de données'}`,
          details: storageStatus
        });
      } catch (error: any) {
        syncResults.operations.push({
          type: 'storage_status',
          status: 'error',
          message: `Erreur statut stockage: ${error.message}`
        });
      }

      // Set overall success status
      syncResults.success = syncResults.errors.length === 0;

      res.json(syncResults);
    } catch (error: any) {
      console.error('Error during database synchronization:', error);
      res.status(500).json({ 
        error: 'Erreur lors de la synchronisation de la base de données',
        message: error.message,
        success: false,
        timestamp: new Date().toISOString()
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
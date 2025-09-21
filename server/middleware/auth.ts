import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin';

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        isAdmin: boolean;
      };
    }
  }
}

/**
 * Middleware to authenticate JWT tokens from Supabase
 * Extracts Bearer token from Authorization header and validates it
 */
export async function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token d\'authentification manquant' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Validate token with Supabase Admin client
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Service d\'authentification non disponible' });
    }
    
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Token invalide ou expiré' });
    }

    // Add user info to request
    req.user = {
      id: user.id,
      email: user.email || '',
      isAdmin: false // Will be set by requireAdmin middleware
    };

    next();
  } catch (error) {
    console.error('JWT Authentication error:', error);
    return res.status(500).json({ error: 'Erreur d\'authentification' });
  }
}

/**
 * Middleware to require admin privileges
 * Must be used after authenticateJWT middleware
 * Uses Supabase user metadata role instead of hardcoded email list
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentification requise' });
  }

  // Get the full user data with metadata for role checking
  const { data: { user: fullUser }, error: userError } = await supabaseAdmin.auth.getUser(
    req.headers.authorization?.substring(7) || ''
  );
  
  if (userError || !fullUser) {
    return res.status(401).json({ error: 'Token invalide pour vérification des rôles' });
  }

  // Check Supabase user metadata for admin role
  const hasAdminRole = fullUser.app_metadata?.role === 'admin' || 
                       fullUser.user_metadata?.app_role === 'admin';
  
  // Fallback: backward compatibility with email allowlist for existing admin accounts
  const adminEmails = [
    'admin@estimation-immobilier-gironde.fr',
    'oliviercolas83@gmail.com'
  ];
  const emailBasedAdmin = adminEmails.includes(req.user.email);
  
  // Admin if either has role in metadata OR is in legacy email allowlist
  const isAdmin = hasAdminRole || emailBasedAdmin;

  if (!isAdmin) {
    return res.status(403).json({ error: 'Accès administrateur requis' });
  }

  // Mark user as admin for subsequent handlers
  req.user.isAdmin = true;
  next();
}

/**
 * Combined middleware: authenticate + require admin
 * Convenience middleware for admin-only routes
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  authenticateJWT(req, res, async (err) => {
    if (err) return next(err);
    await requireAdmin(req, res, next);
  });
}
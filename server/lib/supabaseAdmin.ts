import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';

/**
 * Supabase admin client with service role key - for server-side operations only
 * NEVER expose this client or service key to client-side code
 * Bypasses Row Level Security (RLS) policies
 */
export const supabaseAdmin = (env.VITE_SUPABASE_URL && env.SUPABASE_SERVICE_KEY)
  ? createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
      auth: { 
        persistSession: false,
        autoRefreshToken: false 
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'x-client-info': 'realestate-gironde-admin/1.0.0'
        }
      }
    })
  : null;

if (!env.SUPABASE_SERVICE_KEY) {
  console.warn('⚠️ SUPABASE_SERVICE_KEY not defined: admin operations disabled.');
  console.warn('   Admin routes will return 501 Service Unavailable');
}

/**
 * Test admin connection to Supabase
 */
export async function testSupabaseAdminConnection(): Promise<boolean> {
  if (!supabaseAdmin) {
    console.warn('⚠️ Supabase admin client not available (no service key)');
    return false;
  }

  try {
    // Test admin connection with a simple query
    const { data, error } = await supabaseAdmin
      .from('leads')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.warn('⚠️ Supabase admin connection test warning:', error.message);
      return false;
    }
    
    console.log('✅ Supabase admin client connection verified');
    return true;
  } catch (error) {
    console.error('❌ Supabase admin connection test failed:', error);
    return false;
  }
}

/**
 * Check if admin operations are available
 */
export function isAdminAvailable(): boolean {
  return supabaseAdmin !== null;
}
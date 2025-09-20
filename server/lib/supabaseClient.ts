import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';

/**
 * Supabase client with anonymous key - for public operations
 * Safe to use on client-side and server-side
 * Respects Row Level Security (RLS) policies
 */
export const supabase = env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY 
  ? createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
      auth: { 
        persistSession: false,
        autoRefreshToken: false 
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'x-client-info': 'realestate-gironde/1.0.0'
        }
      }
    })
  : null;

/**
 * Test connection to Supabase
 */
export async function testSupabaseConnection(): Promise<boolean> {
  // Guard against null client
  if (!supabase) {
    console.warn('⚠️ Supabase client not available (missing credentials)');
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('leads')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.warn('⚠️ Supabase connection test warning:', error.message);
      return false;
    }
    
    console.log('✅ Supabase anonymous client connection verified');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection test failed:', error);
    return false;
  }
}
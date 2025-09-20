import { z } from 'zod';

// Environment variables schema
const envSchema = z.object({
  // Supabase configuration (using existing variable names)
  VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL must be a valid URL').optional(),
  VITE_SUPABASE_ANON_KEY: z.string().optional(),
  
  // Service role key (optional but recommended for admin operations)
  SUPABASE_SERVICE_KEY: z.string().optional(),
  
  // Database URL (for direct postgres connection if needed)
  DATABASE_URL: z.string().optional(),
  
  // Other environment variables
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(val => parseInt(val, 10)).default('5000'),
  
  // External service keys
  OPENAI_API_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASS: z.string().optional(),
});

function loadEnvironment() {
  try {
    const env = envSchema.parse(process.env);
    
    console.log('✅ Environment configuration loaded successfully');
    console.log(`📦 Environment: ${env.NODE_ENV}`);
    console.log(`🔌 Supabase URL: ${env.VITE_SUPABASE_URL ? 'configured' : 'missing'}`);
    console.log(`🔑 Supabase Anon Key: ${env.VITE_SUPABASE_ANON_KEY ? 'configured' : 'missing'}`);
    console.log(`🛡️ Supabase Service Key: ${env.SUPABASE_SERVICE_KEY ? 'configured' : 'not provided'}`);
    
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment configuration errors:');
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      throw new Error('Invalid environment configuration');
    }
    throw error;
  }
}

export const env = loadEnvironment();
export type Environment = z.infer<typeof envSchema>;
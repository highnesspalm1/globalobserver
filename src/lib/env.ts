// Environment Variables Schema and Validation
import { z } from 'zod';

// Define the schema for environment variables
const envSchema = z.object({
    // Supabase Configuration (optional - app works with fallback data)
    VITE_SUPABASE_URL: z.string().url().optional(),
    VITE_SUPABASE_ANON_KEY: z.string().min(1).optional(),

    // PMTiles Configuration (optional)
    VITE_PMTILES_URL: z.string().url().optional(),

    // Build/Runtime Info (auto-set by Vite)
    MODE: z.enum(['development', 'production', 'test']).default('development'),
    DEV: z.boolean().default(true),
    PROD: z.boolean().default(false),
    SSR: z.boolean().default(false),
});

// Parse and validate environment variables
function getEnv() {
    const parsed = envSchema.safeParse({
        VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
        VITE_PMTILES_URL: import.meta.env.VITE_PMTILES_URL,
        MODE: import.meta.env.MODE,
        DEV: import.meta.env.DEV,
        PROD: import.meta.env.PROD,
        SSR: import.meta.env.SSR,
    });

    if (!parsed.success) {
        console.warn('Environment validation warnings:', parsed.error.flatten().fieldErrors);
        // Return defaults for optional fields
        return {
            VITE_SUPABASE_URL: undefined,
            VITE_SUPABASE_ANON_KEY: undefined,
            VITE_PMTILES_URL: undefined,
            MODE: import.meta.env.MODE || 'development',
            DEV: import.meta.env.DEV ?? true,
            PROD: import.meta.env.PROD ?? false,
            SSR: import.meta.env.SSR ?? false,
        } as z.infer<typeof envSchema>;
    }

    return parsed.data;
}

// Export validated environment
export const env = getEnv();

// Type-safe getters with explicit checks
export const hasSupabaseConfig = (): boolean => {
    return !!(env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY);
};

export const hasPMTilesConfig = (): boolean => {
    return !!env.VITE_PMTILES_URL;
};

// Environment info for debugging
export const getEnvInfo = () => ({
    mode: env.MODE,
    isDevelopment: env.DEV,
    isProduction: env.PROD,
    hasSupabase: hasSupabaseConfig(),
    hasPMTiles: hasPMTilesConfig(),
});

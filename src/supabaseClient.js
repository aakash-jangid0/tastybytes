/**
 * ⚠️  DEPRECATED - DO NOT USE THIS FILE
 * 
 * This file is deprecated. Use src/lib/supabase.ts instead.
 * 
 * This file used to create multiple Supabase client instances which caused
 * "Multiple GoTrueClient instances detected" warnings. All imports have been
 * consolidated to use src/lib/supabase.ts as the single source of truth.
 * 
 * If you find any imports from this file still in the codebase, please update
 * them to use:
 *    import { supabase } from '../lib/supabase';
 * 
 * See CONSOLE_ERRORS_FIX.md for more details.
 */

// Re-export from the canonical location for backwards compatibility
export { supabase } from './lib/supabase';
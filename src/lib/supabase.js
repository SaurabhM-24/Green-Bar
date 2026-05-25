/**
 * @fileoverview Supabase client initialization.
 * Sets up the singleton client for communicating with the Supabase backend.
 */
import { createClient } from '@supabase/supabase-js';

/** @type {import('@supabase/supabase-js').SupabaseClient} The initialized Supabase client instance */
export const supabase = createClient(
	import.meta.env.VITE_SUPABASE_URL,
	import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

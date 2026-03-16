import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { env } from './env';

export const supabase: SupabaseClient | null =
  env.SUPABASE_URL.length > 0 && env.SUPABASE_ANON_KEY.length > 0
    ? createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)
    : null;


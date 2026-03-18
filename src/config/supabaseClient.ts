import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { env } from './env';
import { logger } from '../utils/logger';

const usingServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY.length > 0;
const supabaseKey = usingServiceRoleKey ? env.SUPABASE_SERVICE_ROLE_KEY : env.SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  env.SUPABASE_URL.length > 0 && supabaseKey.length > 0
    ? createClient(env.SUPABASE_URL, supabaseKey)
    : null;

if (supabase && !usingServiceRoleKey) {
  logger.warn(
    'Supabase client is using SUPABASE_ANON_KEY; RLS may hide users/password fields. Prefer SUPABASE_SERVICE_ROLE_KEY for server login.',
  );
}

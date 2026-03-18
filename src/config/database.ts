import { Pool } from 'pg';

import { env } from './env';
import { logger } from '../utils/logger';

export const pool =
  env.DATABASE_URL.length > 0
    ? new Pool({
      connectionString: env.DATABASE_URL,
      // Supabase requires SSL for remote connections.
      ssl: env.DB_SSL ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    })
    : null;

if (pool) {
  // Add a listener for unexpected errors in the pool
  pool.on('error', (err) => {
    logger.error({ err }, 'Unexpected error on idle PostgreSQL client');
  });
} else {
  logger.warn(
    { DATABASE_URL_present: false },
    'PostgreSQL pool not initialized (DATABASE_URL is empty). Fallback to Supabase client will be used.',
  );
}

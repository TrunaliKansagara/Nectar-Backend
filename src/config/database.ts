import { Pool } from 'pg';

import { env } from './env';
import { logger } from '../utils/logger';

export const pool =
  env.DATABASE_URL.length > 0
    ? new Pool({
        connectionString: env.DATABASE_URL,
        ssl: env.DB_SSL ? { rejectUnauthorized: false } : undefined,
      })
    : null;

if (!pool) {
  logger.warn(
    { DATABASE_URL_present: false },
    'PostgreSQL pool not initialized (DATABASE_URL is empty).',
  );
}


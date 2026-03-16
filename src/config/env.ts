import dotenv from 'dotenv';

dotenv.config();

const asNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const asBoolean = (value: string | undefined, fallback: boolean) => {
  if (value === undefined) return fallback;
  return value.toLowerCase() === 'true';
};

const required = (key: string) => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

export const env = {
  PORT: asNumber(process.env.PORT, 5000),
  NODE_ENV: process.env.NODE_ENV ?? 'development',

  SUPABASE_URL: process.env.SUPABASE_URL ?? '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ?? '',

  JWT_SECRET: required('JWT_SECRET'),

  DATABASE_URL: process.env.DATABASE_URL ?? '',
  DB_SSL: asBoolean(process.env.DB_SSL, false),
} as const;


import { pool } from '../config/database';
import { supabase } from '../config/supabaseClient';
import { MESSAGES } from '../constants/messages';
import { STATUS_CODES } from '../constants/statusCodes';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export type BrandRow = {
  id: number;
  name: string;
};

export const getAllBrandsRepo = async (): Promise<BrandRow[]> => {
  if (pool) {
    try {
      const result = await pool.query('SELECT id, name FROM brands ORDER BY name ASC');
      return result.rows as BrandRow[];
    } catch (err) {
      logger.error({ err }, 'PostgreSQL getAllBrandsRepo failed, falling back to Supabase');
    }
  }

  if (supabase) {
    const { data, error } = await supabase.from('brands').select('id, name').order('name');
    if (error) {
      logger.error({ err: error }, 'Supabase getAllBrandsRepo failed');
      throw new AppError(STATUS_CODES.INTERNAL_SERVER_ERROR, MESSAGES.INTERNAL_SERVER_ERROR);
    }
    return (data ?? []).map((r: any) => ({ id: Number(r.id), name: String(r.name) }));
  }

  return [];
};


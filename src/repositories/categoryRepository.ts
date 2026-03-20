import { pool } from '../config/database';
import { supabase } from '../config/supabaseClient';
import { MESSAGES } from '../constants/messages';
import { STATUS_CODES } from '../constants/statusCodes';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export type CategoryRow = {
  id: number;
  name: string;
  image: string | null;
};

export const getAllCategoriesRepo = async (): Promise<CategoryRow[]> => {
  if (pool) {
    try {
      const result = await pool.query(
        `
          SELECT
            id,
            name,
            image
          FROM categories
          ORDER BY name ASC
        `,
      );
      return result.rows as CategoryRow[];
    } catch (err) {
      logger.error({ err }, 'PostgreSQL getAllCategoriesRepo failed, falling back to Supabase');

      // Backward compatibility: older schema uses image_url
      try {
        const result = await pool.query(
          `
            SELECT
              id,
              name,
              image_url AS image
            FROM categories
            ORDER BY name ASC
          `,
        );
        return result.rows as CategoryRow[];
      } catch (retryErr) {
        logger.error({ err: retryErr }, 'PostgreSQL getAllCategoriesRepo (image_url fallback) failed');
      }
    }
  }

  if (supabase) {
    // Prefer new schema (image). If missing, fall back to image_url.
    const primary = await supabase
      .from('categories')
      .select('id, name, image')
      .order('name', { ascending: true });

    if (!primary.error) {
      return (primary.data ?? []).map((r: any) => ({
        id: Number(r.id),
        name: String(r.name),
        image: (r.image ?? null) as string | null,
      }));
    }

    if ((primary.error as any)?.code === '42703') {
      const fallback = await supabase
        .from('categories')
        .select('id, name, image_url')
        .order('name', { ascending: true });

      if (fallback.error) {
        logger.error({ err: fallback.error }, 'Supabase getAllCategoriesRepo failed');
        throw new AppError(STATUS_CODES.INTERNAL_SERVER_ERROR, MESSAGES.INTERNAL_SERVER_ERROR);
      }

      return (fallback.data ?? []).map((r: any) => ({
        id: Number(r.id),
        name: String(r.name),
        image: (r.image_url ?? null) as string | null,
      }));
    }

    logger.error({ err: primary.error }, 'Supabase getAllCategoriesRepo failed');
    throw new AppError(STATUS_CODES.INTERNAL_SERVER_ERROR, MESSAGES.INTERNAL_SERVER_ERROR);
  }

  return [];
};

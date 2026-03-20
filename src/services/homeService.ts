import { pool } from '../config/database';
import { supabase } from '../config/supabaseClient';
import { MESSAGES } from '../constants/messages';
import { STATUS_CODES } from '../constants/statusCodes';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export const getHomeData = async () => {
    if (pool) {
        try {
            const bannersPromise = pool.query('SELECT * FROM banners LIMIT 10');
            const categoriesPromise = pool.query('SELECT * FROM categories LIMIT 10');
            const exclusivePromise = pool.query('SELECT * FROM products WHERE is_exclusive = true LIMIT 10');
            const bestSellingPromise = pool.query('SELECT * FROM products WHERE is_best_selling = true LIMIT 10');

            const [banners, categories, exclusive, bestSelling] = await Promise.all([
                bannersPromise,
                categoriesPromise,
                exclusivePromise,
                bestSellingPromise,
            ]);

            return {
                banners: banners.rows,
                categories: categories.rows,
                exclusive_products: exclusive.rows,
                best_selling: bestSelling.rows,
            };
        } catch (err) {
            logger.error({ err }, 'PostgreSQL getHomeData failed, falling back to Supabase');
        }
    }

    if (supabase) {
        const bannersPromise = supabase.from('banners').select('*').limit(10);
        const categoriesPromise = supabase.from('categories').select('*').limit(10);
        const exclusivePromise = supabase.from('products').select('*').eq('is_exclusive', true).limit(10);
        const bestSellingPromise = supabase.from('products').select('*').eq('is_best_selling', true).limit(10);

        const [banners, categories, exclusive, bestSelling] = await Promise.all([
            bannersPromise,
            categoriesPromise,
            exclusivePromise,
            bestSellingPromise,
        ]);

        if (banners.error || categories.error || exclusive.error || bestSelling.error) {
            logger.error(
                {
                    bannersError: banners.error ?? undefined,
                    categoriesError: categories.error ?? undefined,
                    exclusiveError: exclusive.error ?? undefined,
                    bestSellingError: bestSelling.error ?? undefined,
                },
                'Supabase getHomeData failed',
            );
            throw new AppError(STATUS_CODES.INTERNAL_SERVER_ERROR, MESSAGES.INTERNAL_SERVER_ERROR);
        }

        return {
            banners: banners.data,
            categories: categories.data,
            exclusive_products: exclusive.data,
            best_selling: bestSelling.data,
        };
    }

    return { banners: [], categories: [], exclusive_products: [], best_selling: [] };
};

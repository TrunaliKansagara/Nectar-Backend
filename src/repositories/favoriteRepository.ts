import { pool } from '../config/database';
import { supabase } from '../config/supabaseClient';
import { MESSAGES } from '../constants/messages';
import { STATUS_CODES } from '../constants/statusCodes';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export type FavoriteProduct = {
    id: number;
    name: string;
    price: number;
    image: string | null;
};

export const addFavoriteRepo = async (userId: number, productId: number) => {
    if (pool) {
        try {
            await pool.query(
                `INSERT INTO favorites (user_id, product_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, product_id) DO NOTHING`,
                [userId, productId],
            );
            return true;
        } catch (err) {
            logger.error({ err }, 'PostgreSQL addFavoriteRepo failed, falling back to Supabase');
        }
    }

    if (supabase) {
        const { error } = await supabase.from('favorites').upsert({ user_id: userId, product_id: productId }, { onConflict: 'user_id, product_id' });
        if (error) {
            logger.error({ err: error }, 'Supabase addFavoriteRepo failed');
            throw new AppError(STATUS_CODES.INTERNAL_SERVER_ERROR, MESSAGES.INTERNAL_SERVER_ERROR);
        }
        return true;
    }
    return false;
};

export const removeFavoriteRepo = async (userId: number, productId: number) => {
    if (pool) {
        try {
            await pool.query('DELETE FROM favorites WHERE user_id = $1 AND product_id = $2', [userId, productId]);
            return true;
        } catch (err) {
            logger.error({ err }, 'PostgreSQL removeFavoriteRepo failed, falling back to Supabase');
        }
    }

    if (supabase) {
        const { error } = await supabase.from('favorites').delete().match({ user_id: userId, product_id: productId });
        if (error) {
            logger.error({ err: error }, 'Supabase removeFavoriteRepo failed');
            throw new AppError(STATUS_CODES.INTERNAL_SERVER_ERROR, MESSAGES.INTERNAL_SERVER_ERROR);
        }
        return true;
    }
    return false;
};

export const getFavoritesRepo = async (userId: number, page: number, limit: number) => {
    const offset = (page - 1) * limit;

    if (pool) {
        try {
            const countRes = await pool.query('SELECT COUNT(*)::int AS total FROM favorites WHERE user_id = $1', [userId]);
            const total = countRes.rows[0].total;

            const dataRes = await pool.query(
                `SELECT p.id, p.name, p.price, COALESCE(p.image, p.image_url) AS image
         FROM favorites f
         JOIN products p ON f.product_id = p.id
         WHERE f.user_id = $1
         ORDER BY f.created_at DESC
         LIMIT $2 OFFSET $3`,
                [userId, limit, offset],
            );

            return { data: dataRes.rows as FavoriteProduct[], total };
        } catch (err) {
            logger.error({ err }, 'PostgreSQL getFavoritesRepo failed, falling back to Supabase');
        }
    }

    if (supabase) {
        const { data, count, error } = await supabase
            .from('favorites')
            .select('product_id, products(id, name, price, image, image_url)', { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            logger.error({ err: error }, 'Supabase getFavoritesRepo failed');
            throw new AppError(STATUS_CODES.INTERNAL_SERVER_ERROR, MESSAGES.INTERNAL_SERVER_ERROR);
        }

        const items = (data ?? []).map((f: any) => ({
            id: Number(f.products.id),
            name: String(f.products.name),
            price: Number(f.products.price),
            image: (f.products.image || f.products.image_url || null) as string | null,
        }));

        return { data: items, total: count ?? 0 };
    }

    return { data: [], total: 0 };
};

export const checkProductExistsRepo = async (productId: number) => {
    if (pool) {
        try {
            const res = await pool.query('SELECT EXISTS(SELECT 1 FROM products WHERE id = $1)', [productId]);
            return res.rows[0].exists;
        } catch (err) {
            logger.error({ err }, 'PostgreSQL checkProductExistsRepo failed, falling back to Supabase');
        }
    }
    if (supabase) {
        const { data, error } = await supabase.from('products').select('id').eq('id', productId).limit(1);
        if (error) {
            logger.error({ err: error }, 'Supabase checkProductExistsRepo failed');
            throw new AppError(STATUS_CODES.INTERNAL_SERVER_ERROR, MESSAGES.INTERNAL_SERVER_ERROR);
        }
        return (data?.length ?? 0) > 0;
    }
    return false;
};

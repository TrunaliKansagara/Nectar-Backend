import { pool } from '../config/database';
import { supabase } from '../config/supabaseClient';
import { MESSAGES } from '../constants/messages';
import { STATUS_CODES } from '../constants/statusCodes';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';
import { getProductDetailsById } from './productService';

export type CartItemWithProduct = {
  id: number;
  quantity: number;
  product_id: number;
  product: Record<string, unknown>;
};

type PgCartJoinRow = {
  cart_item_id: number;
  quantity: number;
  product_id: number;
} & Record<string, unknown>;

const mapPgCartRow = (row: PgCartJoinRow): CartItemWithProduct => {
  const { cart_item_id, quantity, product_id, ...product } = row;
  return {
    id: Number(cart_item_id),
    quantity: Number(quantity),
    product_id: Number(product_id),
    product,
  };
};

export const addToCart = async (userId: number, productId: number, quantity: number) => {
  await getProductDetailsById(productId);

  if (pool) {
    try {
      const existing = await pool.query(
        'SELECT id, quantity FROM cart WHERE user_id = $1 AND product_id = $2 LIMIT 1',
        [userId, productId],
      );

      if (existing.rows.length > 0) {
        const cartItemId = existing.rows[0].id as number;
        const updated = await pool.query(
          'UPDATE cart SET quantity = quantity + $1 WHERE id = $2 AND user_id = $3 RETURNING *',
          [quantity, cartItemId, userId],
        );
        return updated.rows[0];
      }

      const created = await pool.query(
        'INSERT INTO cart (user_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *',
        [userId, productId, quantity],
      );
      return created.rows[0];
    } catch (err) {
      logger.error({ err }, 'PostgreSQL addToCart failed, falling back to Supabase');
    }
  }

  if (supabase) {
    const { data: existing, error: existingError } = await supabase
      .from('cart')
      .select('id, quantity')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle();

    if (existingError) {
      logger.error({ err: existingError }, 'Supabase addToCart (read existing) failed');
      throw new AppError(STATUS_CODES.INTERNAL_SERVER_ERROR, MESSAGES.INTERNAL_SERVER_ERROR);
    }

    if (existing) {
      const existingQuantity = Number((existing as Record<string, unknown>).quantity ?? 0);
      const { data, error } = await supabase
        .from('cart')
        .update({ quantity: existingQuantity + quantity })
        .eq('id', (existing as Record<string, unknown>).id as number)
        .eq('user_id', userId)
        .select('*')
        .single();
      if (error) {
        logger.error({ err: error }, 'Supabase addToCart (update) failed');
        throw new AppError(STATUS_CODES.INTERNAL_SERVER_ERROR, MESSAGES.INTERNAL_SERVER_ERROR);
      }
      return data;
    }

    const { data, error } = await supabase
      .from('cart')
      .insert({ user_id: userId, product_id: productId, quantity })
      .select('*')
      .single();

    if (error) {
      logger.error({ err: error }, 'Supabase addToCart (insert) failed');
      throw new AppError(STATUS_CODES.INTERNAL_SERVER_ERROR, MESSAGES.INTERNAL_SERVER_ERROR);
    }
    return data;
  }

  throw new AppError(STATUS_CODES.INTERNAL_SERVER_ERROR, MESSAGES.INTERNAL_SERVER_ERROR);
};

export const getCartItems = async (userId: number): Promise<CartItemWithProduct[]> => {
  if (pool) {
    try {
      const result = await pool.query(
        `
          SELECT
            c.id AS cart_item_id,
            c.quantity,
            c.product_id,
            p.*
          FROM cart c
          JOIN products p ON p.id = c.product_id
          WHERE c.user_id = $1
          ORDER BY c.id DESC
        `,
        [userId],
      );
      return (result.rows as PgCartJoinRow[]).map(mapPgCartRow);
    } catch (err) {
      logger.error({ err }, 'PostgreSQL getCartItems failed, falling back to Supabase');
    }
  }

  if (supabase) {
    const { data: cartRows, error } = await supabase
      .from('cart')
      .select('id, product_id, quantity')
      .eq('user_id', userId)
      .order('id', { ascending: false });

    if (error) {
      logger.error({ err: error }, 'Supabase getCartItems failed');
      throw new AppError(STATUS_CODES.INTERNAL_SERVER_ERROR, MESSAGES.INTERNAL_SERVER_ERROR);
    }

    const productIds = Array.from(new Set((cartRows ?? []).map((r) => r.product_id as number)));
    if (productIds.length === 0) return [];

    const { data: products, error: productError } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds);

    if (productError) {
      logger.error({ err: productError }, 'Supabase getCartItems (products) failed');
      throw new AppError(STATUS_CODES.INTERNAL_SERVER_ERROR, MESSAGES.INTERNAL_SERVER_ERROR);
    }

    const productById = new Map<number, Record<string, unknown>>();
    for (const p of products ?? []) {
      const record = p as Record<string, unknown>;
      const id = Number(record.id);
      if (!Number.isNaN(id)) productById.set(id, record);
    }

    return (cartRows ?? []).map((row) => ({
      id: Number(row.id),
      quantity: Number(row.quantity),
      product_id: Number(row.product_id),
      product: productById.get(Number(row.product_id)) ?? {},
    }));
  }

  return [];
};

export const updateCartItemQuantity = async (userId: number, cartItemId: number, quantity: number) => {
  if (pool) {
    try {
      const result = await pool.query(
        'UPDATE cart SET quantity = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
        [quantity, cartItemId, userId],
      );
      if (result.rows.length === 0)
        throw new AppError(STATUS_CODES.NOT_FOUND, MESSAGES.CART_ITEM_NOT_FOUND);
      return result.rows[0];
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error({ err }, 'PostgreSQL updateCartItemQuantity failed, falling back to Supabase');
    }
  }

  if (supabase) {
    const { data, error } = await supabase
      .from('cart')
      .update({ quantity })
      .eq('id', cartItemId)
      .eq('user_id', userId)
      .select('*')
      .maybeSingle();

    if (error) {
      logger.error({ err: error }, 'Supabase updateCartItemQuantity failed');
      throw new AppError(STATUS_CODES.INTERNAL_SERVER_ERROR, MESSAGES.INTERNAL_SERVER_ERROR);
    }
    if (!data) throw new AppError(STATUS_CODES.NOT_FOUND, MESSAGES.CART_ITEM_NOT_FOUND);
    return data;
  }

  throw new AppError(STATUS_CODES.INTERNAL_SERVER_ERROR, MESSAGES.INTERNAL_SERVER_ERROR);
};

export const deleteCartItem = async (userId: number, cartItemId: number) => {
  if (pool) {
    try {
      const result = await pool.query(
        'DELETE FROM cart WHERE id = $1 AND user_id = $2 RETURNING id',
        [cartItemId, userId],
      );
      if (result.rows.length === 0)
        throw new AppError(STATUS_CODES.NOT_FOUND, MESSAGES.CART_ITEM_NOT_FOUND);
      return;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error({ err }, 'PostgreSQL deleteCartItem failed, falling back to Supabase');
    }
  }

  if (supabase) {
    const { data, error } = await supabase
      .from('cart')
      .delete()
      .eq('id', cartItemId)
      .eq('user_id', userId)
      .select('id')
      .maybeSingle();

    if (error) {
      logger.error({ err: error }, 'Supabase deleteCartItem failed');
      throw new AppError(STATUS_CODES.INTERNAL_SERVER_ERROR, MESSAGES.INTERNAL_SERVER_ERROR);
    }
    if (!data) throw new AppError(STATUS_CODES.NOT_FOUND, MESSAGES.CART_ITEM_NOT_FOUND);
    return;
  }

  throw new AppError(STATUS_CODES.INTERNAL_SERVER_ERROR, MESSAGES.INTERNAL_SERVER_ERROR);
};

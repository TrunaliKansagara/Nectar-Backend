import { pool } from '../config/database';
import { supabase } from '../config/supabaseClient';
import { MESSAGES } from '../constants/messages';
import { STATUS_CODES } from '../constants/statusCodes';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export type CreateOrderInput = {
    userId: number;
    totalAmount: number;
    deliveryMethod: string;
    paymentMethod: string;
    addressId: number;
    promoCode?: string | null;
    items: Array<{ productId: number; quantity: number; price: number }>;
};

export const createOrderRepo = async (input: CreateOrderInput) => {
    if (pool) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Insert Order
            const orderRes = await client.query(
                `INSERT INTO orders (user_id, total_amount, delivery_method, payment_method, address_id, payment_status)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
                [input.userId, input.totalAmount, input.deliveryMethod, input.paymentMethod, input.addressId, 'pending'],
            );
            const orderId = Number(orderRes.rows[0].id);

            // 2. Insert Items (Batch)
            const values: any[] = [];
            const itemQueries = input.items.map((it, idx) => {
                const offset = idx * 4;
                values.push(orderId, it.productId, it.quantity, it.price);
                return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`;
            }).join(', ');

            await client.query(
                `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ${itemQueries}`,
                values,
            );

            await client.query('COMMIT');
            return { order_id: orderId, total_amount: input.totalAmount, payment_status: 'pending' };
        } catch (err) {
            await client.query('ROLLBACK');
            logger.error({ err }, 'PostgreSQL order transaction failed');
            throw new AppError(STATUS_CODES.INTERNAL_SERVER_ERROR, MESSAGES.INTERNAL_SERVER_ERROR);
        } finally {
            client.release();
        }
    }

    if (supabase) {
        // Note: Supabase JS SDK doesn't support transactions on multiple tables natively.
        // For production production, you should use a postgres function (RPC).
        // Here we implement sequential calls with manual "pseudo-transaction" cleanup.
        const { data: order, error: orderErr } = await supabase
            .from('orders')
            .insert({
                user_id: input.userId,
                total_amount: input.totalAmount,
                delivery_method: input.deliveryMethod,
                payment_method: input.paymentMethod,
                address_id: input.addressId,
                payment_status: 'pending',
            })
            .select('id')
            .single();

        if (orderErr) {
            logger.error({ err: orderErr }, 'Supabase order insertion failed');
            throw new AppError(STATUS_CODES.INTERNAL_SERVER_ERROR, MESSAGES.INTERNAL_SERVER_ERROR);
        }

        const orderId = Number(order.id);

        const { error: itemsErr } = await supabase.from('order_items').insert(
            input.items.map(it => ({
                order_id: orderId,
                product_id: it.productId,
                quantity: it.quantity,
                price: it.price,
            })),
        );

        if (itemsErr) {
            // Manual cleanup (pseudo-rollback)
            await supabase.from('orders').delete().eq('id', orderId);
            logger.error({ err: itemsErr }, 'Supabase order items insertion failed');
            throw new AppError(STATUS_CODES.INTERNAL_SERVER_ERROR, MESSAGES.INTERNAL_SERVER_ERROR);
        }

        return { order_id: orderId, total_amount: input.totalAmount, payment_status: 'pending' };
    }

    throw new AppError(STATUS_CODES.INTERNAL_SERVER_ERROR, MESSAGES.INTERNAL_SERVER_ERROR);
};

export const fetchProductPricesByItemIds = async (productIds: number[]) => {
    if (pool) {
        const res = await pool.query('SELECT id, price FROM products WHERE id = ANY($1)', [productIds]);
        return res.rows;
    }
    if (supabase) {
        const { data, error } = await supabase.from('products').select('id, price').in('id', productIds);
        if (error) throw error;
        return data;
    }
    return [];
};

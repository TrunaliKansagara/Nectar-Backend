import { z } from 'zod';

const orderItemSchema = z.object({
    product_id: z.coerce.number().int().positive(),
    quantity: z.coerce.number().int().positive(),
});

export const placeOrderSchema = z.object({
    delivery_method: z.enum(['home_delivery', 'pickup']),
    payment_method: z.enum(['cod', 'online']),
    promo_code: z.string().optional().nullable(),
    address_id: z.coerce.number().int().positive(),
    items: z.array(orderItemSchema).min(1, 'At least one item is required'),
});

export const orderSummarySchema = z.object({
    promo_code: z.string().optional().nullable(),
    items: z.array(orderItemSchema).min(1),
});

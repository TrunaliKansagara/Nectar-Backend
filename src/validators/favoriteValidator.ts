import { z } from 'zod';

export const addFavoriteSchema = z.object({
    product_id: z.coerce.number().int().positive(),
});

export const removeFavoriteSchema = z.object({
    product_id: z.coerce.number().int().positive(),
});

export const listFavoritesSchema = z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().optional().default(10),
});

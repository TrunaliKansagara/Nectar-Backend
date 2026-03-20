import { z } from 'zod';

const asPositiveInt = (fallback: number) =>
  z.coerce.number().int().positive().catch(fallback);

const asOptionalInt = () => z.coerce.number().int().positive().optional();

const asOptionalMoney = () => z.coerce.number().nonnegative().optional();

export const productIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listProductsQuerySchema = z.object({
  page: asPositiveInt(1),
  limit: z.coerce.number().int().min(1).max(100).catch(10),
  category_id: asOptionalInt(),
  search: z.string().trim().min(1).optional(),
  brand_id: asOptionalInt(),
  min_price: asOptionalMoney(),
  max_price: asOptionalMoney(),
  sort: z.enum(['price_asc', 'price_desc', 'latest']).optional(),
});


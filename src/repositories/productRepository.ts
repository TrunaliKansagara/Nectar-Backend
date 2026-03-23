import { pool } from '../config/database';
import { supabase } from '../config/supabaseClient';
import { MESSAGES } from '../constants/messages';
import { STATUS_CODES } from '../constants/statusCodes';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export type ProductSort = 'price_asc' | 'price_desc' | 'newest' | 'latest';

export type ProductListQuery = {
  page: number;
  limit: number;
  category_ids?: number[];
  brand_ids?: number[];
  search?: string;
  min_price?: number;
  max_price?: number;
  sort?: ProductSort;
};

export type ProductListItem = {
  id: number;
  name: string;
  price: number;
  image: string | null;
  description: string | null;
  unit: string | null;
  category_id: number | null;
  brand_id: number | null;
  created_at: string | null;
};

export type PaginatedResult<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
};

export const extractUnit = (desc: string | null): string | null => {
  if (!desc) return null;
  const dotIndex = desc.indexOf('.');
  if (dotIndex > 0) return desc.substring(0, dotIndex).trim();
  return null;
};

const buildSortSql = (sort?: ProductSort) => {
  switch (sort) {
    case 'price_asc':
      return 'ORDER BY p.price ASC, p.id DESC';
    case 'price_desc':
      return 'ORDER BY p.price DESC, p.id DESC';
    case 'newest':
    case 'latest':
    default:
      return 'ORDER BY p.created_at DESC NULLS LAST, p.id DESC';
  }
};

export const listProductsRepo = async (
  query: ProductListQuery,
): Promise<PaginatedResult<ProductListItem>> => {
  const page = Math.max(1, query.page);
  const limit = Math.min(100, Math.max(1, query.limit));
  const offset = (page - 1) * limit;

  // Normalize inputs
  const categoryIds = query.category_ids?.length ? query.category_ids : null;
  const brandIds = query.brand_ids?.length ? query.brand_ids : null;
  const search = query.search && query.search.trim().length > 0 ? `%${query.search.trim()}%` : null;
  const minPrice = query.min_price !== undefined ? Number(query.min_price) : null;
  const maxPrice = query.max_price !== undefined ? Number(query.max_price) : null;

  if (pool) {
    try {
      const values = [categoryIds, brandIds, search, minPrice, maxPrice];
      const whereSql = `
        WHERE ($1::int[] IS NULL OR p.category_id = ANY($1))
        AND ($2::int[] IS NULL OR p.brand_id = ANY($2))
        AND ($3::text IS NULL OR p.name ILIKE $3)
        AND ($4::numeric IS NULL OR p.price >= $4)
        AND ($5::numeric IS NULL OR p.price <= $5)
      `;

      const countResult = await pool.query(
        `SELECT COUNT(*)::int AS total FROM products p ${whereSql}`,
        values,
      );
      const total = Number((countResult.rows[0] as any)?.total ?? 0);

      const dataResult = await pool.query(
        `
          SELECT
            p.id, p.name, p.price, p.description,
            p.image, p.image_url, -- Support both columns
            p.category_id, p.brand_id, p.created_at
          FROM products p
          ${whereSql}
          ${buildSortSql(query.sort)}
          LIMIT $6 OFFSET $7
        `,
        [...values, limit, offset],
      );

      return {
        data: dataResult.rows.map(r => ({
          ...r,
          image: r.image || r.image_url || null, // Normalize image
          unit: extractUnit(r.description),
        })) as ProductListItem[],
        pagination: { page, limit, total },
      };
    } catch (err) {
      logger.error({ err }, 'PostgreSQL listProductsRepo failed, falling back to Supabase');
    }
  }

  if (supabase) {
    let qb = supabase
      .from('products')
      .select('id, name, price, description, image, image_url, category_id, brand_id, created_at', {
        count: 'exact',
      });

    if (categoryIds) qb = qb.in('category_id', categoryIds);
    if (brandIds) qb = qb.in('brand_id', brandIds);
    if (minPrice !== null) qb = qb.gte('price', minPrice);
    if (maxPrice !== null) qb = qb.lte('price', maxPrice);
    if (search) qb = qb.ilike('name', search);

    if (query.sort === 'price_asc')
      qb = qb.order('price', { ascending: true }).order('id', { ascending: false });
    else if (query.sort === 'price_desc')
      qb = qb.order('price', { ascending: false }).order('id', { ascending: false });
    else qb = qb.order('created_at', { ascending: false }).order('id', { ascending: false });

    const { data, count, error } = await qb.range(offset, offset + limit - 1);

    if (error) {
      logger.error({ err: error }, 'Supabase listProductsRepo failed');
      throw new AppError(STATUS_CODES.INTERNAL_SERVER_ERROR, MESSAGES.INTERNAL_SERVER_ERROR);
    }

    const total = Number(count ?? 0);

    const items: ProductListItem[] = (data ?? []).map((r: any) => ({
      id: Number(r.id),
      name: String(r.name),
      price: Number(r.price),
      description: r.description ? String(r.description) : null,
      unit: extractUnit(r.description),
      image: (r.image ?? r.image_url ?? null) as string | null,
      category_id: r.category_id ? Number(r.category_id) : null,
      brand_id: r.brand_id ? Number(r.brand_id) : null,
      created_at: (r.created_at ?? null) as string | null,
    }));

    return {
      data: items,
      pagination: { page, limit, total },
    };
  }

  return { data: [], pagination: { page, limit, total: 0 } };
};

export type ProductDetail = {
  id: number;
  name: string;
  description: string | null;
  unit: string | null;
  price: number;
  images: string[];
  is_favorite: boolean;
  created_at: string | null;
  brand: { id: number; name: string } | null;
  category: { id: number; name: string; image: string | null } | null;
};

export const getProductDetailRepo = async (productId: number, userId?: number): Promise<ProductDetail | null> => {
  if (pool) {
    try {
      const result = await pool.query(
        `
          SELECT
            p.id,
            p.name,
            p.description,
            p.price,
            to_jsonb(ARRAY[p.image]::text[]) AS images_json,
            p.created_at,
            b.id AS brand_id,
            b.name AS brand_name,
            c.id AS category_id,
            c.name AS category_name,
            c.image AS category_image,
            EXISTS(SELECT 1 FROM favorites WHERE user_id = $2 AND product_id = $1) AS is_favorite
          FROM products p
          LEFT JOIN brands b ON b.id = p.brand_id
          LEFT JOIN categories c ON c.id = p.category_id
          WHERE p.id = $1
          LIMIT 1
        `,
        [productId, userId || null],
      );

      const row = result.rows[0] as any;
      if (!row) return null;

      const images = Array.isArray(row.images_json) ? row.images_json : [row.image].filter(Boolean);

      return {
        id: Number(row.id),
        name: String(row.name),
        description: (row.description ?? null) as string | null,
        unit: extractUnit(row.description),
        price: Number(row.price),
        images: (images ?? []).filter(Boolean).map((v: any) => String(v)),
        is_favorite: !!row.is_favorite,
        created_at: (row.created_at ?? null) as string | null,
        brand: row.brand_id ? { id: Number(row.brand_id), name: String(row.brand_name) } : null,
        category: row.category_id
          ? {
            id: Number(row.category_id),
            name: String(row.category_name),
            image: (row.category_image ?? null) as string | null,
          }
          : null,
      };
    } catch (err) {
      logger.error({ err }, 'PostgreSQL getProductDetailRepo failed, falling back to Supabase');

      // Backward compatibility: older schema uses image_url and categories.image_url
      try {
        const result = await pool.query(
          `
            SELECT
              p.id,
              p.name,
              p.description,
              p.price,
              to_jsonb(ARRAY[p.image_url]::text[]) AS images_json,
              p.created_at,
              NULL::bigint AS brand_id,
              NULL::text AS brand_name,
              c.id AS category_id,
              c.name AS category_name,
              c.image_url AS category_image
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id
            WHERE p.id = $1
            LIMIT 1
          `,
          [productId],
        );
        const row = result.rows[0] as any;
        if (!row) return null;

        const images = Array.isArray(row.images_json) ? row.images_json : [row.image_url].filter(Boolean);

        const isFavoriteRes = await pool.query('SELECT EXISTS(SELECT 1 FROM favorites WHERE user_id = $1 AND product_id = $2) AS is_favorite', [userId || null, productId]);
        const isFavorite = isFavoriteRes.rows[0].is_favorite;

        return {
          id: Number(row.id),
          name: String(row.name),
          description: (row.description ?? null) as string | null,
          unit: extractUnit(row.description),
          price: Number(row.price),
          images: (images ?? []).filter(Boolean).map((v: any) => String(v)),
          is_favorite: isFavorite,
          created_at: (row.created_at ?? null) as string | null,
          brand: null,
          category: row.category_id
            ? {
              id: Number(row.category_id),
              name: String(row.category_name),
              image: (row.category_image ?? null) as string | null,
            }
            : null,
        };
      } catch (retryErr) {
        logger.error({ err: retryErr }, 'PostgreSQL getProductDetailRepo (fallback) failed');
      }
    }
  }

  if (supabase) {
    // Prefer new schema first.
    const primary = await supabase
      .from('products')
      .select('id, name, description, price, image, category_id, brand_id, created_at')
      .eq('id', productId)
      .maybeSingle();

    // Fallback: older schema uses image_url and may not have brand_id
    const product =
      !primary.error
        ? primary.data
        : (primary.error as any)?.code === '42703'
          ? (
            await supabase
              .from('products')
              .select('id, name, description, price, image_url, category_id, created_at')
              .eq('id', productId)
              .maybeSingle()
          ).data
          : null;

    const productError =
      !primary.error
        ? null
        : (primary.error as any)?.code === '42703'
          ? null
          : primary.error;

    if (productError) {
      logger.error({ err: productError }, 'Supabase getProductDetailRepo (product) failed');
      throw new AppError(STATUS_CODES.INTERNAL_SERVER_ERROR, MESSAGES.INTERNAL_SERVER_ERROR);
    }
    if (!product) return null;

    // Check if favorite
    let isFavorite = false;
    if (userId) {
      const { data: fav } = await supabase.from('favorites').select('id').eq('user_id', userId).eq('product_id', productId).maybeSingle();
      isFavorite = !!fav;
    }

    const brandId = (product as any).brand_id as number | undefined;
    const categoryId = (product as any).category_id as number | undefined;

    const [brand, categoryPrimary, categoryFallback] = await Promise.all([
      brandId ? supabase.from('brands').select('id, name').eq('id', brandId).maybeSingle() : Promise.resolve(null as any),
      categoryId
        ? supabase.from('categories').select('id, name, image').eq('id', categoryId).maybeSingle()
        : Promise.resolve(null as any),
      categoryId
        ? supabase.from('categories').select('id, name, image_url').eq('id', categoryId).maybeSingle()
        : Promise.resolve(null as any),
    ]);

    const category =
      categoryPrimary && !categoryPrimary.error
        ? categoryPrimary
        : categoryFallback && !categoryFallback.error
          ? categoryFallback
          : null;

    if (brand?.error) {
      logger.error({ err: brand.error }, 'Supabase getProductDetailRepo (brand) failed');
      throw new AppError(STATUS_CODES.INTERNAL_SERVER_ERROR, MESSAGES.INTERNAL_SERVER_ERROR);
    }

    const images = [(((product as any).image ?? (product as any).image_url) ?? null)].filter(Boolean);

    return {
      id: Number((product as any).id),
      name: String((product as any).name),
      description: ((product as any).description ?? null) as string | null,
      unit: extractUnit((product as any).description),
      price: Number((product as any).price),
      images: images.map((v: any) => String(v)),
      is_favorite: isFavorite,
      created_at: (((product as any).created_at ?? null) as string | null) ?? null,
      brand: brand?.data ? { id: Number(brand.data.id), name: String(brand.data.name) } : null,
      category: category?.data
        ? {
          id: Number(category.data.id),
          name: String(category.data.name),
          image: (((category.data as any).image ?? (category.data as any).image_url) ?? null) as
            | string
            | null,
        }
        : null,
    };
  }

  return null;
};

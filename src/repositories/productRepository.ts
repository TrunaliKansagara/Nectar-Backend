import { pool } from '../config/database';
import { supabase } from '../config/supabaseClient';
import { MESSAGES } from '../constants/messages';
import { STATUS_CODES } from '../constants/statusCodes';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export type ProductSort = 'price_asc' | 'price_desc' | 'latest';

export type ProductListQuery = {
  page: number;
  limit: number;
  category_id?: number;
  search?: string;
  brand_id?: number;
  min_price?: number;
  max_price?: number;
  sort?: ProductSort;
};

export type ProductListItem = {
  id: number;
  name: string;
  price: number;
  image: string | null;
  category_id: number | null;
  brand_id: number | null;
  created_at: string | null;
};

export type PaginatedResult<T> = {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
};

const buildSortSql = (sort?: ProductSort) => {
  switch (sort) {
    case 'price_asc':
      return 'ORDER BY p.price ASC, p.id DESC';
    case 'price_desc':
      return 'ORDER BY p.price DESC, p.id DESC';
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

  if (pool) {
    try {
      const whereParts: string[] = [];
      const values: Array<string | number> = [];

      const add = (sql: string, value: string | number) => {
        values.push(value);
        whereParts.push(sql.replace('?', `$${values.length}`));
      };

      if (query.category_id !== undefined) add('p.category_id = ?', query.category_id);
      if (query.brand_id !== undefined) add('p.brand_id = ?', query.brand_id);
      if (query.min_price !== undefined) add('p.price >= ?', query.min_price);
      if (query.max_price !== undefined) add('p.price <= ?', query.max_price);
      if (query.search && query.search.trim().length > 0)
        add('p.name ILIKE ?', `%${query.search.trim()}%`);

      const whereSql = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';
      const sortSql = buildSortSql(query.sort);

      const countResult = await pool.query(
        `SELECT COUNT(*)::int AS total FROM products p ${whereSql}`,
        values,
      );
      const total = Number((countResult.rows[0] as any)?.total ?? 0);
      const totalPages = Math.max(1, Math.ceil(total / limit));

      const dataValues = [...values, limit, offset];
      const dataResult = await pool.query(
        `
          SELECT
            p.id,
            p.name,
            p.price,
            p.image,
            p.category_id,
            p.brand_id,
            p.created_at
          FROM products p
          ${whereSql}
          ${sortSql}
          LIMIT $${values.length + 1}
          OFFSET $${values.length + 2}
        `,
        dataValues,
      );

      return {
        items: dataResult.rows as ProductListItem[],
        pagination: { page, limit, total, total_pages: totalPages },
      };
    } catch (err) {
      logger.error({ err }, 'PostgreSQL listProductsRepo failed, falling back to Supabase');

      // Backward compatibility: older schema uses image_url, and may not have brand_id
      try {
        const whereParts: string[] = [];
        const values: Array<string | number> = [];
        const add = (sql: string, value: string | number) => {
          values.push(value);
          whereParts.push(sql.replace('?', `$${values.length}`));
        };

        if (query.category_id !== undefined) add('p.category_id = ?', query.category_id);
        if (query.min_price !== undefined) add('p.price >= ?', query.min_price);
        if (query.max_price !== undefined) add('p.price <= ?', query.max_price);
        if (query.search && query.search.trim().length > 0)
          add('p.name ILIKE ?', `%${query.search.trim()}%`);

        const whereSql = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';
        const sortSql = buildSortSql(query.sort);

        const countResult = await pool.query(
          `SELECT COUNT(*)::int AS total FROM products p ${whereSql}`,
          values,
        );
        const total = Number((countResult.rows[0] as any)?.total ?? 0);
        const totalPages = Math.max(1, Math.ceil(total / limit));

        const dataValues = [...values, limit, offset];
        const dataResult = await pool.query(
          `
            SELECT
              p.id,
              p.name,
              p.price,
              p.image_url AS image,
              p.category_id,
              NULL::bigint AS brand_id,
              p.created_at
            FROM products p
            ${whereSql}
            ${sortSql}
            LIMIT $${values.length + 1}
            OFFSET $${values.length + 2}
          `,
          dataValues,
        );

        return {
          items: dataResult.rows as ProductListItem[],
          pagination: { page, limit, total, total_pages: totalPages },
        };
      } catch (retryErr) {
        logger.error({ err: retryErr }, 'PostgreSQL listProductsRepo (fallback) failed');
      }
    }
  }

  if (supabase) {
    const pageFrom = offset;
    const pageTo = offset + limit - 1;

    // Prefer new schema (image + brand_id). If missing, fall back to image_url and/or no brand_id.
    let qb = supabase.from('products').select('id, name, price, image, category_id, brand_id, created_at', {
      count: 'exact',
    });

    if (query.category_id !== undefined) qb = qb.eq('category_id', query.category_id);
    if (query.brand_id !== undefined) qb = qb.eq('brand_id', query.brand_id);
    if (query.min_price !== undefined) qb = qb.gte('price', query.min_price);
    if (query.max_price !== undefined) qb = qb.lte('price', query.max_price);
    if (query.search && query.search.trim().length > 0) qb = qb.ilike('name', `%${query.search.trim()}%`);

    if (query.sort === 'price_asc') qb = qb.order('price', { ascending: true }).order('id', { ascending: false });
    else if (query.sort === 'price_desc')
      qb = qb.order('price', { ascending: false }).order('id', { ascending: false });
    else qb = qb.order('created_at', { ascending: false }).order('id', { ascending: false });

    let data: any[] | null = null;
    let count: number | null = null;
    const primary = await qb.range(pageFrom, pageTo);

    if (!primary.error) {
      data = primary.data as any[] | null;
      count = primary.count as number | null;
    } else if ((primary.error as any)?.code === '42703') {
      let qbFallback = supabase
        .from('products')
        .select('id, name, price, image_url, category_id, created_at', { count: 'exact' });

      if (query.category_id !== undefined) qbFallback = qbFallback.eq('category_id', query.category_id);
      if (query.min_price !== undefined) qbFallback = qbFallback.gte('price', query.min_price);
      if (query.max_price !== undefined) qbFallback = qbFallback.lte('price', query.max_price);
      if (query.search && query.search.trim().length > 0)
        qbFallback = qbFallback.ilike('name', `%${query.search.trim()}%`);

      if (query.sort === 'price_asc')
        qbFallback = qbFallback.order('price', { ascending: true }).order('id', { ascending: false });
      else if (query.sort === 'price_desc')
        qbFallback = qbFallback.order('price', { ascending: false }).order('id', { ascending: false });
      else qbFallback = qbFallback.order('created_at', { ascending: false }).order('id', { ascending: false });

      const fallback = await qbFallback.range(pageFrom, pageTo);
      if (fallback.error) {
        logger.error({ err: fallback.error }, 'Supabase listProductsRepo failed');
        throw new AppError(STATUS_CODES.INTERNAL_SERVER_ERROR, MESSAGES.INTERNAL_SERVER_ERROR);
      }
      data = fallback.data as any[] | null;
      count = fallback.count as number | null;
    } else {
      logger.error({ err: primary.error }, 'Supabase listProductsRepo failed');
      throw new AppError(STATUS_CODES.INTERNAL_SERVER_ERROR, MESSAGES.INTERNAL_SERVER_ERROR);
    }

    const total = Number(count ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const items: ProductListItem[] = (data ?? []).map((r: any) => ({
      id: Number(r.id),
      name: String(r.name),
      price: Number(r.price),
      image: ((r.image ?? r.image_url) ?? null) as string | null,
      category_id: r.category_id === null || r.category_id === undefined ? null : Number(r.category_id),
      brand_id: r.brand_id === null || r.brand_id === undefined ? null : Number(r.brand_id),
      created_at: (r.created_at ?? null) as string | null,
    }));

    return {
      items,
      pagination: { page, limit, total, total_pages: totalPages },
    };
  }

  return { items: [], pagination: { page, limit, total: 0, total_pages: 1 } };
};

export type ProductDetail = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  images: string[];
  created_at: string | null;
  brand: { id: number; name: string } | null;
  category: { id: number; name: string; image: string | null } | null;
};

export const getProductDetailRepo = async (productId: number): Promise<ProductDetail | null> => {
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
            c.image AS category_image
          FROM products p
          LEFT JOIN brands b ON b.id = p.brand_id
          LEFT JOIN categories c ON c.id = p.category_id
          WHERE p.id = $1
          LIMIT 1
        `,
        [productId],
      );

      const row = result.rows[0] as any;
      if (!row) return null;

      const images = Array.isArray(row.images_json) ? row.images_json : [row.image].filter(Boolean);

      return {
        id: Number(row.id),
        name: String(row.name),
        description: (row.description ?? null) as string | null,
        price: Number(row.price),
        images: (images ?? []).filter(Boolean).map((v: any) => String(v)),
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

        return {
          id: Number(row.id),
          name: String(row.name),
          description: (row.description ?? null) as string | null,
          price: Number(row.price),
          images: (images ?? []).filter(Boolean).map((v: any) => String(v)),
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
      price: Number((product as any).price),
      images: images.map((v: any) => String(v)),
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

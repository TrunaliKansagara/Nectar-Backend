import { type Request, type Response } from 'express';

import { MESSAGES } from '../constants/messages';
import { STATUS_CODES } from '../constants/statusCodes';
import { getProductDetail, getProducts } from '../services/catalogService';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/responseHandler';
import { type ProductListQuery } from '../repositories/productRepository';

export const getProductsController = asyncHandler(async (req: Request, res: Response) => {
  const { data, pagination } = await getProducts(req.query as unknown as ProductListQuery);
  return sendSuccess(res, STATUS_CODES.OK, MESSAGES.PRODUCTS_FETCHED, data, pagination);
});

export const getProductDetailsController = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const productId = Number((req.params as any).id);
  const product = await getProductDetail(productId, userId);
  return sendSuccess(res, STATUS_CODES.OK, MESSAGES.PRODUCT_FETCHED, product);
});

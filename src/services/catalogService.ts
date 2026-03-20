import { MESSAGES } from '../constants/messages';
import { STATUS_CODES } from '../constants/statusCodes';
import { getProductDetailRepo, listProductsRepo, type ProductListQuery } from '../repositories/productRepository';
import { AppError } from '../utils/appError';

export const getProducts = async (query: ProductListQuery) => {
  return listProductsRepo(query);
};

export const getProductDetail = async (productId: number) => {
  const product = await getProductDetailRepo(productId);
  if (!product) throw new AppError(STATUS_CODES.NOT_FOUND, MESSAGES.PRODUCT_NOT_FOUND);
  return product;
};


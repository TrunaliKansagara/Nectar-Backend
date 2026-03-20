import { MESSAGES } from '../constants/messages';
import { STATUS_CODES } from '../constants/statusCodes';
import { getProductDetailRepo } from '../repositories/productRepository';
import { AppError } from '../utils/appError';

export const getProductDetailsById = async (productId: number) => {
  const product = await getProductDetailRepo(productId);
  if (!product) throw new AppError(STATUS_CODES.NOT_FOUND, MESSAGES.PRODUCT_NOT_FOUND);
  return product;
};

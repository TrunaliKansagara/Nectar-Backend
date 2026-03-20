import { type Request, type Response } from 'express';

import { MESSAGES } from '../constants/messages';
import { STATUS_CODES } from '../constants/statusCodes';
import { getBrands } from '../services/brandService';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/responseHandler';

export const getBrandsController = asyncHandler(async (_req: Request, res: Response) => {
  const brands = await getBrands();
  return sendSuccess(res, STATUS_CODES.OK, MESSAGES.BRANDS_FETCHED, brands);
});


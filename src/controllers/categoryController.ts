import { type Request, type Response } from 'express';

import { MESSAGES } from '../constants/messages';
import { STATUS_CODES } from '../constants/statusCodes';
import { getCategories } from '../services/categoryService';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/responseHandler';

export const getCategoriesController = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await getCategories();
  return sendSuccess(res, STATUS_CODES.OK, MESSAGES.CATEGORIES_FETCHED, categories);
});


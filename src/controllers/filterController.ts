import { type Request, type Response } from 'express';

import { MESSAGES } from '../constants/messages';
import { STATUS_CODES } from '../constants/statusCodes';
import { getFiltersData } from '../services/filterService';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/responseHandler';

export const getFiltersController = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getFiltersData();
  return sendSuccess(res, STATUS_CODES.OK, MESSAGES.FILTERS_FETCHED, data);
});


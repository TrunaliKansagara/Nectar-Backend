import { type Request, type Response } from 'express';

import { MESSAGES } from '../constants/messages';
import { STATUS_CODES } from '../constants/statusCodes';
import { getHomeData } from '../services/homeService';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/responseHandler';

export const getHomeScreenDataController = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getHomeData();
  return sendSuccess(res, STATUS_CODES.OK, MESSAGES.HOME_DATA_FETCHED, data);
});

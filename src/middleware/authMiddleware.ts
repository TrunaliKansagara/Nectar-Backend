import { type NextFunction, type Request, type Response } from 'express';

import { MESSAGES } from '../constants/messages';
import { STATUS_CODES } from '../constants/statusCodes';
import { sendError } from '../utils/responseHandler';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const header = req.header('authorization');
  if (!header) return sendError(res, STATUS_CODES.UNAUTHORIZED, MESSAGES.UNAUTHORIZED);
  return next();
};


import { type NextFunction, type Request, type Response } from 'express';

import { MESSAGES } from '../constants/messages';
import { STATUS_CODES } from '../constants/statusCodes';
import { AppError } from '../utils/appError';

export const productIdParamValidator = (req: Request, _res: Response, next: NextFunction) => {
  const id = Number(req.params.id);
  if (!id || isNaN(id)) throw new AppError(STATUS_CODES.BAD_REQUEST, MESSAGES.INVALID_ID);
  return next();
};

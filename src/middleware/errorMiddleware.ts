import { type NextFunction, type Request, type Response } from 'express';

import { MESSAGES } from '../constants/messages';
import { STATUS_CODES } from '../constants/statusCodes';
import { logger } from '../utils/logger';
import { sendError } from '../utils/responseHandler';

type ErrorWithStatus = Error & { statusCode?: number };

export const errorMiddleware = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const error = err as ErrorWithStatus;

  const statusCode = error.statusCode ?? STATUS_CODES.INTERNAL_SERVER_ERROR;
  const message = error.message || MESSAGES.INTERNAL_SERVER_ERROR;

  logger.error({ err: error, statusCode }, 'Unhandled error');
  return sendError(res, statusCode, message);
};


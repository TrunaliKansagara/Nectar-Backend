import { type NextFunction, type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';

import { env } from '../config/env';
import { MESSAGES } from '../constants/messages';
import { STATUS_CODES } from '../constants/statusCodes';
import { AppError } from '../utils/appError';
import { type AuthTokenPayload } from '../utils/jwt';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const header = req.header('authorization');
  if (!header) return next(new AppError(STATUS_CODES.UNAUTHORIZED, MESSAGES.UNAUTHORIZED));

  const token = header.startsWith('Bearer ') ? header.substring(7) : header;

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;
    (req as any).user = decoded;
    return next();
  } catch (err) {
    return next(new AppError(STATUS_CODES.UNAUTHORIZED, MESSAGES.UNAUTHORIZED));
  }
};

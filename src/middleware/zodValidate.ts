import { type NextFunction, type Request, type Response } from 'express';
import { type ZodTypeAny, ZodError } from 'zod';

import { MESSAGES } from '../constants/messages';
import { STATUS_CODES } from '../constants/statusCodes';
import { AppError } from '../utils/appError';

type Schemas = {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
};

export const zodValidate = (schemas: Schemas) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) (req as any).body = schemas.body.parse(req.body);
      if (schemas.query) (req as any).query = schemas.query.parse(req.query);
      if (schemas.params) (req as any).params = schemas.params.parse(req.params);
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        throw new AppError(STATUS_CODES.BAD_REQUEST, MESSAGES.INVALID_REQUEST, {
          issues: err.issues,
        });
      }
      throw err;
    }
  };
};

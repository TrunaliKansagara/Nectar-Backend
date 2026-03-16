import { type NextFunction, type Request, type Response } from 'express';

export type ValidationSchema = unknown;

export const validationMiddleware = (_schema: ValidationSchema) => {
  return (_req: Request, _res: Response, next: NextFunction) => next();
};


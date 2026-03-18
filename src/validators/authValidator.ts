import { type NextFunction, type Request, type Response } from 'express';

import { MESSAGES } from '../constants/messages';
import { STATUS_CODES } from '../constants/statusCodes';
import { sendError } from '../utils/responseHandler';

export type LoginRequestBody = {
  email: string;
  password: string;
};

export type SignupRequestBody = {
  username: string;
  email: string;
  password: string;
};

const isE164 = (value: string) => /^\+[1-9]\d{1,14}$/.test(value);
const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const loginValidator = (
  req: Request<unknown, unknown, Partial<LoginRequestBody>>,
  res: Response,
  next: NextFunction,
) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email) return sendError(res, STATUS_CODES.BAD_REQUEST, MESSAGES.EMAIL_REQUIRED);
  if (!isEmail(email)) return sendError(res, STATUS_CODES.BAD_REQUEST, MESSAGES.EMAIL_INVALID);
  if (!password) return sendError(res, STATUS_CODES.BAD_REQUEST, MESSAGES.PASSWORD_REQUIRED);

  return next();
};

export const signupValidator = (
  req: Request<unknown, unknown, Partial<SignupRequestBody>>,
  res: Response,
  next: NextFunction,
) => {
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;

  if (!username) return sendError(res, STATUS_CODES.BAD_REQUEST, MESSAGES.USERNAME_REQUIRED);
  if (!email) return sendError(res, STATUS_CODES.BAD_REQUEST, MESSAGES.EMAIL_REQUIRED);
  if (!isEmail(email)) return sendError(res, STATUS_CODES.BAD_REQUEST, MESSAGES.EMAIL_INVALID);
  if (!password) return sendError(res, STATUS_CODES.BAD_REQUEST, MESSAGES.PASSWORD_REQUIRED);
  if (password.length < 6) return sendError(res, STATUS_CODES.BAD_REQUEST, MESSAGES.PASSWORD_TOO_SHORT);

  return next();
};

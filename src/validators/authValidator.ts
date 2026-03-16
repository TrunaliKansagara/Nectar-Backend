import { type NextFunction, type Request, type Response } from 'express';

import { MESSAGES } from '../constants/messages';
import { STATUS_CODES } from '../constants/statusCodes';
import { sendError } from '../utils/responseHandler';

export type LoginRequestBody = {
  mobile_number: string;
  password: string;
};

const isE164 = (value: string) => /^\+[1-9]\d{1,14}$/.test(value);

export const loginValidator = (
  req: Request<unknown, unknown, Partial<LoginRequestBody>>,
  res: Response,
  next: NextFunction,
) => {
  const mobileNumber = req.body.mobile_number;
  const password = req.body.password;

  if (!mobileNumber) return sendError(res, STATUS_CODES.BAD_REQUEST, MESSAGES.MOBILE_NUMBER_REQUIRED);
  if (!isE164(mobileNumber))
    return sendError(res, STATUS_CODES.BAD_REQUEST, MESSAGES.MOBILE_NUMBER_INVALID);
  if (!password) return sendError(res, STATUS_CODES.BAD_REQUEST, MESSAGES.PASSWORD_REQUIRED);

  return next();
};


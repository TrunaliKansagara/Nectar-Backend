import { type NextFunction, type Request, type Response } from 'express';

import { MESSAGES } from '../constants/messages';
import { STATUS_CODES } from '../constants/statusCodes';
import { login } from '../services/authService';
import { sendSuccess } from '../utils/responseHandler';
import { type LoginRequestBody } from '../validators/authValidator';

export const loginController = async (
  req: Request<unknown, unknown, LoginRequestBody>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await login(req.body);
    return sendSuccess(res, STATUS_CODES.OK, MESSAGES.LOGIN_SUCCESS, result);
  } catch (err) {
    return next(err);
  }
};


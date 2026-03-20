import { type NextFunction, type Request, type Response } from 'express';

import { MESSAGES } from '../constants/messages';
import { STATUS_CODES } from '../constants/statusCodes';
import { AppError } from '../utils/appError';

export type LoginRequestBody = {
  email: string;
  password: string;
};

export type SignupRequestBody = {
  username: string;
  email: string;
  password: string;
};

export type SendOtpRequestBody = {
  mobile_number: string;
};

export type VerifyOtpRequestBody = {
  mobile_number: string;
  otp: string;
};

const isE164 = (value: string) => /^\+[1-9]\d{1,14}$/.test(value);
const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const loginValidator = (
  req: Request<unknown, unknown, Partial<LoginRequestBody>>,
  _res: Response,
  next: NextFunction,
) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email) throw new AppError(STATUS_CODES.BAD_REQUEST, MESSAGES.EMAIL_REQUIRED);
  if (!isEmail(email)) throw new AppError(STATUS_CODES.BAD_REQUEST, MESSAGES.EMAIL_INVALID);
  if (!password) throw new AppError(STATUS_CODES.BAD_REQUEST, MESSAGES.PASSWORD_REQUIRED);

  return next();
};

export const signupValidator = (
  req: Request<unknown, unknown, Partial<SignupRequestBody>>,
  _res: Response,
  next: NextFunction,
) => {
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;

  if (!username) throw new AppError(STATUS_CODES.BAD_REQUEST, MESSAGES.USERNAME_REQUIRED);
  if (!email) throw new AppError(STATUS_CODES.BAD_REQUEST, MESSAGES.EMAIL_REQUIRED);
  if (!isEmail(email)) throw new AppError(STATUS_CODES.BAD_REQUEST, MESSAGES.EMAIL_INVALID);
  if (!password) throw new AppError(STATUS_CODES.BAD_REQUEST, MESSAGES.PASSWORD_REQUIRED);
  if (password.length < 6)
    throw new AppError(STATUS_CODES.BAD_REQUEST, MESSAGES.PASSWORD_TOO_SHORT);

  return next();
};

export const sendOtpValidator = (
  req: Request<unknown, unknown, Partial<SendOtpRequestBody>>,
  _res: Response,
  next: NextFunction,
) => {
  const mobileNumber = req.body.mobile_number;

  if (!mobileNumber) throw new AppError(STATUS_CODES.BAD_REQUEST, MESSAGES.MOBILE_NUMBER_REQUIRED);
  if (!isE164(mobileNumber))
    throw new AppError(STATUS_CODES.BAD_REQUEST, MESSAGES.MOBILE_NUMBER_INVALID);

  return next();
};

export const verifyOtpValidator = (
  req: Request<unknown, unknown, Partial<VerifyOtpRequestBody>>,
  _res: Response,
  next: NextFunction,
) => {
  const mobileNumber = req.body.mobile_number;
  const otp = req.body.otp;

  if (!mobileNumber) throw new AppError(STATUS_CODES.BAD_REQUEST, MESSAGES.MOBILE_NUMBER_REQUIRED);
  if (!isE164(mobileNumber))
    throw new AppError(STATUS_CODES.BAD_REQUEST, MESSAGES.MOBILE_NUMBER_INVALID);
  if (!otp) throw new AppError(STATUS_CODES.BAD_REQUEST, MESSAGES.OTP_REQUIRED);

  return next();
};

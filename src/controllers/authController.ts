import { type Request, type Response } from 'express';

import { MESSAGES } from '../constants/messages';
import { STATUS_CODES } from '../constants/statusCodes';
import { login, signup, sendOtp, verifyOtp } from '../services/authService';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/responseHandler';
import {
  type LoginRequestBody,
  type SignupRequestBody,
  type SendOtpRequestBody,
  type VerifyOtpRequestBody,
} from '../validators/authValidator';

export const loginController = asyncHandler(
  async (req: Request<unknown, unknown, LoginRequestBody>, res: Response) => {
    const result = await login(req.body);
    return sendSuccess(res, STATUS_CODES.OK, MESSAGES.LOGIN_SUCCESS, result);
  },
);

export const signupController = asyncHandler(
  async (req: Request<unknown, unknown, SignupRequestBody>, res: Response) => {
    const result = await signup(req.body);
    return sendSuccess(res, STATUS_CODES.OK, MESSAGES.SIGNUP_SUCCESS, result);
  },
);

export const sendOtpController = asyncHandler(
  async (req: Request<unknown, unknown, SendOtpRequestBody>, res: Response) => {
    await sendOtp(req.body.mobile_number);
    return sendSuccess(res, STATUS_CODES.OK, MESSAGES.OTP_SENT);
  },
);

export const verifyOtpController = asyncHandler(
  async (req: Request<unknown, unknown, VerifyOtpRequestBody>, res: Response) => {
    const result = await verifyOtp(req.body.mobile_number, req.body.otp);
    const message = result.user_exists ? MESSAGES.OTP_VERIFIED : MESSAGES.USER_NOT_REGISTERED;
    return sendSuccess(res, STATUS_CODES.OK, message, result);
  },
);

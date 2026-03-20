import { Router } from 'express';

import {
    loginController,
    signupController,
    sendOtpController,
    verifyOtpController,
} from '../controllers/authController';
import {
    loginValidator,
    signupValidator,
    sendOtpValidator,
    verifyOtpValidator,
} from '../validators/authValidator';

export const authRoutes = Router();

authRoutes.post('/login', loginValidator, loginController);
authRoutes.post('/signup', signupValidator, signupController);
authRoutes.post('/send-otp', sendOtpValidator, sendOtpController);
authRoutes.post('/verify-otp', verifyOtpValidator, verifyOtpController);

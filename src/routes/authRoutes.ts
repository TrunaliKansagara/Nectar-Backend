import { Router } from 'express';

import { loginController, signupController } from '../controllers/authController';
import { loginValidator, signupValidator } from '../validators/authValidator';

export const authRoutes = Router();

authRoutes.post('/login', loginValidator, loginController);
authRoutes.post('/signup', signupValidator, signupController);

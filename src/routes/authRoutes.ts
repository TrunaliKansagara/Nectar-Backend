import { Router } from 'express';

import { loginController } from '../controllers/authController';
import { loginValidator } from '../validators/authValidator';

export const authRoutes = Router();

authRoutes.post('/login', loginValidator, loginController);


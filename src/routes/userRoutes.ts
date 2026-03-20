import { Router } from 'express';

import { saveLocationController } from '../controllers/locationController';
import { authMiddleware } from '../middleware/authMiddleware';
import { saveLocationValidator } from '../validators/locationValidator';

export const userRoutes = Router();

userRoutes.post('/location', authMiddleware, saveLocationValidator, saveLocationController);

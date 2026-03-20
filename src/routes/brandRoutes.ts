import { Router } from 'express';

import { getBrandsController } from '../controllers/brandController';
import { authMiddleware } from '../middleware/authMiddleware';

export const brandRoutes = Router();

brandRoutes.get('/', authMiddleware, getBrandsController);


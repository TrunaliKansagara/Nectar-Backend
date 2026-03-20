import { Router } from 'express';

import { getCategoriesController } from '../controllers/categoryController';
import { authMiddleware } from '../middleware/authMiddleware';

export const categoryRoutes = Router();

categoryRoutes.get('/', authMiddleware, getCategoriesController);


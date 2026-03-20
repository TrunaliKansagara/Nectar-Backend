import { Router } from 'express';

import { getFiltersController } from '../controllers/filterController';
import { authMiddleware } from '../middleware/authMiddleware';

export const filterRoutes = Router();

filterRoutes.get('/', authMiddleware, getFiltersController);


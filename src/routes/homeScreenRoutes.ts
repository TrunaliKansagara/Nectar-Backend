import { Router } from 'express';

import { getHomeScreenDataController } from '../controllers/homeScreenController';
import { authMiddleware } from '../middleware/authMiddleware';

export const homeScreenRoutes = Router();

homeScreenRoutes.get('/', authMiddleware, getHomeScreenDataController);

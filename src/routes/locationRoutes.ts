import { Router } from 'express';

import { getZonesController, getAreasController } from '../controllers/locationController';
import { getAreasValidator } from '../validators/locationValidator';

export const locationRoutes = Router();

locationRoutes.get('/zones', getZonesController);
locationRoutes.get('/areas', getAreasValidator, getAreasController);

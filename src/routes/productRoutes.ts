import { Router } from 'express';

import { getProductDetailsController, getProductsController } from '../controllers/productController';
import { authMiddleware } from '../middleware/authMiddleware';
import { zodValidate } from '../middleware/zodValidate';
import { listProductsQuerySchema, productIdParamsSchema } from '../validators/catalogValidator';

export const productRoutes = Router();

productRoutes.get('/', authMiddleware, zodValidate({ query: listProductsQuerySchema }), getProductsController);
productRoutes.get(
  '/:id',
  authMiddleware,
  zodValidate({ params: productIdParamsSchema }),
  getProductDetailsController,
);

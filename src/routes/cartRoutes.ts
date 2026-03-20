import { Router } from 'express';

import {
  addToCartController,
  deleteCartItemController,
  getCartController,
  updateCartController,
} from '../controllers/cartController';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  addToCartValidator,
  idParamValidator,
  updateCartValidator,
} from '../validators/cartValidator';

export const cartRoutes = Router();

cartRoutes.post('/', authMiddleware, addToCartValidator, addToCartController);
cartRoutes.get('/', authMiddleware, getCartController);
cartRoutes.put('/:id', authMiddleware, idParamValidator, updateCartValidator, updateCartController);
cartRoutes.delete('/:id', authMiddleware, idParamValidator, deleteCartItemController);

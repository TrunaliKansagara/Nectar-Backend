import { Router } from 'express';

import { placeOrderController, orderSummaryController } from '../controllers/orderController';
import { authMiddleware } from '../middleware/authMiddleware';
import { zodValidate } from '../middleware/zodValidate';
import { placeOrderSchema, orderSummarySchema } from '../validators/orderValidator';

export const orderRoutes = Router();

orderRoutes.post(
    '/',
    authMiddleware,
    zodValidate({ body: placeOrderSchema }),
    placeOrderController,
);

orderRoutes.post(
    '/summary',
    authMiddleware,
    zodValidate({ body: orderSummarySchema }),
    orderSummaryController,
);

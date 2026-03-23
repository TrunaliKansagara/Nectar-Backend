import { Router } from 'express';

import {
    addFavoriteController,
    getFavoritesController,
    removeFavoriteController,
} from '../controllers/favoriteController';
import { authMiddleware } from '../middleware/authMiddleware';
import { zodValidate } from '../middleware/zodValidate';
import {
    addFavoriteSchema,
    listFavoritesSchema,
    removeFavoriteSchema,
} from '../validators/favoriteValidator';

export const favoriteRoutes = Router();

favoriteRoutes.get(
    '/',
    authMiddleware,
    zodValidate({ query: listFavoritesSchema }),
    getFavoritesController,
);

favoriteRoutes.post(
    '/',
    authMiddleware,
    zodValidate({ body: addFavoriteSchema }),
    addFavoriteController,
);

favoriteRoutes.delete(
    '/:product_id',
    authMiddleware,
    zodValidate({ params: removeFavoriteSchema }),
    removeFavoriteController,
);

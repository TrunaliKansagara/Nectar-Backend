import { type Request, type Response } from 'express';

import { MESSAGES } from '../constants/messages';
import { STATUS_CODES } from '../constants/statusCodes';
import { addFavorite, listFavorites, removeFavorite } from '../services/favoriteService';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/responseHandler';

export const addFavoriteController = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const productId = Number(req.body.product_id);

    await addFavorite({ userId, productId });

    return sendSuccess(res, STATUS_CODES.CREATED, MESSAGES.FAVORITE_ADDED);
});

export const removeFavoriteController = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const productId = Number(req.params.product_id);

    await removeFavorite(userId, productId);

    return sendSuccess(res, STATUS_CODES.OK, MESSAGES.FAVORITE_REMOVED);
});

export const getFavoritesController = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    const { data, pagination } = await listFavorites({ userId, page, limit });

    return sendSuccess(res, STATUS_CODES.OK, MESSAGES.FAVORITES_FETCHED, data, pagination);
});

import {
    addFavoriteRepo,
    checkProductExistsRepo,
    getFavoritesRepo,
    removeFavoriteRepo,
} from '../repositories/favoriteRepository';
import { MESSAGES } from '../constants/messages';
import { STATUS_CODES } from '../constants/statusCodes';
import { AppError } from '../utils/appError';

export type AddFavoriteInput = {
    userId: number;
    productId: number;
};

export type ListFavoritesInput = {
    userId: number;
    page: number;
    limit: number;
};

export const addFavorite = async (input: AddFavoriteInput) => {
    const exists = await checkProductExistsRepo(input.productId);
    if (!exists) {
        throw new AppError(STATUS_CODES.BAD_REQUEST, MESSAGES.PRODUCT_NOT_FOUND);
    }

    return await addFavoriteRepo(input.userId, input.productId);
};

export const removeFavorite = async (userId: number, productId: number) => {
    return await removeFavoriteRepo(userId, productId);
};

export const listFavorites = async (input: ListFavoritesInput) => {
    const { data, total } = await getFavoritesRepo(input.userId, input.page, input.limit);

    return {
        data,
        pagination: {
            page: input.page,
            limit: input.limit,
            total,
        },
    };
};

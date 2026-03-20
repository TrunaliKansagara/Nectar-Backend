import { type NextFunction, type Request, type Response } from 'express';

import { MESSAGES } from '../constants/messages';
import { STATUS_CODES } from '../constants/statusCodes';
import { AppError } from '../utils/appError';

export type AddToCartRequestBody = {
    product_id: number;
    quantity: number;
};

export type UpdateCartRequestBody = {
    quantity: number;
};

export const addToCartValidator = (
    req: Request<unknown, unknown, Partial<AddToCartRequestBody>>,
    _res: Response,
    next: NextFunction,
) => {
    const { product_id, quantity } = req.body;

    if (!product_id) throw new AppError(STATUS_CODES.BAD_REQUEST, MESSAGES.PRODUCT_ID_REQUIRED);
    if (quantity === undefined || quantity === null) throw new AppError(STATUS_CODES.BAD_REQUEST, MESSAGES.QUANTITY_REQUIRED);
    if (quantity <= 0) throw new AppError(STATUS_CODES.BAD_REQUEST, MESSAGES.INVALID_QUANTITY);

    return next();
};

export const updateCartValidator = (
    req: Request<unknown, unknown, Partial<UpdateCartRequestBody>>,
    _res: Response,
    next: NextFunction,
) => {
    const { quantity } = req.body;

    if (quantity === undefined || quantity === null) throw new AppError(STATUS_CODES.BAD_REQUEST, MESSAGES.QUANTITY_REQUIRED);
    if (quantity <= 0) throw new AppError(STATUS_CODES.BAD_REQUEST, MESSAGES.INVALID_QUANTITY);

    return next();
};

export const idParamValidator = (req: Request, _res: Response, next: NextFunction) => {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) throw new AppError(STATUS_CODES.BAD_REQUEST, MESSAGES.INVALID_ID);
    return next();
};

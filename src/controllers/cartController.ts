import { type Request, type Response } from 'express';

import { MESSAGES } from '../constants/messages';
import { STATUS_CODES } from '../constants/statusCodes';
import {
  addToCart,
  deleteCartItem,
  getCartItems,
  updateCartItemQuantity,
} from '../services/cartService';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/responseHandler';
import { type AddToCartRequestBody, type UpdateCartRequestBody } from '../validators/cartValidator';

type AuthenticatedRequest = Request & { user: { userId: number } };

const getUserId = (req: Request) => {
  return (req as unknown as AuthenticatedRequest).user.userId;
};

export const addToCartController = asyncHandler(
  async (req: Request<Record<string, never>, unknown, AddToCartRequestBody>, res: Response) => {
    const userId = getUserId(req);
    const { product_id, quantity } = req.body;
    const item = await addToCart(userId, product_id, quantity);
    return sendSuccess(res, STATUS_CODES.OK, MESSAGES.CART_ITEM_ADDED, item);
  },
);

export const getCartController = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const items = await getCartItems(userId);
  return sendSuccess(res, STATUS_CODES.OK, MESSAGES.CART_FETCHED, items);
});

export const updateCartController = asyncHandler(
  async (req: Request<{ id: string }, unknown, UpdateCartRequestBody>, res: Response) => {
    const userId = getUserId(req);
    const cartItemId = Number(req.params.id);
    const item = await updateCartItemQuantity(userId, cartItemId, req.body.quantity);
    return sendSuccess(res, STATUS_CODES.OK, MESSAGES.CART_UPDATED, item);
  },
);

export const deleteCartItemController = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const cartItemId = Number(req.params.id);
  await deleteCartItem(userId, cartItemId);
  return sendSuccess(res, STATUS_CODES.OK, MESSAGES.CART_ITEM_REMOVED);
});

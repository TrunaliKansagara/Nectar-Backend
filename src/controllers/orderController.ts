import { type Request, type Response } from 'express';

import { MESSAGES } from '../constants/messages';
import { STATUS_CODES } from '../constants/statusCodes';
import { placeOrder, getOrderSummary } from '../services/orderService';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/responseHandler';

export const placeOrderController = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const input = { ...req.body, userId };

    const data = await placeOrder(input);

    return sendSuccess(res, STATUS_CODES.CREATED, MESSAGES.ORDER_PLACED, data);
});

export const orderSummaryController = asyncHandler(async (req: Request, res: Response) => {
    const data = await getOrderSummary(req.body);

    return sendSuccess(res, STATUS_CODES.OK, MESSAGES.ORDER_SUMMARY_FETCHED, data);
});

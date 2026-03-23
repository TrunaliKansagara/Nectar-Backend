import { createOrderRepo, fetchProductPricesByItemIds } from '../repositories/orderRepository';
import { MESSAGES } from '../constants/messages';
import { STATUS_CODES } from '../constants/statusCodes';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export type PlaceOrderInput = {
    userId: number;
    delivery_method: string;
    payment_method: string;
    address_id: number;
    promo_code?: string | null;
    items: Array<{ product_id: number; quantity: number }>;
};

const DELIVERY_CHARGE = 5.0; // Standard $5 delivery charge

const calculateOrderSummary = async (items: { product_id: number; quantity: number }[], promoCode?: string | null) => {
    const productIds = items.map(it => it.product_id);
    const products = await fetchProductPricesByItemIds(productIds);

    if (products.length !== productIds.length) {
        throw new AppError(STATUS_CODES.BAD_REQUEST, MESSAGES.PRODUCT_NOT_FOUND);
    }

    let subtotal = 0;
    const orderItems = items.map(it => {
        const product = products.find(p => p.id === it.product_id);
        const price = Number(product.price);
        subtotal += price * it.quantity;
        return { productId: it.product_id, quantity: it.quantity, price };
    });

    let discount = 0;
    if (promoCode) {
        if (promoCode.toUpperCase() === 'SAVE10') {
            discount = subtotal * 0.10; // 10% Discount
        } else {
            throw new AppError(STATUS_CODES.BAD_REQUEST, MESSAGES.INVALID_PROMO);
        }
    }

    const deliveryCharge = subtotal > 50 ? 0 : DELIVERY_CHARGE;
    const totalAmount = subtotal - discount + deliveryCharge;

    return { orderItems, subtotal, discount, deliveryCharge, totalAmount: Number(totalAmount.toFixed(2)) };
};

export const placeOrder = async (input: PlaceOrderInput) => {
    const summary = await calculateOrderSummary(input.items, input.promo_code);

    const orderData = {
        userId: input.userId,
        totalAmount: summary.totalAmount,
        deliveryMethod: input.delivery_method,
        paymentMethod: input.payment_method,
        addressId: input.address_id,
        promoCode: input.promo_code,
        items: summary.orderItems,
    };

    logger.info({ userId: input.userId, total: summary.totalAmount }, 'Placing order');
    return createOrderRepo(orderData);
};

export const getOrderSummary = async (input: { items: { product_id: number; quantity: number }[], promo_code?: string | null }) => {
    const summary = await calculateOrderSummary(input.items, input.promo_code);
    return {
        subtotal: summary.subtotal,
        discount: summary.discount,
        delivery_charge: summary.deliveryCharge,
        total_amount: summary.totalAmount,
    };
};

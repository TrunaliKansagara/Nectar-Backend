import { type NextFunction, type Request, type Response } from 'express';

import { MESSAGES } from '../constants/messages';
import { STATUS_CODES } from '../constants/statusCodes';
import { AppError } from '../utils/appError';

export type SaveLocationRequestBody = {
    zone_id: number;
    area_id: number;
};

export const saveLocationValidator = (
    req: Request<unknown, unknown, Partial<SaveLocationRequestBody>>,
    _res: Response,
    next: NextFunction,
) => {
    const { zone_id, area_id } = req.body;

    if (!zone_id) throw new AppError(STATUS_CODES.BAD_REQUEST, MESSAGES.ZONE_REQUIRED);
    if (!area_id) throw new AppError(STATUS_CODES.BAD_REQUEST, MESSAGES.AREA_REQUIRED);

    return next();
};

export const getAreasValidator = (req: Request, _res: Response, next: NextFunction) => {
    const zone_id = req.query.zone_id;
    if (!zone_id) throw new AppError(STATUS_CODES.BAD_REQUEST, MESSAGES.ZONE_REQUIRED);
    return next();
};

import { type Request, type Response } from 'express';

import { MESSAGES } from '../constants/messages';
import { STATUS_CODES } from '../constants/statusCodes';
import { getZones, getAreasByZone, saveUserLocation } from '../services/locationService';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/responseHandler';
import { type SaveLocationRequestBody } from '../validators/locationValidator';

export const getZonesController = asyncHandler(async (_req: Request, res: Response) => {
    const zones = await getZones();
    return sendSuccess(res, STATUS_CODES.OK, MESSAGES.SUCCESS, zones);
});

export const getAreasController = asyncHandler(async (req: Request, res: Response) => {
    const zoneId = Number(req.query.zone_id);
    const areas = await getAreasByZone(zoneId);
    return sendSuccess(res, STATUS_CODES.OK, MESSAGES.SUCCESS, areas);
});

export const saveLocationController = asyncHandler(
    async (req: Request<unknown, unknown, SaveLocationRequestBody>, res: Response) => {
        const userId = (req as any).user.userId;
        const { zone_id, area_id } = req.body;
        await saveUserLocation(userId, zone_id, area_id);
        return sendSuccess(res, STATUS_CODES.OK, MESSAGES.LOCATION_SAVED);
    },
);

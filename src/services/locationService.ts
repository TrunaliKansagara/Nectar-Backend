import { pool } from '../config/database';
import { supabase } from '../config/supabaseClient';
import { MESSAGES } from '../constants/messages';
import { STATUS_CODES } from '../constants/statusCodes';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export const getZones = async () => {
    if (pool) {
        try {
            const result = await pool.query('SELECT id, name FROM zones ORDER BY name ASC');
            return result.rows;
        } catch (err) {
            logger.error({ err }, 'PostgreSQL getZones failed, falling back to Supabase');
        }
    }

    if (supabase) {
        const { data, error } = await supabase.from('zones').select('id, name').order('name');
        if (error) {
            logger.error({ err: error }, 'Supabase getZones failed');
            throw new AppError(STATUS_CODES.INTERNAL_SERVER_ERROR, MESSAGES.INTERNAL_SERVER_ERROR);
        }
        return data;
    }
    return [];
};

export const getAreasByZone = async (zoneId: number) => {
    if (pool) {
        try {
            const result = await pool.query(
                'SELECT id, name FROM areas WHERE zone_id = $1 ORDER BY name ASC',
                [zoneId],
            );
            return result.rows;
        } catch (err) {
            logger.error({ err }, 'PostgreSQL getAreasByZone failed, falling back to Supabase');
        }
    }

    if (supabase) {
        const { data, error } = await supabase
            .from('areas')
            .select('id, name')
            .eq('zone_id', zoneId)
            .order('name');
        if (error) {
            logger.error({ err: error }, 'Supabase getAreasByZone failed');
            throw new AppError(STATUS_CODES.INTERNAL_SERVER_ERROR, MESSAGES.INTERNAL_SERVER_ERROR);
        }
        return data;
    }
    return [];
};

export const saveUserLocation = async (userId: number, zoneId: number, areaId: number) => {
    let updated = false;

    if (pool) {
        try {
            await pool.query('UPDATE users SET zone_id = $1, area_id = $2 WHERE id = $3', [
                zoneId,
                areaId,
                userId,
            ]);
            updated = true;
        } catch (err) {
            logger.error({ err }, 'PostgreSQL saveUserLocation failed, falling back to Supabase');
        }
    }

    if (!updated && supabase) {
        const { error } = await supabase
            .from('users')
            .update({ zone_id: zoneId, area_id: areaId })
            .eq('id', userId);

        if (error) {
            logger.error({ err: error }, 'Supabase saveUserLocation failed');
            throw new AppError(STATUS_CODES.INTERNAL_SERVER_ERROR, MESSAGES.INTERNAL_SERVER_ERROR);
        }
    }
    logger.info({ userId, zoneId, areaId }, 'User location updated');
};

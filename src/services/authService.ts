import bcrypt from 'bcrypt';

import { pool } from '../config/database';
import { supabase } from '../config/supabaseClient';
import { MESSAGES } from '../constants/messages';
import { STATUS_CODES } from '../constants/statusCodes';
import { AppError } from '../utils/appError';
import { generateToken } from '../utils/jwt';
import { logger } from '../utils/logger';

export type LoginInput = {
  mobile_number: string;
  password: string;
};

type UserRow = {
  id: number;
  username: string;
  email: string | null;
  password: string;
  mobile_number: string;
};

const findUserByMobileNumber = async (mobileNumber: string): Promise<UserRow | null> => {
  if (pool) {
    const result = await pool.query<UserRow>(
      `SELECT id, username, email, password, mobile_number
       FROM users
       WHERE mobile_number = $1
       LIMIT 1`,
      [mobileNumber],
    );
    return result.rows[0] ?? null;
  }

  if (supabase) {
    const { data, error } = await supabase
      .from('users')
      .select('id,username,email,password,mobile_number')
      .eq('mobile_number', mobileNumber)
      .maybeSingle<UserRow>();

    if (error) {
      logger.error({ err: error }, 'Supabase users lookup failed');
      throw new AppError(STATUS_CODES.INTERNAL_SERVER_ERROR, MESSAGES.INTERNAL_SERVER_ERROR);
    }

    return data ?? null;
  }

  throw new AppError(STATUS_CODES.INTERNAL_SERVER_ERROR, MESSAGES.INTERNAL_SERVER_ERROR);
};

export const login = async (input: LoginInput) => {
  const user = await findUserByMobileNumber(input.mobile_number);

  if (!user) {
    throw new AppError(STATUS_CODES.UNAUTHORIZED, MESSAGES.INVALID_CREDENTIALS);
  }

  const matches = await bcrypt.compare(input.password, user.password);
  if (!matches) {
    throw new AppError(STATUS_CODES.UNAUTHORIZED, MESSAGES.INVALID_CREDENTIALS);
  }

  const token = generateToken({ userId: user.id, mobile_number: user.mobile_number });

  const safeUser = {
    id: user.id,
    username: user.username,
    mobile_number: user.mobile_number,
    email: user.email,
  };

  return { token, user: safeUser };
};


import bcrypt from 'bcrypt';

import { pool } from '../config/database';
import { supabase } from '../config/supabaseClient';
import { MESSAGES } from '../constants/messages';
import { STATUS_CODES } from '../constants/statusCodes';
import { AppError } from '../utils/appError';
import { generateToken } from '../utils/jwt';
import { logger } from '../utils/logger';

export type LoginInput = {
  email: string;
  password: string;
};

export type SignupInput = {
  username: string;
  email: string;
  password: string;
};

type UserRow = {
  id: number;
  username: string;
  email: string;
  password: string;
};

type UserPublicRow = Omit<UserRow, 'password'>;

const findUserByEmail = async (email: string): Promise<UserRow | null> => {
  if (pool) {
    try {
      logger.info({ email }, 'Attempting PostgreSQL user lookup');
      const result = await pool.query<UserRow>(
        `SELECT id, username, email, password
         FROM users
         WHERE email = $1
         LIMIT 1`,
        [email],
      );
      if (result.rows[0]) {
        logger.info('User found in PostgreSQL');
        return result.rows[0];
      }
      logger.info('User not found in PostgreSQL');
    } catch (err) {
      logger.error({ err }, 'PostgreSQL users lookup failed');
      if (!supabase) {
        throw new AppError(STATUS_CODES.INTERNAL_SERVER_ERROR, MESSAGES.INTERNAL_SERVER_ERROR);
      }
    }
  }

  if (supabase) {
    logger.info({ email }, 'Attempting Supabase client fallback lookup');
    const { data, error } = await supabase
      .from('users')
      .select('id,username,email,password')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      logger.error({ err: error }, 'Supabase users lookup failed');
      throw new AppError(STATUS_CODES.INTERNAL_SERVER_ERROR, MESSAGES.INTERNAL_SERVER_ERROR);
    }

    if (data) {
      logger.info('User found in Supabase');
    } else {
      logger.info('User not found in Supabase (possibly RLS or missing record)');
    }

    return (data as UserRow | null) ?? null;
  }

  throw new AppError(STATUS_CODES.INTERNAL_SERVER_ERROR, MESSAGES.INTERNAL_SERVER_ERROR);
};

export const login = async (input: LoginInput) => {
  const user = await findUserByEmail(input.email);

  if (!user) {
    throw new AppError(STATUS_CODES.UNAUTHORIZED, MESSAGES.INVALID_CREDENTIALS);
  }

  const matches = await bcrypt.compare(input.password, user.password);
  if (!matches) {
    throw new AppError(STATUS_CODES.UNAUTHORIZED, MESSAGES.INVALID_CREDENTIALS);
  }

  const token = generateToken({ userId: user.id, email: user.email });

  const safeUser = {
    id: user.id,
    username: user.username,
    email: user.email,
  };

  return { token, user: safeUser };
};

export const signup = async (input: SignupInput) => {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new AppError(STATUS_CODES.BAD_REQUEST, MESSAGES.USER_ALREADY_EXISTS);
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  let createdUser: UserPublicRow | null = null;

  if (pool) {
    try {
      const result = await pool.query<UserPublicRow>(
        `INSERT INTO users (username, email, password)
         VALUES ($1, $2, $3)
         RETURNING id, username, email`,
        [input.username, input.email, passwordHash],
      );
      createdUser = result.rows[0] ?? null;
    } catch (err) {
      logger.error({ err }, 'PostgreSQL user creation failed');
      if (!supabase) {
        throw new AppError(STATUS_CODES.INTERNAL_SERVER_ERROR, MESSAGES.INTERNAL_SERVER_ERROR);
      }
    }
  }

  if (!createdUser && supabase) {
    const { data, error } = await supabase
      .from('users')
      .insert({
        username: input.username,
        email: input.email,
        password: passwordHash,
      })
      .select('id,username,email')
      .single();

    if (error) {
      logger.error({ err: error }, 'Supabase user creation failed');
      throw new AppError(STATUS_CODES.INTERNAL_SERVER_ERROR, MESSAGES.INTERNAL_SERVER_ERROR);
    }

    createdUser = (data as UserPublicRow | null) ?? null;
  }

  if (!createdUser) {
    throw new AppError(STATUS_CODES.INTERNAL_SERVER_ERROR, MESSAGES.INTERNAL_SERVER_ERROR);
  }

  const token = generateToken({
    userId: createdUser.id,
    email: createdUser.email,
  });

  return { token, user: createdUser };
};

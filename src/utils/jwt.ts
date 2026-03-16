import jwt from 'jsonwebtoken';

import { env } from '../config/env';

export type AuthTokenPayload = {
  userId: number;
  mobile_number: string;
};

export const generateToken = (payload: AuthTokenPayload) => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
};


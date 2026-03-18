import jwt from 'jsonwebtoken';

import { env } from '../config/env';

export type AuthTokenPayload = {
  userId: number;
  email: string;
};

export const generateToken = (payload: AuthTokenPayload) => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
};


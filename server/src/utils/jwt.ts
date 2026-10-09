import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { JWTPayload } from '../types';

export function signToken(payload: JWTPayload): string {
  const options: SignOptions = {
    expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.jwtSecret, options);
}

export function verifyToken(token: string): JWTPayload {
  const decoded = jwt.verify(token, env.jwtSecret);
  if (typeof decoded === 'string') {
    throw new Error('Invalid token payload');
  }
  return { id: decoded.id, role: decoded.role };
}
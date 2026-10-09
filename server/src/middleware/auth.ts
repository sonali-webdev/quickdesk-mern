import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';

export function protect(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError(401, 'Not authenticated'));
  }

  try {
    req.user = verifyToken(header.split(' ')[1]);
    next();
  } catch {
    next(new AppError(401, 'Invalid or expired token'));
  }
}
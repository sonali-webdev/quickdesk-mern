import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types';
import { AppError } from '../utils/AppError';

export const authorize =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError(403, 'You do not have permission to do this'));
    }
    next();
  };
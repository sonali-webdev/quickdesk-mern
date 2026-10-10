import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegister(req: Request, _res: Response, next: NextFunction) {
  const { name, email, password } = req.body ?? {};

  if (typeof name !== 'string' || name.trim().length < 2) {
    return next(new AppError(400, 'Name must be at least 2 characters'));
  }
  if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
    return next(new AppError(400, 'A valid email is required'));
  }
  if (typeof password !== 'string' || password.length < 8) {
    return next(new AppError(400, 'Password must be at least 8 characters'));
  }
  next();
}

export function validateLogin(req: Request, _res: Response, next: NextFunction) {
  const { email, password } = req.body ?? {};

  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    return next(new AppError(400, 'Email and password are required'));
  }
  next();
}
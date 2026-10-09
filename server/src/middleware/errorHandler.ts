import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  // Mongo duplicate key (e.g. email already registered)
  if (typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000) {
    return res.status(409).json({ message: 'That value is already in use' });
  }

  // Mongoose validation errors (maxlength, required, enum...)
  if (err instanceof Error && err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }

  // Bad ObjectId in a URL like /tickets/abc
  if (err instanceof Error && err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  console.error(err); // log the real error server-side only
  res.status(500).json({ message: 'Something went wrong' });
}
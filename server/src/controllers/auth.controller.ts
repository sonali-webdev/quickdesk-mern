import { Request, Response } from 'express';
import { User } from '../models/User';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { signToken } from '../utils/jwt';
import { RegisterBody, LoginBody, AuthResponse } from '../types';

export const register = asyncHandler(
  async (req: Request<{}, {}, RegisterBody>, res: Response<AuthResponse>) => {
    const { name, email, password } = req.body;

    // role is deliberately NOT read from the body: everyone registers as a customer
    const user = await User.create({ name, email, password, role: 'customer' });

    const token = signToken({ id: user.id, role: user.role });
    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  }
);

export const login = asyncHandler(
  async (req: Request<{}, {}, LoginBody>, res: Response<AuthResponse>) => {
    const { email, password } = req.body;

    // password has select:false, so we must opt in explicitly
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    // Same message for "no such user" and "wrong password" so attackers can't enumerate emails
    if (!user || !(await user.comparePassword(password))) {
      throw new AppError(401, 'Invalid email or password');
    }

    const token = signToken({ id: user.id, role: user.role });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  }
);

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id);
  if (!user) throw new AppError(404, 'User not found');
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});


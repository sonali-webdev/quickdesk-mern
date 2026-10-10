import { api } from './client';
import type { AuthResponse, User } from '../types';

export const registerRequest = (data: { name: string; email: string; password: string }) =>
  api.post<AuthResponse>('/auth/register', data).then((r) => r.data);

export const loginRequest = (data: { email: string; password: string }) =>
  api.post<AuthResponse>('/auth/login', data).then((r) => r.data);

export const getMeRequest = () =>
  api.get<{ user: User }>('/auth/me').then((r) => r.data.user);
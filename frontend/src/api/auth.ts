import api from './client';
import type { AuthResponse, User, LoginRequest, RegisterRequest } from '../types';

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  register: (data: RegisterRequest) =>
    api.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  getProfile: () =>
    api.get<User>('/auth/me').then((r) => r.data),

  updateProfile: (data: { firstName?: string; lastName?: string; phone?: string }) =>
    api.patch<User>('/auth/me', data).then((r) => r.data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.patch('/auth/me/password', data).then((r) => r.data),
};

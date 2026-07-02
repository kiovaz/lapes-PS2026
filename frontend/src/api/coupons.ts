import api from './client';
import type { Coupon, CouponValidation } from '../types';

export const couponsApi = {
  create: (data: { code: string; type: string; value: number; minOrderValue?: number; expiresAt: string }) =>
    api.post<Coupon>('/coupons', data).then((r) => r.data),

  findAll: () =>
    api.get<Coupon[]>('/coupons').then((r) => r.data),

  findOne: (id: number) =>
    api.get<Coupon>(`/coupons/${id}`).then((r) => r.data),

  update: (id: number, data: Partial<{ code: string; type: string; value: number; minOrderValue?: number; expiresAt: string }>) =>
    api.patch<Coupon>(`/coupons/${id}`, data).then((r) => r.data),

  remove: (id: number) =>
    api.delete(`/coupons/${id}`).then((r) => r.data),

  validate: (data: { code: string; subtotal: number }) =>
    api.post<CouponValidation>('/coupons/validate', data).then((r) => r.data),
};

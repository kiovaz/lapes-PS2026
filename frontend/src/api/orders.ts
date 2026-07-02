import api from './client';
import type { Order, CheckoutResponse } from '../types';

export const ordersApi = {
  checkout: (data: { couponCode?: string; addressId?: number; idempotencyKey?: string }) =>
    api.post<CheckoutResponse>('/orders/checkout', data).then((r) => r.data),

  findAll: () =>
    api.get<Order[]>('/orders').then((r) => r.data),

  findOne: (id: number) =>
    api.get<Order>(`/orders/${id}`).then((r) => r.data),

  cancel: (id: number) =>
    api.patch<Order>(`/orders/${id}/cancel`).then((r) => r.data),

  advanceStatus: (id: number, status: string) =>
    api.patch<Order>(`/orders/${id}/status`, { status }).then((r) => r.data),

  confirmPayment: (id: number) =>
    api.patch<Order>(`/orders/${id}/confirm-payment`).then((r) => r.data),
};

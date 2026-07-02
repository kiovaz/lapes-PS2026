import api from './client';
import type { Cart } from '../types';

export const cartApi = {
  get: () =>
    api.get<Cart>('/cart').then((r) => r.data),

  addItem: (data: { productId: number; quantity: number }) =>
    api.post<Cart>('/cart/items', data).then((r) => r.data),

  updateItem: (itemId: number, data: { quantity: number }) =>
    api.patch<Cart>(`/cart/items/${itemId}`, data).then((r) => r.data),

  removeItem: (itemId: number) =>
    api.delete(`/cart/items/${itemId}`).then((r) => r.data),

  clear: () =>
    api.delete('/cart').then((r) => r.data),
};

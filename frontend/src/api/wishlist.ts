import api from './client';
import type { WishlistItem } from '../types';

export const wishlistApi = {
  findAll: () =>
    api.get<WishlistItem[]>('/wishlist').then((r) => r.data),

  add: (productId: number) =>
    api.post<WishlistItem>(`/wishlist/${productId}`).then((r) => r.data),

  remove: (productId: number) =>
    api.delete(`/wishlist/${productId}`).then((r) => r.data),

  check: (productId: number) =>
    api.get<{ isFavorited: boolean }>(`/wishlist/${productId}/check`).then((r) => r.data),
};

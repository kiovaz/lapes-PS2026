import api from './client';
import type { Product, ProductsResponse, ProductFilters } from '../types';

export const productsApi = {
  findAll: (filters?: ProductFilters) =>
    api.get<ProductsResponse>('/products', { params: filters }).then((r) => r.data),

  findOne: (id: number) =>
    api.get<Product>(`/products/${id}`).then((r) => r.data),

  getCategories: () =>
    api.get<string[]>('/products/categories').then((r) => r.data),

  create: (data: { name: string; description: string; price: number; stock: number; category: string; image?: string }) =>
    api.post<Product>('/products', data).then((r) => r.data),

  update: (id: number, data: Partial<{ name: string; description: string; price: number; stock: number; category: string; image?: string }>) =>
    api.patch<Product>(`/products/${id}`, data).then((r) => r.data),

  remove: (id: number) =>
    api.delete(`/products/${id}`).then((r) => r.data),
};

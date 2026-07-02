import api from './client';
import type { Address } from '../types';

export const addressesApi = {
  create: (data: {
    label?: string;
    street: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    isDefault?: boolean;
  }) =>
    api.post<Address>('/addresses', data).then((r) => r.data),

  findAll: () =>
    api.get<Address[]>('/addresses').then((r) => r.data),

  findOne: (id: number) =>
    api.get<Address>(`/addresses/${id}`).then((r) => r.data),

  update: (id: number, data: Partial<{
    label: string;
    street: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    isDefault: boolean;
  }>) =>
    api.patch<Address>(`/addresses/${id}`, data).then((r) => r.data),

  remove: (id: number) =>
    api.delete(`/addresses/${id}`).then((r) => r.data),

  setDefault: (id: number) =>
    api.patch<Address>(`/addresses/${id}/default`).then((r) => r.data),
};

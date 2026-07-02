// ── Enums ──────────────────────────────────────────────

export type Role = 'ADMIN' | 'CUSTOMER';
export type OrderStatus = 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type CouponType = 'PERCENT' | 'FIXED';

// ── User ───────────────────────────────────────────────

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  cpf: string;
  phone: string;
  birthDate: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

// ── Product ────────────────────────────────────────────

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number | string;
  stock: number;
  category: string;
  image: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ProductFilters {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
  sortBy?: 'price' | 'name' | 'createdAt';
  order?: 'asc' | 'desc';
}

// ── Cart ───────────────────────────────────────────────

export interface CartItem {
  id: number;
  cartId: number;
  productId: number;
  quantity: number;
  product: Product;
}

export interface Cart {
  id: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
  items: CartItem[];
}

// ── Order ──────────────────────────────────────────────

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  priceAtPurchase: number | string;
  product: Product;
}

export interface Order {
  id: number;
  userId: number;
  status: OrderStatus;
  total: number | string;
  discount: number | string;
  idempotencyKey: string | null;
  stripePaymentIntentId: string | null;
  shippingStreet: string | null;
  shippingComplement: string | null;
  shippingNeighborhood: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingZipCode: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  coupon?: Coupon | null;
  user?: User;
}

export interface CheckoutResponse {
  order: Order;
  clientSecret: string | null;
}

// ── Coupon ─────────────────────────────────────────────

export interface Coupon {
  id: number;
  code: string;
  type: CouponType;
  value: number | string;
  minOrderValue: number | string;
  expiresAt: string;
  createdAt: string;
  _count?: {
    orders: number;
    couponUsage: number;
  };
}

export interface CouponValidation {
  valid: boolean;
  coupon: Coupon;
  subtotal: number;
  discount: number;
  total: number;
}

// ── Address ────────────────────────────────────────────

export interface Address {
  id: number;
  userId: number;
  label: string;
  street: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Wishlist ───────────────────────────────────────────

export interface WishlistItem {
  id: number;
  userId: number;
  productId: number;
  createdAt: string;
  product: Product;
}

// ── Auth ───────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  cpf: string;
  phone: string;
  birthDate: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
}

// ── API Error ──────────────────────────────────────────

export interface ApiError {
  statusCode: number;
  message: string | string[];
  timestamp: string;
  path: string;
}

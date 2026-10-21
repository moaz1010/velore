import type { AdminCategory, AdminDashboardData, AdminProduct } from '@/types/admin';
import type { ProductInput } from '@/lib/schemas/product.schema';
import type { CategoryInput } from '@/lib/schemas/category.schema';
import type { SettingsInput } from '@/lib/schemas/settings.schema';

interface ApiSuccess<T> {
  ok: true;
  data: T;
}

interface ApiFailure {
  ok: false;
  error: { code: string; message: string; fields?: Record<string, string> };
}

type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

export class AdminApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields: Record<string, string>;

  constructor(message: string, status: number, code = 'request_failed', fields: Record<string, string> = {}) {
    super(message);
    this.name = 'AdminApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export async function adminFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body !== undefined) headers.set('Content-Type', 'application/json');
  const response = await fetch(path, { ...init, headers, credentials: 'same-origin', cache: 'no-store' });
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (response.status === 401 && typeof window !== 'undefined' && path !== '/api/admin/login') {
    window.location.assign('/admin/login');
  }
  if (!response.ok || !payload || !payload.ok) {
    const detail = payload && !payload.ok ? payload.error : null;
    throw new AdminApiError(
      detail?.message ?? 'The admin request could not be completed.',
      response.status,
      detail?.code,
      detail?.fields,
    );
  }
  return payload.data;
}

export interface ProductFilters {
  q: string;
  status: string;
  page: number;
  limit: number;
}

export interface AdminProductList {
  products: AdminProduct[];
  page: number;
  limit: number;
  total: number;
}

export function productListPath(filters: ProductFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.status) params.set('status', filters.status);
  params.set('page', String(filters.page));
  params.set('limit', String(filters.limit));
  return `/api/admin/products?${params.toString()}`;
}

export const adminApi = {
  dashboard: () => adminFetch<AdminDashboardData>('/api/admin/dashboard'),
  products: (filters: ProductFilters) => adminFetch<AdminProductList>(productListPath(filters)),
  product: (id: string) => adminFetch<AdminProduct>(`/api/admin/products/${encodeURIComponent(id)}`),
  categories: () => adminFetch<AdminCategory[]>('/api/admin/categories'),
  settings: () => adminFetch<SettingsInput>('/api/admin/settings'),
  createProduct: (input: ProductInput) => adminFetch<AdminProduct>('/api/admin/products', { method: 'POST', body: JSON.stringify(input) }),
  updateProduct: (id: string, input: ProductInput) => adminFetch<AdminProduct>(`/api/admin/products/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(input) }),
  updateStock: (id: string, sku: string, stock: number) => adminFetch<AdminProduct>(`/api/admin/products/${encodeURIComponent(id)}/stock`, { method: 'PATCH', body: JSON.stringify({ sku, stock }) }),
  bulkArchive: (ids: string[]) => adminFetch<{ modified: number }>('/api/admin/products/bulk-archive', { method: 'POST', body: JSON.stringify({ ids }) }),
  deleteProduct: (id: string, hard = false) => adminFetch<{ product: AdminProduct | null; deleted: boolean }>(`/api/admin/products/${encodeURIComponent(id)}${hard ? '?hard=true' : ''}`, { method: 'DELETE' }),
  createCategory: (input: CategoryInput) => adminFetch<AdminCategory>('/api/admin/categories', { method: 'POST', body: JSON.stringify(input) }),
  updateCategory: (id: string, input: CategoryInput) => adminFetch<AdminCategory>(`/api/admin/categories/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(input) }),
  deleteCategory: (id: string) => adminFetch<{ deleted: boolean }>(`/api/admin/categories/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  reorderCategories: (items: Array<{ id: string; order: number }>) => adminFetch<AdminCategory[]>('/api/admin/categories/reorder', { method: 'PATCH', body: JSON.stringify({ items }) }),
  updateSettings: (input: SettingsInput) => adminFetch<SettingsInput>('/api/admin/settings', { method: 'PUT', body: JSON.stringify(input) }),
};

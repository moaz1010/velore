import type { CategoryRecord, ProductRecord } from '@/types/catalog';
import type { PublicSettings } from '@/types/api';

export type AdminProduct = Omit<ProductRecord, 'categoryIds' | 'includedProductIds' | 'createdAt' | 'updatedAt'> & {
  id: string;
  categoryIds: string[];
  includedProductIds?: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type AdminCategory = Omit<CategoryRecord, 'parentId'> & {
  id: string;
  parentId?: string;
};

export interface AdminDashboardData {
  stats: {
    total: number;
    published: number;
    draft: number;
    archived: number;
    lowStockVariants: number;
  };
  lowStock: Array<{
    productId: string;
    slug: string;
    name: string;
    volumeMl: number;
    sku: string;
    stock: number;
  }>;
  recentlyEdited: Array<Pick<AdminProduct, 'id' | 'slug' | 'name' | 'status' | 'updatedAt'>>;
  checklist: Array<{
    id: string;
    label: string;
    complete: boolean;
    detail: string;
  }>;
  settings: PublicSettings;
}

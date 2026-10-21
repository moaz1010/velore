import type { CategoryRecord, ProductRecord } from '@/types/catalog';
import type { SiteSettingsRecord } from '@/lib/db/models/SiteSettings';

export type PublicProduct = Omit<
  ProductRecord,
  'categoryIds' | 'includedProductIds' | 'createdAt' | 'updatedAt'
> & {
  id: string;
  categoryIds: string[];
  includedProductIds?: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type PublicCategory = Omit<CategoryRecord, 'parentId'> & {
  id: string;
  parentId?: string;
  children?: PublicCategory[];
};

export type PublicSettings = Pick<
  SiteSettingsRecord,
  'whatsappNumber' | 'deliveryNote' | 'instagramHandle' | 'announcementBar'
>;

export interface ProductListResult {
  products: PublicProduct[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  source: 'database' | 'development-placeholder';
}

export interface ProductDetailResult {
  product: PublicProduct;
  related: PublicProduct[];
  included: PublicProduct[];
  source: 'database' | 'development-placeholder';
}

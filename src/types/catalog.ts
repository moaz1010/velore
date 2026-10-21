import type { Types } from 'mongoose';

export const genders = ['him', 'her', 'unisex'] as const;
export type ProductGender = (typeof genders)[number];

export const concentrations = ['EDP', 'EDT', 'Extrait', 'Oil'] as const;
export type Concentration = (typeof concentrations)[number];

export const seasons = ['spring', 'summer', 'autumn', 'winter'] as const;
export type Season = (typeof seasons)[number];

export const occasions = ['day', 'night', 'office', 'evening'] as const;
export type Occasion = (typeof occasions)[number];

export const badges = ['new', 'bestseller', 'limited'] as const;
export type ProductBadge = (typeof badges)[number];

export const productStatuses = ['draft', 'published', 'archived'] as const;
export type ProductStatus = (typeof productStatuses)[number];
export type ProductType = 'single' | 'discovery-set';
export type Rating = 1 | 2 | 3 | 4 | 5;

export interface ProductVariantRecord {
  volumeMl: number;
  priceEGP: number;
  compareAtEGP?: number;
  stock: number;
  sku: string;
}

export interface ProductImageRecord {
  url: string;
  alt: string;
  isPrimary: boolean;
  isPlaceholder: boolean;
}

export interface ProductNotesRecord {
  top: string[];
  heart: string[];
  base: string[];
}

export interface ProductAccordRecord {
  name: string;
  strength: number;
}

export interface ProductSeoRecord {
  title?: string;
  description?: string;
}

export interface ProductRecord {
  slug: string;
  name: string;
  tagline?: string;
  description: string;
  categoryIds: Types.ObjectId[];
  gender: ProductGender;
  concentration: Concentration;
  notes: ProductNotesRecord;
  accords: ProductAccordRecord[];
  longevity: { hours: number; rating: Rating };
  sillage: Rating;
  seasons: Season[];
  occasions: Occasion[];
  variants: ProductVariantRecord[];
  images: ProductImageRecord[];
  badges: ProductBadge[];
  type: ProductType;
  includedProductIds?: Types.ObjectId[];
  status: ProductStatus;
  featured: boolean;
  isPlaceholder: boolean;
  seo: ProductSeoRecord;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CategoryRecord {
  slug: string;
  name: string;
  kind: 'family' | 'collection';
  description?: string;
  image?: string;
  order: number;
  parentId?: Types.ObjectId;
  isActive: boolean;
}

import { z } from 'zod';

const ratingSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]);
const publicVariantSchema = z.object({
  volumeMl: z.number().int().positive(),
  priceEGP: z.number().int().nonnegative(),
  compareAtEGP: z.number().int().nonnegative().optional(),
  stock: z.number().int().nonnegative(),
  sku: z.string(),
}).strict();

export const publicProductSchema = z.object({
  id: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1),
  tagline: z.string().optional(),
  description: z.string(),
  categoryIds: z.array(z.string()),
  gender: z.enum(['him', 'her', 'unisex']),
  concentration: z.enum(['EDP', 'EDT', 'Extrait', 'Oil']),
  notes: z.object({ top: z.array(z.string()), heart: z.array(z.string()), base: z.array(z.string()) }).strict(),
  accords: z.array(z.object({ name: z.string(), strength: z.number().int().min(0).max(100) }).strict()),
  longevity: z.object({ hours: z.number().min(0), rating: ratingSchema }).strict(),
  sillage: ratingSchema,
  seasons: z.array(z.enum(['spring', 'summer', 'autumn', 'winter'])),
  occasions: z.array(z.enum(['day', 'night', 'office', 'evening'])),
  variants: z.array(publicVariantSchema).min(1),
  images: z.array(z.object({ url: z.string(), alt: z.string(), isPrimary: z.boolean(), isPlaceholder: z.boolean() }).strict()),
  badges: z.array(z.enum(['new', 'bestseller', 'limited'])),
  type: z.enum(['single', 'discovery-set']),
  includedProductIds: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published', 'archived']),
  featured: z.boolean(),
  isPlaceholder: z.boolean(),
  seo: z.object({ title: z.string().optional(), description: z.string().optional() }).strict(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}).strict();

export const publicProductListEnvelopeSchema = z.object({
  ok: z.literal(true),
  data: z.object({
    products: z.array(publicProductSchema),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    hasMore: z.boolean(),
    source: z.enum(['database', 'development-placeholder']),
  }).strict(),
}).strict();

export const publicProductDetailEnvelopeSchema = z.object({
  ok: z.literal(true),
  data: z.object({
    product: publicProductSchema,
    related: z.array(publicProductSchema),
    included: z.array(publicProductSchema),
    source: z.enum(['database', 'development-placeholder']),
  }).strict(),
}).strict();

export const publicCategorySchema: z.ZodType<{
  id: string;
  slug: string;
  name: string;
  kind: 'family' | 'collection';
  description?: string;
  image?: string;
  order: number;
  parentId?: string;
  isActive: boolean;
  children?: PublicCategorySchema[];
}> = z.lazy(() => z.object({
  id: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string(),
  kind: z.enum(['family', 'collection']),
  description: z.string().optional(),
  image: z.string().optional(),
  order: z.number().int().nonnegative(),
  parentId: z.string().optional(),
  isActive: z.boolean(),
  children: z.array(publicCategorySchema).optional(),
}).strict());

export interface PublicCategorySchema {
  id: string;
  slug: string;
  name: string;
  kind: 'family' | 'collection';
  description?: string;
  image?: string;
  order: number;
  parentId?: string;
  isActive: boolean;
  children?: PublicCategorySchema[];
}

export const publicCategoriesEnvelopeSchema = z.object({
  ok: z.literal(true),
  data: z.array(publicCategorySchema),
}).strict();

export const publicSettingsEnvelopeSchema = z.object({
  ok: z.literal(true),
  data: z.object({
    whatsappNumber: z.string(),
    deliveryNote: z.string(),
    instagramHandle: z.string(),
    announcementBar: z.object({ text: z.string(), enabled: z.boolean() }).strict().optional(),
  }).strict(),
}).strict();

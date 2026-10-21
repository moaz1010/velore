import { z } from 'zod';
import { badges, concentrations, genders, occasions, productStatuses, seasons } from '@/types/catalog';

const slugSchema = z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use a lowercase kebab-case slug.').max(96);
const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Expected a MongoDB ObjectId.');
const noteListSchema = z.array(z.string().trim().min(1).max(64)).max(12);

const productVariantSchema = z
  .object({
    volumeMl: z.number().int().positive().max(1000),
    priceEGP: z.number().int().nonnegative().max(10_000_000),
    compareAtEGP: z.number().int().nonnegative().max(10_000_000).optional(),
    stock: z.number().int().nonnegative().max(1_000_000),
    sku: z.string().trim().min(1).max(40),
  })
  .strict();

const imageLocationSchema = z.string().trim().min(1).max(2048).refine((value) => {
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}, 'Use a site-relative path or HTTPS image URL.');

const productImageSchema = z
  .object({
    url: imageLocationSchema,
    alt: z.string().trim().min(1).max(180),
    isPrimary: z.boolean(),
    isPlaceholder: z.boolean(),
  })
  .strict();

export const productSchema = z
  .object({
    slug: slugSchema,
    name: z.string().trim().min(1).max(100),
    tagline: z.string().trim().max(140).optional(),
    description: z.string().trim().min(1).max(3000),
    categoryIds: z.array(objectIdSchema).max(24),
    gender: z.enum(genders),
    concentration: z.enum(concentrations),
    notes: z
      .object({ top: noteListSchema, heart: noteListSchema, base: noteListSchema })
      .strict(),
    accords: z
      .array(z.object({ name: z.string().trim().min(1).max(48), strength: z.number().int().min(0).max(100) }).strict())
      .max(12),
    longevity: z
      .object({ hours: z.number().min(0).max(48), rating: z.number().int().min(1).max(5) })
      .strict(),
    sillage: z.number().int().min(1).max(5),
    seasons: z.array(z.enum(seasons)).max(4),
    occasions: z.array(z.enum(occasions)).max(4),
    variants: z.array(productVariantSchema).min(1).max(16),
    images: z.array(productImageSchema).max(12),
    badges: z.array(z.enum(badges)).max(3),
    type: z.enum(['single', 'discovery-set']),
    includedProductIds: z.array(objectIdSchema).max(24).optional(),
    status: z.enum(productStatuses),
    featured: z.boolean(),
    isPlaceholder: z.boolean(),
    seo: z
      .object({ title: z.string().trim().max(70).optional(), description: z.string().trim().max(180).optional() })
      .strict(),
  })
  .strict()
  .superRefine((product, context) => {
    const primaryCount = product.images.filter((image) => image.isPrimary).length;
    if (product.images.length > 0 && primaryCount !== 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Exactly one primary image is required when images exist.',
        path: ['images'],
      });
    }
    if (product.type === 'discovery-set' && (!product.includedProductIds || product.includedProductIds.length === 0)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Discovery sets must include at least one product.',
        path: ['includedProductIds'],
      });
    }
  });

export type ProductInput = z.infer<typeof productSchema>;

const optionalInteger = (minimum: number, maximum: number, fallback: number) =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.coerce.number().int().min(minimum).max(maximum).default(fallback),
  );

export const productListQuerySchema = z
  .object({
    gender: z.enum(genders).optional(),
    family: slugSchema.optional(),
    volume: optionalInteger(1, 1000, 50).optional(),
    minPrice: optionalInteger(0, 10_000_000, 0).optional(),
    maxPrice: optionalInteger(0, 10_000_000, 10_000_000).optional(),
    sort: z.enum(['featured', 'newest', 'price-asc', 'price-desc']).default('featured'),
    q: z.string().trim().max(100).optional(),
    page: optionalInteger(1, 10_000, 1),
    limit: optionalInteger(1, 48, 12),
  })
  .strict()
  .superRefine((filters, context) => {
    if (filters.minPrice !== undefined && filters.maxPrice !== undefined && filters.minPrice > filters.maxPrice) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'minPrice must not exceed maxPrice.', path: ['minPrice'] });
    }
  });

export type ProductListQuery = z.infer<typeof productListQuerySchema>;

import { z } from 'zod';
import { productStatuses } from '@/types/catalog';

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Expected a MongoDB ObjectId.');

const optionalInteger = (minimum: number, maximum: number, fallback: number) =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.coerce.number().int().min(minimum).max(maximum).default(fallback),
  );

export const adminProductListQuerySchema = z
  .object({
    q: z.string().trim().max(100).optional(),
    status: z.enum(productStatuses).optional(),
    page: optionalInteger(1, 10_000, 1),
    limit: optionalInteger(1, 100, 24),
  })
  .strict();

export type AdminProductListQuery = z.infer<typeof adminProductListQuerySchema>;

export const productStockUpdateSchema = z
  .object({
    sku: z.string().trim().min(1).max(40),
    stock: z.number().int().min(0).max(1_000_000),
  })
  .strict();

export const bulkArchiveSchema = z
  .object({ ids: z.array(objectIdSchema).min(1).max(100) })
  .strict();

export const categoryReorderSchema = z
  .object({
    items: z
      .array(z.object({ id: objectIdSchema, order: z.number().int().min(0).max(10_000) }).strict())
      .min(1)
      .max(100),
  })
  .strict()
  .superRefine((value, context) => {
    if (new Set(value.items.map((item) => item.id)).size !== value.items.length) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'Category IDs must be unique.', path: ['items'] });
    }
  });

export const hardDeleteQuerySchema = z
  .object({ hard: z.enum(['true']).optional() })
  .strict();

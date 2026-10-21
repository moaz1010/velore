import { z } from 'zod';

export const categorySchema = z
  .object({
    slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(96),
    name: z.string().trim().min(1).max(80),
    kind: z.enum(['family', 'collection']),
    description: z.string().trim().max(500).optional(),
    image: z.string().trim().max(2048).optional(),
    order: z.number().int().min(0).max(10_000),
    parentId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
    isActive: z.boolean(),
  })
  .strict();

export type CategoryInput = z.infer<typeof categorySchema>;

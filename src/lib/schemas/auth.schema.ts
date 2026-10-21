import { z } from 'zod';

export const adminLoginSchema = z
  .object({
    email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
    password: z.string().min(1).max(200),
  })
  .strict();

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

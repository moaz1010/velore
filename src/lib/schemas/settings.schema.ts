import { z } from 'zod';

export const announcementBarSchema = z
  .object({
    text: z.string().trim().max(180),
    enabled: z.boolean(),
  })
  .strict();

export const settingsSchema = z
  .object({
    whatsappNumber: z.string().trim().regex(/^$|^\d{8,15}$/, 'Use digits only, including the country code.'),
    deliveryNote: z.string().trim().max(1200),
    instagramHandle: z.string().trim().regex(/^[A-Za-z0-9._]{1,30}$/),
    announcementBar: announcementBarSchema.optional(),
  })
  .strict();

export type SettingsInput = z.infer<typeof settingsSchema>;

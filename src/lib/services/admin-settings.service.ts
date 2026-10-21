import { SiteSettingsModel, type SiteSettingsRecord } from '@/lib/db/models/SiteSettings';
import { connectToDatabase } from '@/lib/db/connect';
import type { SettingsInput } from '@/lib/schemas/settings.schema';

export interface AdminSettings {
  whatsappNumber: string;
  deliveryNote: string;
  instagramHandle: string;
  announcementBar: { text: string; enabled: boolean };
}

function toAdminSettings(settings: SiteSettingsRecord | null): AdminSettings {
  return {
    whatsappNumber: settings?.whatsappNumber ?? process.env.PUBLIC_WHATSAPP_NUMBER ?? '',
    deliveryNote: settings?.deliveryNote ?? '',
    instagramHandle: settings?.instagramHandle ?? process.env.PUBLIC_INSTAGRAM_HANDLE ?? 'velo.re15',
    announcementBar: settings?.announcementBar ?? { text: '', enabled: false },
  };
}

export async function getAdminSettings(): Promise<AdminSettings> {
  await connectToDatabase();
  const settings = await SiteSettingsModel.findOne({ key: 'primary' }).lean<SiteSettingsRecord | null>();
  return toAdminSettings(settings);
}

export async function updateAdminSettings(input: SettingsInput): Promise<AdminSettings> {
  await connectToDatabase();
  const settings = await SiteSettingsModel.findOneAndUpdate(
    { key: 'primary' },
    {
      $set: {
        whatsappNumber: input.whatsappNumber,
        deliveryNote: input.deliveryNote,
        instagramHandle: input.instagramHandle,
        announcementBar: input.announcementBar ?? { text: '', enabled: false },
      },
      $setOnInsert: { key: 'primary' },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true },
  ).lean<SiteSettingsRecord>();
  return toAdminSettings(settings);
}

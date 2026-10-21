import { SiteSettingsModel, type SiteSettingsRecord } from '@/lib/db/models/SiteSettings';
import { DatabaseNotConfiguredError, connectToDatabase } from '@/lib/db/connect';
import type { PublicSettings } from '@/types/api';

export async function getPublicSettings(): Promise<PublicSettings> {
  try {
    await connectToDatabase();
    const settings = await SiteSettingsModel.findOne({ key: 'primary' }).lean<SiteSettingsRecord | null>();
    return projectPublicSettings(settings);
  } catch (error) {
    if (error instanceof DatabaseNotConfiguredError) return projectPublicSettings(null);
    throw error;
  }
}

export function projectPublicSettings(settings: SiteSettingsRecord | null): PublicSettings {
  return {
    whatsappNumber: settings?.whatsappNumber || process.env.PUBLIC_WHATSAPP_NUMBER || '',
    deliveryNote: settings?.deliveryNote || '',
    instagramHandle:
      settings?.instagramHandle || process.env.PUBLIC_INSTAGRAM_HANDLE || 'velo.re15',
    ...(settings?.announcementBar ? { announcementBar: settings.announcementBar } : {}),
  };
}

import mongoose from 'mongoose';
import type { Model } from 'mongoose';

const { model, models, Schema } = mongoose;

export interface AnnouncementBarRecord {
  text: string;
  enabled: boolean;
}

export interface SiteSettingsRecord {
  key: string;
  whatsappNumber: string;
  deliveryNote: string;
  instagramHandle: string;
  announcementBar?: AnnouncementBarRecord;
  createdAt?: Date;
  updatedAt?: Date;
}

const announcementBarSchema = new Schema<AnnouncementBarRecord>(
  {
    text: { type: String, trim: true, maxlength: 180 },
    enabled: { type: Boolean, default: false },
  },
  { _id: false },
);

const siteSettingsSchema = new Schema<SiteSettingsRecord>(
  {
    key: { type: String, required: true, default: 'primary', unique: true },
    whatsappNumber: { type: String, trim: true, default: '' },
    deliveryNote: { type: String, trim: true, maxlength: 1200, default: '' },
    instagramHandle: { type: String, trim: true, default: 'velo.re15' },
    announcementBar: { type: announcementBarSchema, default: undefined },
  },
  { timestamps: true },
);

export const SiteSettingsModel =
  (models.SiteSettings as Model<SiteSettingsRecord> | undefined) ??
  model<SiteSettingsRecord>('SiteSettings', siteSettingsSchema);

import mongoose from 'mongoose';
import type { Model } from 'mongoose';

const { model, models, Schema } = mongoose;

export interface LoginAttemptRecord {
  key: string;
  count: number;
  expiresAt: Date;
}

const loginAttemptSchema = new Schema<LoginAttemptRecord>(
  {
    key: { type: String, required: true, unique: true, index: true },
    count: { type: Number, required: true, min: 0, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: false },
);

loginAttemptSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const LoginAttemptModel =
  (models.LoginAttempt as Model<LoginAttemptRecord> | undefined) ??
  model<LoginAttemptRecord>('LoginAttempt', loginAttemptSchema);

import { createHmac } from 'node:crypto';
import type { PipelineStage } from 'mongoose';
import { LoginAttemptModel } from '@/lib/db/models/LoginAttempt';
import { connectToDatabase } from '@/lib/db/connect';

export const LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_MAX_ATTEMPTS = 5;

function attemptKey(trustedClientAddress: string | undefined): string {
  const address = trustedClientAddress?.trim();
  if (!address) throw new Error('Trusted client address is unavailable.');
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) throw new Error('Admin rate-limit key is not configured.');
  return createHmac('sha256', secret).update(address.slice(0, 128)).digest('hex');
}

export async function reserveLoginAttempt(trustedClientAddress: string | undefined): Promise<number> {
  await connectToDatabase();
  const now = new Date();
  const nextExpiry = new Date(now.getTime() + LOGIN_WINDOW_MS);
  const update: PipelineStage[] = [
    {
      $set: {
        count: {
          $cond: [
            { $gt: ['$expiresAt', now] },
            { $add: [{ $ifNull: ['$count', 0] }, 1] },
            1,
          ],
        },
        expiresAt: {
          $cond: [{ $gt: ['$expiresAt', now] }, '$expiresAt', nextExpiry],
        },
      },
    },
  ];

  const attempt = await LoginAttemptModel.findOneAndUpdate(
    { key: attemptKey(trustedClientAddress) },
    update,
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).lean();
  return attempt?.count ?? 0;
}

export async function clearLoginAttempts(trustedClientAddress: string | undefined): Promise<void> {
  await connectToDatabase();
  await LoginAttemptModel.deleteOne({ key: attemptKey(trustedClientAddress) });
}

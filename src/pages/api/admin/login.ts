import { timingSafeEqual, createHash } from 'node:crypto';
import type { APIRoute } from 'astro';
import bcrypt from 'bcryptjs';
import { failureResponse, issuesToFields, successResponse } from '@/lib/api-response';
import { clearLoginAttempts, LOGIN_MAX_ATTEMPTS, reserveLoginAttempt } from '@/lib/auth/rate-limit';
import { configuredAdminEmail, createAdminSession, isAdminAuthConfigured, serializeAdminSessionCookie } from '@/lib/auth/session';
import { adminLoginSchema } from '@/lib/schemas/auth.schema';

export const prerender = false;
const noStore = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow, noarchive' };

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function equalEmail(left: string, right: string): boolean {
  const leftDigest = createHash('sha256').update(left.trim().toLowerCase()).digest();
  const rightDigest = createHash('sha256').update(right.trim().toLowerCase()).digest();
  return timingSafeEqual(leftDigest, rightDigest);
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const parsed = adminLoginSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return failureResponse('invalid_input', 'Please enter a valid email and password.', 400, issuesToFields(parsed.error.issues), noStore);
  }

  if (!isAdminAuthConfigured()) {
    return failureResponse('admin_not_configured', 'Owner sign-in is not configured yet.', 503, undefined, noStore);
  }

  try {
    const attemptCount = await reserveLoginAttempt(clientAddress);
    if (attemptCount > LOGIN_MAX_ATTEMPTS) {
      return failureResponse('rate_limited', 'Too many sign-in attempts. Please try again later.', 429, undefined, noStore);
    }

    const configuredEmail = configuredAdminEmail();
    const hash = process.env.ADMIN_PASSWORD_HASH?.trim() ?? '';
    const passwordMatches = await bcrypt.compare(parsed.data.password, hash);
    if (!equalEmail(parsed.data.email, configuredEmail) || !passwordMatches) {
      return failureResponse('invalid_credentials', 'Invalid email or password.', 401, undefined, noStore);
    }

    await clearLoginAttempts(clientAddress);
    const token = await createAdminSession(configuredEmail);
    const headers = new Headers(noStore);
    headers.append('Set-Cookie', serializeAdminSessionCookie(token));
    return successResponse({ redirectTo: '/admin' }, { headers });
  } catch {
    return failureResponse('auth_unavailable', 'Sign-in is temporarily unavailable. Please try again shortly.', 503, undefined, noStore);
  }
};

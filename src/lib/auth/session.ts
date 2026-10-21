import { jwtVerify, SignJWT } from 'jose';

export const ADMIN_SESSION_COOKIE = 'velore_admin_session';
export const ADMIN_SESSION_SECONDS = 8 * 60 * 60;

export type AuthCookieMode = 'preview' | 'same-site' | 'local-http';

function jwtSecret(): Uint8Array {
  const value = process.env.JWT_SECRET?.trim();
  if (!value || Buffer.byteLength(value, 'utf8') < 32) {
    throw new Error('JWT_SECRET must contain at least 32 bytes.');
  }
  return new TextEncoder().encode(value);
}

export function configuredAdminEmail(): string {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? '';
}

export function isAdminAuthConfigured(): boolean {
  return Boolean(
    configuredAdminEmail() &&
      process.env.ADMIN_PASSWORD_HASH?.trim() &&
      process.env.JWT_SECRET?.trim() &&
      Buffer.byteLength(process.env.JWT_SECRET.trim(), 'utf8') >= 32,
  );
}

export async function createAdminSession(email: string): Promise<string> {
  return new SignJWT({ role: 'owner' })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuer('velore')
    .setAudience('velore-admin')
    .setSubject(email.trim().toLowerCase())
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_SESSION_SECONDS}s`)
    .sign(jwtSecret());
}

export async function verifyAdminSession(token: string): Promise<{ email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, jwtSecret(), {
      algorithms: ['HS256'],
      issuer: 'velore',
      audience: 'velore-admin',
    });
    const expectedEmail = configuredAdminEmail();
    if (payload.role !== 'owner' || typeof payload.sub !== 'string' || payload.sub !== expectedEmail || !expectedEmail) {
      return null;
    }
    return { email: payload.sub };
  } catch {
    return null;
  }
}

function cookieMode(): AuthCookieMode {
  const configured = process.env.AUTH_COOKIE_MODE?.trim();
  if (!configured) return 'preview';
  if (configured === 'preview' || configured === 'same-site' || configured === 'local-http') return configured;
  throw new Error('AUTH_COOKIE_MODE must be preview, same-site, or local-http.');
}

export function serializeAdminSessionCookie(token: string, clear = false): string {
  const mode = cookieMode();
  const sameSite = mode === 'preview' ? 'None' : 'Lax';
  const secure = mode !== 'local-http';
  const value = clear ? '' : encodeURIComponent(token);
  const maxAge = clear ? 0 : ADMIN_SESSION_SECONDS;
  return [
    `${ADMIN_SESSION_COOKIE}=${value}`,
    'Path=/',
    'HttpOnly',
    `SameSite=${sameSite}`,
    `Max-Age=${maxAge}`,
    ...(secure ? ['Secure'] : []),
  ].join('; ');
}

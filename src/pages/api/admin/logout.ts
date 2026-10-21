import type { APIRoute } from 'astro';
import { successResponse } from '@/lib/api-response';
import { serializeAdminSessionCookie } from '@/lib/auth/session';

export const prerender = false;

export const POST: APIRoute = async () => {
  const headers = new Headers({
    'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
  });
  headers.append('Set-Cookie', serializeAdminSessionCookie('', true));
  return successResponse({ redirectTo: '/admin/login' }, { headers });
};

import { defineMiddleware } from 'astro:middleware';
import { failureResponse } from '@/lib/api-response';
import { isAllowedAdminOrigin } from '@/lib/auth/origin';
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/lib/auth/session';

const adminHeaders = {
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
};

function isAdminRoute(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/') || pathname.startsWith('/api/admin/');
}

function isAdminApi(pathname: string): boolean {
  return pathname.startsWith('/api/admin/');
}

function isPublicAdminEndpoint(pathname: string): boolean {
  return pathname === '/api/admin/login' || pathname === '/api/admin/logout';
}

function withAdminHeaders(response: Response): Response {
  for (const [name, value] of Object.entries(adminHeaders)) response.headers.set(name, value);
  return response;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  if (!isAdminRoute(pathname)) return next();

  const mutating = !['GET', 'HEAD', 'OPTIONS'].includes(context.request.method.toUpperCase());
  if (mutating && !isAllowedAdminOrigin(context.request.headers.get('origin'))) {
    return withAdminHeaders(
      failureResponse('origin_not_allowed', 'This request origin is not allowed.', 403, undefined, adminHeaders),
    );
  }

  if (!isPublicAdminEndpoint(pathname)) {
    const token = context.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const session = token ? await verifyAdminSession(token) : null;
    if (!session) {
      if (isAdminApi(pathname)) {
        return withAdminHeaders(failureResponse('unauthorized', 'Sign in to manage the Velore store.', 401, undefined, adminHeaders));
      }
      if (pathname !== '/admin/login') {
        return withAdminHeaders(new Response(null, { status: 303, headers: { Location: '/admin/login' } }));
      }
    }
  }

  return withAdminHeaders(await next());
});

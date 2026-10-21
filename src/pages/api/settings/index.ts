import type { APIRoute } from 'astro';
import { failureResponse, successResponse } from '@/lib/api-response';
import { getPublicSettings } from '@/lib/services/settings.service';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const settings = await getPublicSettings();
    return successResponse(settings, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch {
    return failureResponse(
      'settings_unavailable',
      'Public store details are temporarily unavailable.',
      503,
      undefined,
      { 'Cache-Control': 'no-store' },
    );
  }
};

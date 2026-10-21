import type { APIRoute } from 'astro';
import { failureResponse, successResponse } from '@/lib/api-response';
import { listPublicCategories } from '@/lib/services/category.service';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const categories = await listPublicCategories();
    return successResponse(categories, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch {
    return failureResponse(
      'categories_unavailable',
      'Fragrance families are temporarily unavailable.',
      503,
      undefined,
      { 'Cache-Control': 'no-store' },
    );
  }
};

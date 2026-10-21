import type { APIRoute } from 'astro';
import { failureResponse, successResponse } from '@/lib/api-response';
import { findPublishedProduct } from '@/lib/services/product.service';

export const prerender = false;
const publicCache = 'public, s-maxage=60, stale-while-revalidate=300';

export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug?.trim();
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return failureResponse('invalid_slug', 'The fragrance slug is invalid.', 400, undefined, {
      'Cache-Control': 'no-store',
    });
  }
  try {
    const data = await findPublishedProduct(slug);
    if (!data) return failureResponse('not_found', 'Fragrance not found.', 404, undefined, { 'Cache-Control': publicCache });
    return successResponse(data, { headers: { 'Cache-Control': publicCache } });
  } catch {
    return failureResponse(
      'catalog_unavailable',
      'The fragrance is temporarily unavailable. Please try again shortly.',
      503,
      undefined,
      { 'Cache-Control': 'no-store' },
    );
  }
};

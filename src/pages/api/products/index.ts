import type { APIRoute } from 'astro';
import { failureResponse, successResponse } from '@/lib/api-response';
import { listPublishedProducts } from '@/lib/services/product.service';
import { parseProductListQuery } from '@/lib/services/query-params';

export const prerender = false;
const publicCache = 'public, s-maxage=60, stale-while-revalidate=300';

export const GET: APIRoute = async ({ url }) => {
  const parsed = parseProductListQuery(url.searchParams);
  if (!parsed.ok) {
    return failureResponse('invalid_query', 'Please check the catalog filters.', 400, parsed.fields, {
      'Cache-Control': 'no-store',
    });
  }

  try {
    const data = await listPublishedProducts(parsed.data);
    return successResponse(data, { headers: { 'Cache-Control': publicCache } });
  } catch {
    return failureResponse(
      'catalog_unavailable',
      'The fragrance catalog is temporarily unavailable. Please try again shortly.',
      503,
      undefined,
      { 'Cache-Control': 'no-store' },
    );
  }
};

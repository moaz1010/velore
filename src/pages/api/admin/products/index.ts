import type { APIRoute } from 'astro';
import { failureResponse, issuesToFields, successResponse } from '@/lib/api-response';
import { adminErrorResponse, adminNoStoreHeaders, readJsonBody } from '@/lib/admin/route-utils';
import { productSchema } from '@/lib/schemas/product.schema';
import { adminProductListQuerySchema } from '@/lib/schemas/admin.schema';
import { createAdminProduct, listAdminProducts } from '@/lib/services/admin.service';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const parsed = adminProductListQuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!parsed.success) {
    return failureResponse('invalid_query', 'Please check the product filters.', 400, issuesToFields(parsed.error.issues), adminNoStoreHeaders);
  }
  try {
    return successResponse(await listAdminProducts(parsed.data), { headers: adminNoStoreHeaders });
  } catch (error) {
    return adminErrorResponse(error);
  }
};

export const POST: APIRoute = async ({ request }) => {
  const parsed = productSchema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return failureResponse('invalid_input', 'Please correct the product fields.', 400, issuesToFields(parsed.error.issues), adminNoStoreHeaders);
  }
  try {
    return successResponse(await createAdminProduct(parsed.data), { status: 201, headers: adminNoStoreHeaders });
  } catch (error) {
    return adminErrorResponse(error);
  }
};

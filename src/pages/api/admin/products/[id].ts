import mongoose from 'mongoose';
import type { APIRoute } from 'astro';
import { failureResponse, issuesToFields, successResponse } from '@/lib/api-response';
import { adminErrorResponse, adminNoStoreHeaders, readJsonBody } from '@/lib/admin/route-utils';
import { hardDeleteQuerySchema } from '@/lib/schemas/admin.schema';
import { productSchema } from '@/lib/schemas/product.schema';
import { archiveAdminProduct, getAdminProduct, updateAdminProduct } from '@/lib/services/admin.service';

export const prerender = false;

function validId(id: string | undefined): id is string {
  return Boolean(id && mongoose.Types.ObjectId.isValid(id));
}

export const GET: APIRoute = async ({ params }) => {
  if (!validId(params.id)) return failureResponse('invalid_id', 'This product ID is invalid.', 400, undefined, adminNoStoreHeaders);
  try {
    const product = await getAdminProduct(params.id);
    return product
      ? successResponse(product, { headers: adminNoStoreHeaders })
      : failureResponse('not_found', 'Product not found.', 404, undefined, adminNoStoreHeaders);
  } catch (error) {
    return adminErrorResponse(error);
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  if (!validId(params.id)) return failureResponse('invalid_id', 'This product ID is invalid.', 400, undefined, adminNoStoreHeaders);
  const parsed = productSchema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return failureResponse('invalid_input', 'Please correct the product fields.', 400, issuesToFields(parsed.error.issues), adminNoStoreHeaders);
  }
  try {
    const product = await updateAdminProduct(params.id, parsed.data);
    return product
      ? successResponse(product, { headers: adminNoStoreHeaders })
      : failureResponse('not_found', 'Product not found.', 404, undefined, adminNoStoreHeaders);
  } catch (error) {
    return adminErrorResponse(error);
  }
};

export const DELETE: APIRoute = async ({ params, url }) => {
  if (!validId(params.id)) return failureResponse('invalid_id', 'This product ID is invalid.', 400, undefined, adminNoStoreHeaders);
  const parsed = hardDeleteQuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!parsed.success) return failureResponse('invalid_query', 'This delete request is invalid.', 400, issuesToFields(parsed.error.issues), adminNoStoreHeaders);
  try {
    const result = await archiveAdminProduct(params.id, parsed.data.hard === 'true');
    if (result.blocked) {
      return failureResponse('product_in_use', 'This product is included in a discovery set and cannot be permanently deleted.', 409, undefined, adminNoStoreHeaders);
    }
    if (!result.product && !result.deleted) return failureResponse('not_found', 'Product not found.', 404, undefined, adminNoStoreHeaders);
    return successResponse({ product: result.product, deleted: result.deleted }, { headers: adminNoStoreHeaders });
  } catch (error) {
    return adminErrorResponse(error);
  }
};

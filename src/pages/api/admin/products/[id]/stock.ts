import mongoose from 'mongoose';
import type { APIRoute } from 'astro';
import { failureResponse, issuesToFields, successResponse } from '@/lib/api-response';
import { adminErrorResponse, adminNoStoreHeaders, readJsonBody } from '@/lib/admin/route-utils';
import { productStockUpdateSchema } from '@/lib/schemas/admin.schema';
import { updateAdminProductStock } from '@/lib/services/admin.service';

export const prerender = false;

export const PATCH: APIRoute = async ({ params, request }) => {
  if (!params.id || !mongoose.Types.ObjectId.isValid(params.id)) {
    return failureResponse('invalid_id', 'This product ID is invalid.', 400, undefined, adminNoStoreHeaders);
  }
  const parsed = productStockUpdateSchema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return failureResponse('invalid_input', 'Please enter a valid stock amount.', 400, issuesToFields(parsed.error.issues), adminNoStoreHeaders);
  }
  try {
    const product = await updateAdminProductStock(params.id, parsed.data.sku, parsed.data.stock);
    return product
      ? successResponse(product, { headers: adminNoStoreHeaders })
      : failureResponse('variant_not_found', 'The product variant no longer exists.', 404, undefined, adminNoStoreHeaders);
  } catch (error) {
    return adminErrorResponse(error);
  }
};

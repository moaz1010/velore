import mongoose from 'mongoose';
import type { APIRoute } from 'astro';
import { failureResponse, issuesToFields, successResponse } from '@/lib/api-response';
import { adminErrorResponse, adminNoStoreHeaders, readJsonBody } from '@/lib/admin/route-utils';
import { bulkArchiveSchema } from '@/lib/schemas/admin.schema';
import { bulkArchiveAdminProducts } from '@/lib/services/admin.service';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const parsed = bulkArchiveSchema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return failureResponse('invalid_input', 'Select one or more valid products.', 400, issuesToFields(parsed.error.issues), adminNoStoreHeaders);
  }
  if (parsed.data.ids.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
    return failureResponse('invalid_input', 'One or more product IDs are invalid.', 400, undefined, adminNoStoreHeaders);
  }
  try {
    const modified = await bulkArchiveAdminProducts(parsed.data.ids);
    return successResponse({ modified }, { headers: adminNoStoreHeaders });
  } catch (error) {
    return adminErrorResponse(error);
  }
};

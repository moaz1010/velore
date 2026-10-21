import type { APIRoute } from 'astro';
import { failureResponse, issuesToFields, successResponse } from '@/lib/api-response';
import { adminErrorResponse, adminNoStoreHeaders, readJsonBody } from '@/lib/admin/route-utils';
import { categorySchema } from '@/lib/schemas/category.schema';
import { createAdminCategory, listAdminCategories } from '@/lib/services/admin.service';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    return successResponse(await listAdminCategories(), { headers: adminNoStoreHeaders });
  } catch (error) {
    return adminErrorResponse(error);
  }
};

export const POST: APIRoute = async ({ request }) => {
  const parsed = categorySchema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return failureResponse('invalid_input', 'Please correct the category fields.', 400, issuesToFields(parsed.error.issues), adminNoStoreHeaders);
  }
  try {
    return successResponse(await createAdminCategory(parsed.data), { status: 201, headers: adminNoStoreHeaders });
  } catch (error) {
    return adminErrorResponse(error);
  }
};

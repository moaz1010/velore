import type { APIRoute } from 'astro';
import { failureResponse, issuesToFields, successResponse } from '@/lib/api-response';
import { adminErrorResponse, adminNoStoreHeaders, readJsonBody } from '@/lib/admin/route-utils';
import { categoryReorderSchema } from '@/lib/schemas/admin.schema';
import { reorderAdminCategories } from '@/lib/services/admin.service';

export const prerender = false;

export const PATCH: APIRoute = async ({ request }) => {
  const parsed = categoryReorderSchema.safeParse(await readJsonBody(request));
  if (!parsed.success) return failureResponse('invalid_input', 'The category order is invalid.', 400, issuesToFields(parsed.error.issues), adminNoStoreHeaders);
  try {
    return successResponse(await reorderAdminCategories(parsed.data.items), { headers: adminNoStoreHeaders });
  } catch (error) {
    return adminErrorResponse(error);
  }
};

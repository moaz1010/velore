import mongoose from 'mongoose';
import type { APIRoute } from 'astro';
import { failureResponse, issuesToFields, successResponse } from '@/lib/api-response';
import { adminErrorResponse, adminNoStoreHeaders, readJsonBody } from '@/lib/admin/route-utils';
import { categorySchema } from '@/lib/schemas/category.schema';
import { deleteAdminCategory, updateAdminCategory } from '@/lib/services/admin.service';

export const prerender = false;

export const PUT: APIRoute = async ({ params, request }) => {
  if (!params.id || !mongoose.Types.ObjectId.isValid(params.id)) return failureResponse('invalid_id', 'This category ID is invalid.', 400, undefined, adminNoStoreHeaders);
  const parsed = categorySchema.safeParse(await readJsonBody(request));
  if (!parsed.success) return failureResponse('invalid_input', 'Please correct the category fields.', 400, issuesToFields(parsed.error.issues), adminNoStoreHeaders);
  try {
    const category = await updateAdminCategory(params.id, parsed.data);
    return category
      ? successResponse(category, { headers: adminNoStoreHeaders })
      : failureResponse('not_found', 'Category not found.', 404, undefined, adminNoStoreHeaders);
  } catch (error) {
    return adminErrorResponse(error);
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  if (!params.id || !mongoose.Types.ObjectId.isValid(params.id)) return failureResponse('invalid_id', 'This category ID is invalid.', 400, undefined, adminNoStoreHeaders);
  try {
    const result = await deleteAdminCategory(params.id);
    if (result.blocked) return failureResponse('category_in_use', 'Remove product and child-category references before deleting this category.', 409, undefined, adminNoStoreHeaders);
    return result.deleted
      ? successResponse({ deleted: true }, { headers: adminNoStoreHeaders })
      : failureResponse('not_found', 'Category not found.', 404, undefined, adminNoStoreHeaders);
  } catch (error) {
    return adminErrorResponse(error);
  }
};

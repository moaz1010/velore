import type { APIRoute } from 'astro';
import { failureResponse, issuesToFields, successResponse } from '@/lib/api-response';
import { adminErrorResponse, adminNoStoreHeaders, readJsonBody } from '@/lib/admin/route-utils';
import { settingsSchema } from '@/lib/schemas/settings.schema';
import { getAdminSettings, updateAdminSettings } from '@/lib/services/admin-settings.service';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    return successResponse(await getAdminSettings(), { headers: adminNoStoreHeaders });
  } catch (error) {
    return adminErrorResponse(error);
  }
};

export const PUT: APIRoute = async ({ request }) => {
  const parsed = settingsSchema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return failureResponse('invalid_input', 'Please correct the settings fields.', 400, issuesToFields(parsed.error.issues), adminNoStoreHeaders);
  }
  try {
    return successResponse(await updateAdminSettings(parsed.data), { headers: adminNoStoreHeaders });
  } catch (error) {
    return adminErrorResponse(error);
  }
};

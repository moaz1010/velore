import type { APIRoute } from 'astro';
import { failureResponse, successResponse } from '@/lib/api-response';
import { adminErrorResponse, adminNoStoreHeaders } from '@/lib/admin/route-utils';
import { getAdminDashboard } from '@/lib/services/admin.service';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    return successResponse(await getAdminDashboard(), { headers: adminNoStoreHeaders });
  } catch (error) {
    if (error instanceof Error && error.message.includes('MONGODB_URI')) {
      return failureResponse('database_not_configured', 'Connect the Velore catalog database to use the admin.', 503, undefined, adminNoStoreHeaders);
    }
    return adminErrorResponse(error);
  }
};

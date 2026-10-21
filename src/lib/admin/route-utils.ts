import mongoose from 'mongoose';
import { failureResponse } from '@/lib/api-response';

export const adminNoStoreHeaders = {
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
};

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function adminErrorResponse(error: unknown): Response {
  if (error instanceof Error && error.message === 'PRODUCT_REFERENCES_INVALID') {
    return failureResponse('invalid_references', 'Select existing categories and single fragrances; discovery sets cannot include themselves or duplicate fragrances.', 400, undefined, adminNoStoreHeaders);
  }
  if (error instanceof Error && error.message === 'CATEGORY_PARENT_INVALID') {
    return failureResponse('invalid_parent', 'Choose an existing parent category without creating a cycle.', 400, undefined, adminNoStoreHeaders);
  }
  if (error instanceof Error && error.message === 'CATEGORY_REORDER_NOT_FOUND') {
    return failureResponse('category_not_found', 'One or more categories no longer exist. Refresh and try again.', 409, undefined, adminNoStoreHeaders);
  }
  if (error instanceof mongoose.Error.ValidationError) {
    const fields: Record<string, string> = {};
    for (const [path, issue] of Object.entries(error.errors)) fields[path] = issue.message;
    return failureResponse('validation_failed', 'Please correct the highlighted fields.', 400, fields, adminNoStoreHeaders);
  }
  if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'number' && error.code === 11000) {
    return failureResponse('duplicate_record', 'A record with that slug or key already exists.', 409, undefined, adminNoStoreHeaders);
  }
  return failureResponse('admin_service_unavailable', 'The admin service is temporarily unavailable.', 503, undefined, adminNoStoreHeaders);
}

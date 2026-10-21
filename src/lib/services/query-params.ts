import { productListQuerySchema, type ProductListQuery } from '@/lib/schemas/product.schema';

const allowedKeys = new Set([
  'gender',
  'family',
  'volume',
  'minPrice',
  'maxPrice',
  'sort',
  'q',
  'page',
  'limit',
]);

export function parseProductListQuery(
  params: URLSearchParams,
): { ok: true; data: ProductListQuery } | { ok: false; fields: Record<string, string> } {
  const raw: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    if (!allowedKeys.has(key)) return { ok: false, fields: { [key]: 'Unknown query parameter.' } };
    if (Object.hasOwn(raw, key)) return { ok: false, fields: { [key]: 'Use each filter only once.' } };
    raw[key] = value;
  }
  const parsed = productListQuerySchema.safeParse(raw);
  if (parsed.success) return { ok: true, data: parsed.data };
  const fields: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path.length > 0 ? issue.path.join('.') : '_form';
    fields[key] ??= issue.message;
  }
  return { ok: false, fields };
}

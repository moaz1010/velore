function normalizedOrigin(value: string): string | null {
  try {
    const parsed = new URL(value.trim());
    if ((parsed.protocol !== 'https:' && parsed.protocol !== 'http:') || parsed.origin === 'null') return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

export function isAllowedAdminOrigin(originHeader: string | null): boolean {
  if (!originHeader) return false;
  const requestOrigin = normalizedOrigin(originHeader);
  if (!requestOrigin) return false;

  const configured = [
    ...(process.env.AUTH_ALLOWED_ORIGINS ?? '').split(','),
    process.env.PUBLIC_SITE_URL ?? '',
  ]
    .map((value) => normalizedOrigin(value))
    .filter((value): value is string => value !== null);

  return configured.includes(requestOrigin);
}

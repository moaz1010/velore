import type { ZodIssue } from 'zod';

export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiFailure {
  ok: false;
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
}

export function successResponse<T>(data: T, init: ResponseInit = {}): Response {
  return Response.json({ ok: true, data } satisfies ApiSuccess<T>, init);
}

export function failureResponse(
  code: string,
  message: string,
  status: number,
  fields?: Record<string, string>,
  headers?: HeadersInit,
): Response {
  return Response.json(
    { ok: false, error: { code, message, ...(fields ? { fields } : {}) } } satisfies ApiFailure,
    { status, headers },
  );
}

export function issuesToFields(issues: ZodIssue[]): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.length > 0 ? issue.path.join('.') : '_form';
    fields[key] ??= issue.message;
  }
  return fields;
}

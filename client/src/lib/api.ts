import type { ApiErrorResponse } from '@shared/types';

/** Must match `csrfCookieName` in server `env.ts` (non-httpOnly cookie for double-submit CSRF). */
const CSRF_COOKIE_NAME = 'm_music.csrf';

function readBrowserCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const segments = document.cookie.split(';');

  for (const segment of segments) {
    const trimmed = segment.trim();

    if (trimmed.startsWith(`${name}=`)) {
      return decodeURIComponent(trimmed.slice(name.length + 1));
    }
  }

  return null;
}

export class ApiError<TPayload = unknown> extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload: TPayload
  ) {
    const shownMessage = message.includes(`status ${status}`) || message.includes(`status: ${status}`)
      ? message
      : `${message} (status: ${status})`;

    super(shownMessage);
    this.name = 'ApiError';
  }
}

interface RequestJsonOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

function buildRequestInit(options: RequestJsonOptions = {}): RequestInit {
  const headers = new Headers(options.headers);
  const method = (options.method ?? 'GET').toUpperCase();

  if (['DELETE', 'PATCH', 'POST', 'PUT'].includes(method)) {
    const token = readBrowserCookie(CSRF_COOKIE_NAME);

    if (token) {
      headers.set('X-CSRF-Token', token);
    }
  }

  if (options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return {
    ...options,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    credentials: 'same-origin',
    headers
  };
}

export function getErrorMessage(payload: unknown, fallback = 'Request failed.'): string {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const typedPayload = payload as Partial<ApiErrorResponse> & { message?: string };

  if (typeof typedPayload.message === 'string' && typedPayload.message.trim()) {
    return typedPayload.message;
  }

  if (typeof typedPayload.error === 'string' && typedPayload.error.trim()) {
    return typedPayload.error;
  }

  return fallback;
}

export async function requestJson<TResponse>(url: string, options: RequestJsonOptions = {}): Promise<TResponse> {
  const response = await fetch(url, buildRequestInit(options));
  const payload = (await response.json().catch(() => null)) as TResponse | ApiErrorResponse | null;

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(payload, `Request failed with status ${response.status}.`),
      response.status,
      payload
    );
  }

  return payload as TResponse;
}

export function fetchJson<TResponse>(url: string): Promise<TResponse> {
  return requestJson<TResponse>(url);
}

export function postJson<TResponse>(url: string, body?: unknown): Promise<TResponse> {
  return requestJson<TResponse>(url, {
    body,
    method: 'POST'
  });
}

export function deleteJson<TResponse>(url: string, body?: unknown): Promise<TResponse> {
  return requestJson<TResponse>(url, {
    body,
    method: 'DELETE'
  });
}

export function patchJson<TResponse>(url: string, body?: unknown): Promise<TResponse> {
  return requestJson<TResponse>(url, {
    body,
    method: 'PATCH'
  });
}

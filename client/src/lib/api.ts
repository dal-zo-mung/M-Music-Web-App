import axios, { isAxiosError } from "axios";
import type { ApiErrorResponse } from "@shared/types";

const API_ORIGIN = (import.meta.env.VITE_API_URL ?? "").trim().replace(/\/+$/, "");
let responseCsrfToken = "";
let csrfBootstrap: Promise<string> | null = null;

export function apiUrl(path: string): string {
  return `${API_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}

export function clearCsrfToken(): void {
  responseCsrfToken = "";
}

export class ApiError<TPayload = unknown> extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload: TPayload,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function friendlyErrorMessage(
  status: number | undefined,
  fallback = "Something went wrong.",
): string {
  if (typeof status === "number" && status >= 500) {
    return "The server is currently unavailable. Please try again in a moment.";
  }

  if (typeof status === "number" && status === 404) {
    return "The requested item could not be found.";
  }

  if (typeof status === "number" && status === 401) {
    return "Please sign in to continue.";
  }

  if (typeof status === "number" && status === 403) {
    return "You are not allowed to do that.";
  }

  if (typeof status === "number" && status >= 400) {
    return "Something went wrong. Please try again.";
  }

  return fallback;
}

interface RequestJsonOptions {
  body?: unknown;
  headers?: Record<string, string>;
  method?: string;
  signal?: AbortSignal;
}

const api = axios.create({
  baseURL: API_ORIGIN || undefined,
  withCredentials: true,
  headers: { "X-M-Music-Client": "M-Music-Web-App" },
});

api.interceptors.response.use((response) => {
  const token = response.headers["x-csrf-token"];
  if (typeof token === "string" && token) responseCsrfToken = token;
  return response;
});

async function ensureCsrfToken(refresh = false): Promise<string> {
  if (!refresh && responseCsrfToken) return responseCsrfToken;

  // A readable CSRF cookie alone does not prove that the API session exists.
  // Bootstrap through the API and share the request across concurrent mutations.
  if (!csrfBootstrap) {
    csrfBootstrap = api
      .get("/api/me")
      .then((response) => {
        const token = response.headers["x-csrf-token"];
        if (typeof token !== "string" || !token) {
          throw new ApiError("Could not initialize the security token. Please try again.", 0, null);
        }
        return token;
      })
      .finally(() => {
        csrfBootstrap = null;
      });
  }
  return csrfBootstrap;
}

async function buildHeaders(options: RequestJsonOptions): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "X-M-Music-Client": "M-Music-Web-App",
    ...(options.headers ?? {}),
  };
  const method = (options.method ?? "GET").toUpperCase();

  if (["DELETE", "PATCH", "POST", "PUT"].includes(method)) {
    const token = await ensureCsrfToken();

    if (token) headers["X-CSRF-Token"] = token;
  }

  if (
    options.body !== undefined &&
    !(typeof FormData !== "undefined" && options.body instanceof FormData) &&
    !headers["Content-Type"]
  ) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

export function getErrorMessage(payload: unknown, fallback = "Request failed."): string {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const typedPayload = payload as {
    error?: unknown;
    message?: unknown;
  };

  if (typeof typedPayload.message === "string" && typedPayload.message.trim()) {
    return typedPayload.message;
  }

  if (typeof typedPayload.error === "string" && typedPayload.error.trim()) {
    return typedPayload.error;
  }

  if (
    typedPayload.error &&
    typeof typedPayload.error === "object" &&
    "message" in typedPayload.error
  ) {
    const errorMessage = (typedPayload.error as { message?: unknown }).message;
    if (typeof errorMessage === "string" && errorMessage.trim()) {
      return errorMessage;
    }
  }

  return fallback;
}

export async function requestJson<TResponse>(
  url: string,
  options: RequestJsonOptions = {},
): Promise<TResponse> {
  try {
    const config = {
      data: options.body,
      headers: await buildHeaders(options),
      method: options.method ?? "GET",
      signal: options.signal,
      url,
    };
    let response;
    try {
      response = await api.request<TResponse>(config);
    } catch (error) {
      // CSRF rejection happens before the route runs, so this mutation can
      // safely retry once after refreshing an expired or replaced session.
      if (
        !isAxiosError(error) ||
        error.response?.status !== 403 ||
        error.response.data?.error !== "CSRF validation failed." ||
        !["DELETE", "PATCH", "POST", "PUT"].includes(config.method.toUpperCase()) ||
        options.signal?.aborted
      ) {
        throw error;
      }
      clearCsrfToken();
      config.headers["X-CSRF-Token"] = await ensureCsrfToken(true);
      response = await api.request<TResponse>(config);
    }

    return response.data;
  } catch (error) {
    if (!isAxiosError(error)) throw error;

    const payload = (error.response?.data ?? null) as TResponse | ApiErrorResponse | null;

    const fallback = error.response
      ? friendlyErrorMessage(error.response.status)
      : "The server is currently unavailable. Please try again in a moment.";

    throw new ApiError(getErrorMessage(payload, fallback), error.response?.status ?? 0, payload);
  }
}

export function fetchJson<TResponse>(url: string): Promise<TResponse> {
  return requestJson<TResponse>(url);
}

export function postJson<TResponse>(url: string, body?: unknown): Promise<TResponse> {
  return requestJson<TResponse>(url, {
    body,
    method: "POST",
  });
}

export function deleteJson<TResponse>(url: string, body?: unknown): Promise<TResponse> {
  return requestJson<TResponse>(url, {
    body,
    method: "DELETE",
  });
}

export function patchJson<TResponse>(url: string, body?: unknown): Promise<TResponse> {
  return requestJson<TResponse>(url, {
    body,
    method: "PATCH",
  });
}

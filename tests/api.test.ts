import { afterAll, beforeEach, describe, expect, spyOn, test } from "bun:test";
import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";

const requests: InternalAxiosRequestConfig[] = [];
let respond: (config: InternalAxiosRequestConfig) => {
  status?: number;
  token?: string;
  data?: unknown;
};
const instance = axios.create();
instance.defaults.adapter = async (config) => {
  requests.push(config);
  const result = respond(config);
  const response: AxiosResponse = {
    status: result.status ?? 200,
    statusText: "",
    data: result.data ?? { status: true },
    headers: result.token ? { "x-csrf-token": result.token } : {},
    config,
  };
  if (response.status >= 400)
    throw new AxiosError("Request failed", "ERR_BAD_REQUEST", config, undefined, response);
  return response;
};
const createSpy = spyOn(axios, "create").mockImplementation((config) => {
  instance.defaults.withCredentials = config?.withCredentials;
  return instance;
});
const { ApiError, clearCsrfToken, fetchJson, postJson } = await import("../client/src/lib/api.ts");
createSpy.mockRestore();

const documentDescriptor = Object.getOwnPropertyDescriptor(globalThis, "document");
Object.defineProperty(globalThis, "document", {
  configurable: true,
  value: { cookie: "m_music.csrf=orphan-token" },
});
afterAll(() => {
  if (documentDescriptor) Object.defineProperty(globalThis, "document", documentDescriptor);
  else Reflect.deleteProperty(globalThis, "document");
});
beforeEach(() => {
  clearCsrfToken();
  requests.length = 0;
});

describe("API session and CSRF bootstrap", () => {
  test("bootstraps a session even when a CSRF-only cookie exists", async () => {
    respond = (config) => ({
      token: config.method === "get" ? "session-token" : undefined,
    });
    await postJson("/api/register", { username: "new_user" });
    expect(requests.map((config) => config.url)).toEqual(["/api/me", "/api/register"]);
    expect(requests[1]!.headers.get("X-CSRF-Token")).toBe("session-token");
    expect(requests.every((config) => config.withCredentials)).toBe(true);
  });

  test("shares bootstrap across concurrent mutations", async () => {
    respond = () => ({ token: "shared-token" });
    await Promise.all([postJson("/api/register"), postJson("/api/login")]);
    expect(requests.filter((config) => config.url === "/api/me")).toHaveLength(1);
    expect(
      requests
        .filter((config) => config.method === "post")
        .every((config) => config.headers.get("X-CSRF-Token") === "shared-token"),
    ).toBe(true);
  });

  test("refreshes an expired session and retries a rejected mutation once", async () => {
    respond = () => ({ token: "expired-token" });
    await fetchJson("/api/me");
    requests.length = 0;
    respond = (config) =>
      config.method === "get"
        ? { token: "new-token" }
        : config.headers.get("X-CSRF-Token") === "expired-token"
          ? { status: 403, data: { error: "CSRF validation failed." } }
          : { data: { status: true } };
    expect(await postJson("/api/register")).toEqual({ status: true });
    expect(requests.map((config) => config.url)).toEqual([
      "/api/register",
      "/api/me",
      "/api/register",
    ]);
    expect(requests[2]!.headers.get("X-CSRF-Token")).toBe("new-token");
  });

  test("stops after one CSRF retry", async () => {
    respond = (config) =>
      config.method === "get"
        ? { token: "token" }
        : { status: 403, data: { error: "CSRF validation failed." } };
    await expect(postJson("/api/register")).rejects.toBeInstanceOf(ApiError);
    expect(requests.filter((config) => config.method === "post")).toHaveLength(2);
  });

  test("does not retry permission failures or other registration errors", async () => {
    for (const status of [400, 403, 409, 500]) {
      clearCsrfToken();
      requests.length = 0;
      respond = (config) =>
        config.method === "get" ? { token: "token" } : { status, data: { error: "Other error" } };
      await expect(postJson("/api/register")).rejects.toMatchObject({ status });
      expect(requests.filter((config) => config.method === "post")).toHaveLength(1);
    }
  });

  test("does not submit a mutation if bootstrap has no token", async () => {
    respond = () => ({});
    await expect(postJson("/api/register")).rejects.toBeInstanceOf(ApiError);
    expect(requests.map((config) => config.url)).toEqual(["/api/me"]);
  });
});

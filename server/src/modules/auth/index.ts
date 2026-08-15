import type { ModuleManifest } from "../module.types.js";
import { authApiRouter, authOauthRouter } from "./auth.routes.js";

/**
 * Auth module manifest.
 *
 * Exposes two routers:
 *   - /api  → local auth endpoints (login, register, logout, me, profile)
 *   - /auth → Google OAuth endpoints (google, google/callback, google/failure)
 *
 * The underlying auth.routes.ts is NOT modified by this file.
 */
export const authModule: ModuleManifest = {
  name: "Auth",
  routes: [
    { prefix: "/api", router: authApiRouter },
    { prefix: "/auth", router: authOauthRouter },
  ],
};

import type { ModuleManifest } from "../module.types.js";
import { supportRouter } from "./support.routes.js";

/**
 * Support module manifest.
 *
 * Exposes: POST /api/support/chat  (Groq AI assistant).
 *
 * The underlying support.routes.ts is NOT modified by this file.
 */
export const supportModule: ModuleManifest = {
  name: "Support",
  routes: [{ prefix: "/api/support", router: supportRouter }],
};

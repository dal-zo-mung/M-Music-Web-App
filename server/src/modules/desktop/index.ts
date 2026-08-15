import type { ModuleManifest } from "../module.types.js";
import { desktopPublicRouter, desktopAdminRouter } from "./desktop.routes.js";
import { seedLegalDocuments } from "./legal.model.js";

// Seed default legal documents on startup (no-op if already seeded)
seedLegalDocuments().catch((err: unknown) => {
  console.error("[Desktop module] Failed to seed legal documents:", err);
});

/**
 * Desktop module manifest.
 *
 * Public routes  → /api/desktop/*   (Desktop app calls these)
 * Admin routes   → /api/admin/desktop/* (Admin Dashboard calls these)
 */
export const desktopModule: ModuleManifest = {
  name: "Desktop",
  routes: [
    { prefix: "/api/desktop", router: desktopPublicRouter },
    { prefix: "/api/admin/desktop", router: desktopAdminRouter },
  ],
};

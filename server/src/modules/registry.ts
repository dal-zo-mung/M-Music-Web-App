import type { ModuleManifest } from "./module.types.js";
import { authModule } from "./auth/index.js";
import { songsModule } from "./songs/index.js";
import { communityModule } from "./community/index.js";
import { supportModule } from "./support/index.js";
import { healthModule } from "./health/index.js";
import { adminModule } from "./admin/index.js";
import { desktopModule } from "./desktop/index.js";

// ─────────────────────────────────────────────────────────────────────────────
// MODULE REGISTRY
// ─────────────────────────────────────────────────────────────────────────────
// This is the ONLY file you ever edit when adding a new backend feature.
//
// HOW TO ADD A NEW FEATURE:
//   1. Create folder:  server/src/modules/<your-feature>/
//   2. Build it:       your-feature.routes.ts, controller, service, model, etc.
//   3. Export manifest: create index.ts → export const yourModule: ModuleManifest
//   4. Register below: import it and append to the array.
//
// app.ts will automatically mount all routes — no changes needed there.
// ─────────────────────────────────────────────────────────────────────────────

export const moduleRegistry: ModuleManifest[] = [
  authModule,
  songsModule,
  communityModule,
  supportModule,
  healthModule,
  adminModule,
  desktopModule,

  // ← Add new modules here
];

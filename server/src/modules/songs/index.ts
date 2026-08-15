import type { ModuleManifest } from "../module.types.js";
import { songsRouter } from "./song.routes.js";

/**
 * Songs module manifest.
 *
 * Exposes: GET /api/songs, GET /api/songs/search/:query,
 *          GET /api/songs/:id, favorites endpoints.
 *
 * The underlying song.routes.ts is NOT modified by this file.
 */
export const songsModule: ModuleManifest = {
  name: "Songs",
  routes: [{ prefix: "/api/songs", router: songsRouter }],
};

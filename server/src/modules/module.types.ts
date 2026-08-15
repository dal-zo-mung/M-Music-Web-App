import type { Router } from "express";

/**
 * A single route entry — one prefix mounted to one Express Router.
 */
export interface ModuleRoute {
  /** The URL prefix this router is mounted at, e.g. '/api/songs' */
  prefix: string;
  /** The Express Router instance */
  router: Router;
}

/**
 * The manifest every feature module must export from its index.ts.
 *
 * Example:
 *   export const myModule: ModuleManifest = {
 *     name: 'MyFeature',
 *     routes: [{ prefix: '/api/my-feature', router: myRouter }],
 *   };
 *
 * Then register it in server/src/modules/registry.ts — nothing else to touch.
 */
export interface ModuleManifest {
  /** Human-readable name used for logging at startup */
  name: string;
  /** One or more route entries this module exposes */
  routes: ModuleRoute[];
}

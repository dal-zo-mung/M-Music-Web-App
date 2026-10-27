import type React from "react";

/**
 * The manifest for pages listed in client/src/registry-page.ts.
 *
 * Example:
 *   {
 *     path: '/playlists',
 *     component: lazy(() => import('./PlaylistPage').then(m => ({ default: m.PlaylistPage }))),
 *   }
 *
 * Then add it to client/src/registry-page.ts.
 */
export interface PageManifest {
  /** React Router path pattern, e.g. '/songs/:songId' */
  path: string;
  /** Lazy-loaded page component */
  component: React.LazyExoticComponent<React.ComponentType>;
}

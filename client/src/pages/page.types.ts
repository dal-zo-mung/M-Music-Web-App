import type React from 'react';

/**
 * The manifest every page must have an entry for in pages/registry.ts.
 *
 * Example:
 *   {
 *     path: '/playlists',
 *     component: lazy(() => import('./PlaylistPage').then(m => ({ default: m.PlaylistPage }))),
 *     showInNav: true,
 *     navLabel: 'Playlists',
 *   }
 *
 * Then add it to client/src/pages/registry.ts — router.tsx never needs editing.
 */
export interface PageManifest {
  /** React Router path pattern, e.g. '/songs/:songId' */
  path: string;
  /** Lazy-loaded page component */
  component: React.LazyExoticComponent<React.ComponentType>;
  /** If true, this page link appears in the Header navigation */
  showInNav?: boolean;
  /** Label shown in the nav link (required when showInNav is true) */
  navLabel?: string;
}

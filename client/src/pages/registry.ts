import { lazy } from 'react';
import type { PageManifest } from './page.types';

// ─────────────────────────────────────────────────────────────────────────────
// PAGE REGISTRY
// ─────────────────────────────────────────────────────────────────────────────
// This is the ONLY file you ever edit when adding a new page or route.
//
// HOW TO ADD A NEW PAGE:
//   1. Create file:  client/src/pages/MyNewPage.tsx
//   2. Export your component from it (e.g. export function MyNewPage() { ... })
//   3. Add an entry below with the path and lazy import.
//
// router.tsx will automatically pick it up — no changes needed there.
// ─────────────────────────────────────────────────────────────────────────────

export const pageRegistry: PageManifest[] = [
  {
    path: '/',
    component: lazy(() => import('./HomePage').then((m) => ({ default: m.HomePage }))),
  },
  {
    path: '/search',
    component: lazy(() => import('./SearchPage').then((m) => ({ default: m.SearchPage }))),
  },
  {
    path: '/songs/:songId',
    component: lazy(() => import('./SongPage').then((m) => ({ default: m.SongPage }))),
  },
  {
    path: '/login',
    component: lazy(() => import('./LoginPage').then((m) => ({ default: m.LoginPage }))),
  },
  {
    path: '/register',
    component: lazy(() => import('./RegisterPage').then((m) => ({ default: m.RegisterPage }))),
  },
  {
    path: '/community',
    component: lazy(() => import('./CommunityPage').then((m) => ({ default: m.CommunityPage }))),
  },
  {
    path: '/community/:submissionId',
    component: lazy(() =>
      import('./CommunityThreadPage').then((m) => ({ default: m.CommunityThreadPage }))
    ),
  },
  {
    path: '/profile',
    component: lazy(() => import('./ProfilePage').then((m) => ({ default: m.ProfilePage }))),
  },
  {
    path: '/download',
    component: lazy(() => import('./DownloadPage').then((m) => ({ default: m.DownloadPage }))),
  },
  // ← Add new pages here
];

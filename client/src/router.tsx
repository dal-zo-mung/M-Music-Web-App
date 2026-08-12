import { Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import { SiteLayout } from './components/SiteLayout';
import { pageRegistry } from './pages/registry';

// ─────────────────────────────────────────────────────────────────────────────
// ROUTER
// ─────────────────────────────────────────────────────────────────────────────
// This file is auto-driven — do NOT add routes here directly.
//
// TO ADD A NEW PAGE:
//   1. Create  client/src/zpages/MyNewPage.tsx
//   2. Add an entry in client/src/pages/registry.ts
//   3. Done. This file never needs to be opened again.
// ─────────────────────────────────────────────────────────────────────────────

export const router = createBrowserRouter([
  {
    element: <SiteLayout />,
    children: pageRegistry.map(({ path, component: Page }) => ({
      path,
      element: (
        <Suspense fallback={<div className="route-loading">Loading...</div>}>
          <Page />
        </Suspense>
      ),
    })),
  },
]);

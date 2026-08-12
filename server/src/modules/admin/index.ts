import type { ModuleManifest } from '../module.types.js';
import { adminRouter } from './admin.routes.js';

/**
 * Admin module manifest.
 *
 * Exposes all admin-only endpoints under /api/admin.
 * Every route is gated by the requireAdmin middleware.
 */
export const adminModule: ModuleManifest = {
  name: 'Admin',
  routes: [
    { prefix: '/api/admin', router: adminRouter },
  ],
};

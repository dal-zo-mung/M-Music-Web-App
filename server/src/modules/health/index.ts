import type { ModuleManifest } from '../module.types.js';
import { healthRouter } from './health.routes.js';

/**
 * Health module manifest.
 *
 * Exposes: GET /api/health
 *
 * This module demonstrates the plugin registry pattern:
 * it was added by creating two new files and one registry line —
 * zero existing files were modified.
 */
export const healthModule: ModuleManifest = {
  name: 'Health',
  routes: [
    { prefix: '/api/health', router: healthRouter },
  ],
};

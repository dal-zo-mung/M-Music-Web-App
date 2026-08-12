import type { ModuleManifest } from '../module.types.js';
import { communityRouter } from './community.routes.js';

/**
 * Community module manifest.
 *
 * Exposes: GET/POST /api/community/submissions,
 *          GET /api/community/submissions/:id,
 *          POST /api/community/submissions/:id/comments.
 *
 * The underlying community.routes.ts is NOT modified by this file.
 */
export const communityModule: ModuleManifest = {
  name: 'Community',
  routes: [
    { prefix: '/api/community', router: communityRouter },
  ],
};

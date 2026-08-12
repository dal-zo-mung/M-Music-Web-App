import express from 'express';

export const healthRouter = express.Router();

/**
 * GET /api/health
 *
 * Simple health-check endpoint.
 * Returns 200 when the server is running.
 * Useful for deployment health probes and monitoring.
 */
healthRouter.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: 'M-Music API',
    timestamp: new Date().toISOString(),
  });
});

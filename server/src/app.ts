import fs from 'node:fs';
import path from 'node:path';

import cors from 'cors';
import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import morgan from 'morgan';
import MongoStore from 'connect-mongo';
import passport from 'passport';

import { env } from './config/env.js';
import { initializePassport } from './config/passport.js';
import { moduleRegistry } from './modules/registry.js';
import { errorHandler } from './modules/shared/middleware/error.js';
import { apiReadLimiter, apiWriteLimiter } from './modules/shared/middleware/rate-limit.js';
import { ensureCsrfTokenCookie, rejectDangerousRequestKeys } from './modules/shared/middleware/request-security.js';

const contentSecurityPolicyDirectives = {
  baseUri: ["'self'"],
  connectSrc: ["'self'"],
  defaultSrc: ["'self'"],
  fontSrc: ["'self'", 'data:'],
  frameAncestors: ["'none'"],
  formAction: ["'self'"],
  imgSrc: ["'self'", 'data:', 'https:'],
  objectSrc: ["'none'"],
  scriptSrc: ["'self'"],
  styleSrc: ["'self'"]
};

if (env.isProduction) {
  Object.assign(contentSecurityPolicyDirectives, {
    upgradeInsecureRequests: []
  });
}

export function createApp() {
  const app = express();
  const projectRoot = process.cwd();
  const clientDistDir = path.join(projectRoot, 'dist', 'client');
  const clientIndexFile = path.join(clientDistDir, 'index.html');
  const legacyPublicDir = path.join(projectRoot, 'public');

  app.disable('x-powered-by');

  if (env.isProduction) {
    app.set('trust proxy', 1);
  }

  app.use(morgan('dev'));

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: contentSecurityPolicyDirectives,
        useDefaults: true
      }
    })
  );

  app.use(
    cors({
      allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'X-Requested-With'],
      credentials: true,
      methods: ['GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST'],
      optionsSuccessStatus: 204,
      origin(origin, callback) {
        if (!origin) {
          callback(null, true);
          return;
        }

        callback(null, env.corsAllowedOrigins.has(origin));
      }
    })
  );

  app.use(express.json({ limit: '50kb' }));
  app.use(express.urlencoded({ extended: false, limit: '50kb' }));

  app.use(
    session({
      cookie: {
        httpOnly: true,
        maxAge: 14 * 24 * 60 * 60 * 1000,
        sameSite: 'lax',
        secure: env.isProduction
      },
      name: env.sessionCookieName,
      resave: false,
      saveUninitialized: false,
      secret: env.sessionSecret,
      store: MongoStore.create({
        autoRemove: 'native',
        mongoUrl: env.mongodbUrl,
        ttl: 14 * 24 * 60 * 60
      })
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());
  app.use(ensureCsrfTokenCookie);
  app.use(rejectDangerousRequestKeys);

  initializePassport();

  app.get('/api/test', (_req, res) => {
    res.json({ success: true });
  });

  app.use('/api', (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      apiReadLimiter(req, res, next);
      return;
    }

    apiWriteLimiter(req, res, next);
  });

  // Auto-mount all registered modules.
  // To add a new feature, edit server/src/modules/registry.ts only.
  for (const mod of moduleRegistry) {
    for (const route of mod.routes) {
      app.use(route.prefix, route.router);
    }
  }

  if (fs.existsSync(clientDistDir)) {
    app.use(express.static(clientDistDir, { maxAge: env.isProduction ? '7d' : 0 }));
  }

  if (fs.existsSync(legacyPublicDir)) {
    app.use(express.static(legacyPublicDir, { maxAge: env.isProduction ? '7d' : 0 }));
  }

  app.use('/api', (_req, res) => {
    res.status(404).json({
      error: 'Not Found',
      status: 404,
      success: false
    });
  });

  if (fs.existsSync(clientIndexFile)) {
    app.get(/^(?!\/api|\/auth).*/, (_req, res) => {
      res.sendFile(clientIndexFile);
    });
  }

  app.use(errorHandler);

  return app;
}

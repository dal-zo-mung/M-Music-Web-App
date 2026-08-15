import crypto from "node:crypto";
import type { RequestHandler } from "express";

import { env } from "../../../config/env.js";
import { assertNoDangerousKeys } from "../security/input.js";

function getExpectedOrigins(host: string, protocol: string): Set<string> {
  return new Set([`${protocol}://${host}`, ...env.corsAllowedOrigins]);
}

export const ensureCsrfTokenCookie: RequestHandler = (req, res, next) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString("hex");
  }

  res.cookie(env.csrfCookieName, req.session.csrfToken, {
    httpOnly: false,
    path: "/",
    sameSite: "strict",
    secure: env.isProduction,
  });

  next();
};

export const rejectDangerousRequestKeys: RequestHandler = (req, _res, next) => {
  try {
    assertNoDangerousKeys(req.body, "body");
    assertNoDangerousKeys(req.query, "query");
    next();
  } catch (error) {
    next(error);
  }
};

export const requireTrustedOrigin: RequestHandler = (req, res, next) => {
  const origin = req.get("origin");
  const referer = req.get("referer");
  const expectedOrigins = getExpectedOrigins(
    req.get("host") ?? "",
    req.protocol,
  );

  if (origin) {
    if (!expectedOrigins.has(origin)) {
      res.status(403).json({
        error: "Request origin is not allowed.",
        status: 403,
        success: false,
      });
      return;
    }

    next();
    return;
  }

  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;

      if (!expectedOrigins.has(refererOrigin)) {
        res.status(403).json({
          error: "Request origin is not allowed.",
          status: 403,
          success: false,
        });
        return;
      }
    } catch {
      res.status(403).json({
        error: "Request origin is not allowed.",
        status: 403,
        success: false,
      });
      return;
    }
  }

  next();
};

export const requireCsrfToken: RequestHandler = (req, res, next) => {
  const csrfToken = req.get("x-csrf-token");

  if (
    !csrfToken ||
    !req.session.csrfToken ||
    csrfToken !== req.session.csrfToken
  ) {
    res.status(403).json({
      error: "CSRF validation failed.",
      status: 403,
      success: false,
    });
    return;
  }

  next();
};

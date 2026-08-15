import express from "express";
import passport from "passport";

import {
  finishGoogleAuth,
  getCurrentUser,
  googleFailure,
  login,
  logoutJson,
  register,
  startGoogleAuth,
  updateProfile,
} from "./auth.controller.js";
import type { UserDocument } from "./user.model.js";
import { authWriteLimiter } from "./auth.rate-limit.js";
import { requireAuthenticatedUser } from "./auth.guard.js";
import {
  requireCsrfToken,
  requireTrustedOrigin,
} from "../shared/middleware/request-security.js";
import {
  loginSchema,
  profileUpdateSchema,
  registerSchema,
  validateRequest,
} from "../shared/middleware/validation.js";

export const authApiRouter = express.Router();
export const authOauthRouter = express.Router();

authApiRouter.get("/me", getCurrentUser);
authApiRouter.patch(
  "/me/profile",
  requireTrustedOrigin,
  requireCsrfToken,
  requireAuthenticatedUser,
  authWriteLimiter,
  validateRequest(profileUpdateSchema),
  updateProfile,
);
authApiRouter.post(
  "/logout",
  requireTrustedOrigin,
  requireCsrfToken,
  logoutJson,
);
authApiRouter.post(
  "/register",
  requireTrustedOrigin,
  requireCsrfToken,
  authWriteLimiter,
  validateRequest(registerSchema),
  register,
);
authApiRouter.post(
  "/login",
  requireTrustedOrigin,
  requireCsrfToken,
  authWriteLimiter,
  validateRequest(loginSchema),
  login,
);

authOauthRouter.get("/google", startGoogleAuth);
authOauthRouter.get("/google/callback", (req, res, next) => {
  passport.authenticate(
    "google",
    (
      error: Error | null | undefined,
      account: UserDocument | false | null | undefined,
    ) => {
      if (error) {
        res.redirect(302, "/login?error=google-auth-error");
        return;
      }

      if (!account) {
        res.redirect(302, "/login?error=google-login-failed");
        return;
      }

      req.logIn(account, (loginError) => {
        if (loginError) {
          console.error("Google OAuth session error", loginError);
          res.redirect(302, "/login?error=google-session-error");
          return;
        }

        finishGoogleAuth(req, res);
      });
    },
  )(req, res, next);
});
authOauthRouter.get("/google/failure", googleFailure);

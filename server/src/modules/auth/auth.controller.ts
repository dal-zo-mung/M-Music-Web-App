import mongoose from "mongoose";
import passport from "passport";
import type { NextFunction, Request, Response } from "express";

import { env } from "../../config/env.js";
import {
  applyProfileUpdates,
  hashPassword,
  incrementFailedLoginAttempts,
  isLegacyScryptHash,
  isUserLockedOut,
  resetFailedLoginAttempts,
  toPublicUser,
  verifyPassword,
} from "./auth.service.js";
import { UserModel } from "./user.model.js";

function isSafeReturnPath(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//")
  );
}

function resolveSafeReturnTo(value: unknown, fallback = "/"): string {
  return isSafeReturnPath(value) ? value : fallback;
}

function createLocalSession(req: Request, userId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) {
        reject(error);
        return;
      }

      req.session.userId = userId;
      resolve();
    });
  });
}

function completeLogout(
  req: Request,
  res: Response,
  next: NextFunction,
  options: { json?: boolean } = {},
): void {
  function clearAuthCookies(): void {
    res.clearCookie(env.sessionCookieName, { path: "/" });
    res.clearCookie(env.csrfCookieName, { path: "/" });
  }

  function respondSuccess(): void {
    clearAuthCookies();
    if (options.json) {
      res.json({ success: true });
    } else {
      res.redirect("/");
    }
  }

  function destroySession(): void {
    if (!req.session) {
      respondSuccess();
      return;
    }

    req.session.destroy((sessionError) => {
      if (sessionError) {
        next(sessionError);
        return;
      }

      respondSuccess();
    });
  }

  req.logout((logoutError) => {
    if (logoutError) {
      console.warn(
        "Passport logout (continuing to destroy session):",
        logoutError,
      );
    }

    destroySession();
  });
}

export function startGoogleAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  let returnTo = "";
  const requestedReturnTo =
    typeof req.query.returnTo === "string" ? req.query.returnTo : "";

  if (isSafeReturnPath(requestedReturnTo)) {
    returnTo = requestedReturnTo;
  } else if (req.headers.referer) {
    try {
      const refererUrl = new URL(req.headers.referer);
      const origin = `${req.protocol}://${req.get("host")}`;

      if (refererUrl.origin === origin) {
        returnTo = resolveSafeReturnTo(
          `${refererUrl.pathname}${refererUrl.search}`,
          "",
        );
      }
    } catch {
      returnTo = "";
    }
  }

  if (returnTo) {
    req.session.returnTo = returnTo;
  }

  passport.authenticate("google", {
    ...(returnTo ? { state: encodeURIComponent(returnTo) } : {}),
    scope: ["profile", "email"],
  })(req, res, next);
}

export function finishGoogleAuth(req: Request, res: Response): void {
  let redirectTo = resolveSafeReturnTo(req.session.returnTo ?? "/");

  if (typeof req.query.state === "string") {
    try {
      redirectTo = resolveSafeReturnTo(
        decodeURIComponent(req.query.state),
        redirectTo,
      );
    } catch {
      redirectTo = resolveSafeReturnTo(req.session.returnTo ?? "/", "/");
    }
  }

  delete req.session.returnTo;
  res.redirect(redirectTo);
}

export function googleFailure(_req: Request, res: Response): void {
  res.status(401).json({
    message: "Google authentication failed.",
    success: false,
  });
}

export function logout(req: Request, res: Response, next: NextFunction): void {
  completeLogout(req, res, next);
}

export function logoutJson(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  completeLogout(req, res, next, { json: true });
}

export async function getCurrentUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const passportUser = req.user as typeof UserModel.prototype | undefined;

    if (passportUser) {
      res.json({ authenticated: true, user: toPublicUser(passportUser) });
      return;
    }

    const sessionUserId = req.session.userId;

    if (!sessionUserId || !mongoose.isValidObjectId(sessionUserId)) {
      delete req.session.userId;
      res.json({ authenticated: false });
      return;
    }

    const user = await UserModel.findById(sessionUserId).exec();

    if (!user) {
      delete req.session.userId;
      res.json({ authenticated: false });
      return;
    }

    res.json({ authenticated: true, user: toPublicUser(user) });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = req.currentUser;

    if (!user) {
      res.status(401).json({
        message: "Authentication is required.",
        success: false,
      });
      return;
    }

    applyProfileUpdates(user, req.body);
    await user.save();
    res.json({ success: true, user: toPublicUser(user) });
  } catch (error) {
    next(error);
  }
}

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { firstName, lastName, password, username } = req.body;
    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    const existingUser = await UserModel.findOne({ username }).exec();

    if (existingUser) {
      res.status(409).json({
        message: "That username is already taken.",
        success: false,
      });
      return;
    }

    if (email) {
      const existingEmail = await UserModel.findOne({ email }).exec();
      if (existingEmail) {
        res.status(409).json({
          message: "That email is already registered.",
          success: false,
        });
        return;
      }
    }

    const user = await UserModel.create({
      email,
      firstName,
      lastName,
      password: hashPassword(password),
      username,
    });

    await createLocalSession(req, String(user._id));
    res.status(201).json({ success: true, user: toPublicUser(user) });
  } catch (error) {
    next(error);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { password, username } = req.body;
    const user = await UserModel.findOne(
      mongoose.trusted({
        $or: [{ username: username }, { email: username.toLowerCase() }],
      }),
    ).exec();

    if (!user || !user.password) {
      res.status(401).json({
        message: "Invalid username or password.",
        success: false,
      });
      return;
    }

    if (isUserLockedOut(user)) {
      res.status(429).json({
        message:
          "Account is temporarily locked due to too many failed login attempts.",
        success: false,
      });
      return;
    }

    if (!verifyPassword(password, user.password)) {
      incrementFailedLoginAttempts(user);
      await user.save();
      res.status(401).json({
        message: "Invalid username or password.",
        success: false,
      });
      return;
    }

    resetFailedLoginAttempts(user);

    if (isLegacyScryptHash(user.password)) {
      user.password = hashPassword(password);
      await user.save();
    }

    await createLocalSession(req, String(user._id));
    res.json({ success: true, user: toPublicUser(user) });
  } catch (error) {
    next(error);
  }
}

import type { RequestHandler } from "express";

import { resolveCurrentUser } from "../auth/auth.guard.js";

export const requireAdmin: RequestHandler = async (req, res, next) => {
  try {
    const user = await resolveCurrentUser(req);

    if (!user) {
      res.status(401).json({
        error: "Authentication is required.",
        status: 401,
        success: false,
      });
      return;
    }

    if (user.role !== "admin") {
      res.status(403).json({
        error: "Admin access required.",
        status: 403,
        success: false,
      });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};

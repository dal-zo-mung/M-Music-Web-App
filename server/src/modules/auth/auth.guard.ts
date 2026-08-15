import mongoose from "mongoose";
import type { RequestHandler } from "express";

import { UserModel, type UserDocument } from "./user.model.js";

export async function resolveCurrentUser(
  req: Express.Request,
): Promise<UserDocument | null> {
  if (req.currentUser) {
    return req.currentUser;
  }

  if (req.user && typeof req.user === "object") {
    req.currentUser = req.user as UserDocument;
    return req.currentUser;
  }

  const sessionUserId = req.session.userId;

  if (!sessionUserId || !mongoose.isValidObjectId(sessionUserId)) {
    return null;
  }

  const user = await UserModel.findById(sessionUserId).exec();

  if (!user) {
    delete req.session.userId;
    return null;
  }

  req.currentUser = user;
  return user;
}

export const requireAuthenticatedUser: RequestHandler = async (
  req,
  res,
  next,
) => {
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

    next();
  } catch (error) {
    next(error);
  }
};

import "express-session";
import type { UserDocument } from "../modules/auth/user.model.js";

declare module "express-session" {
  interface SessionData {
    csrfToken?: string;
    returnTo?: string;
    userId?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      currentUser?: UserDocument;
    }
  }
}

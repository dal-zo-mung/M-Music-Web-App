import { Router } from "express";
import {
  guestHandler,
  meHandler,
  googleInitHandler,
  googlePollHandler,
  googleCallbackHandler,
  linkGoogleHandler,
} from "./desktop-auth.controller.js";

export const desktopAuthRouter = Router();

// Guest registration / re-identification
desktopAuthRouter.post("/guest", guestHandler);

// Get current desktop user
desktopAuthRouter.get("/me", meHandler);

// Google OAuth flow for desktop
desktopAuthRouter.post("/google/init", googleInitHandler);
desktopAuthRouter.get("/google/poll", googlePollHandler);
desktopAuthRouter.get("/google/callback", googleCallbackHandler);

// Upgrade guest → Google
desktopAuthRouter.post("/link-google", linkGoogleHandler);

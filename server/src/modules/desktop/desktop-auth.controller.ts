import type { Request, Response, NextFunction } from 'express';
import {
  registerGuest,
  getDesktopUser,
  initGoogleAuth,
  pollGoogleAuth,
  completeGoogleAuth,
  linkGoogleToGuest
} from './desktop-auth.service.js';
import { env } from '../../config/env.js';

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

function asyncHandler(fn: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

/**
 * POST /api/desktop/auth/guest
 * Register or re-identify a guest user by deviceId.
 */
export const guestHandler = asyncHandler(async (req, res) => {
  const user = await registerGuest(req.body.deviceId);
  res.json({ success: true, user });
});

/**
 * GET /api/desktop/auth/me?deviceId=...
 * Returns the current desktop user profile for a device.
 */
export const meHandler = asyncHandler(async (req, res) => {
  const user = await getDesktopUser(req.query.deviceId);
  res.json({ success: true, user });
});

/**
 * POST /api/desktop/auth/google/init
 * Start Google OAuth — returns URL for external browser + exchange token.
 */
export const googleInitHandler = asyncHandler(async (req, res) => {
  const result = initGoogleAuth(req.body.deviceId);
  res.json({ success: true, ...result });
});

/**
 * GET /api/desktop/auth/google/poll?token=...
 * Desktop polls this to check if the Google OAuth flow completed.
 */
export const googlePollHandler = asyncHandler(async (req, res) => {
  const result = pollGoogleAuth(req.query.token);
  res.json(result);
});

/**
 * GET /api/desktop/auth/google/callback?code=...&state=...
 * Google redirects here after consent. Exchanges code for user info,
 * then marks the pending flow as complete.
 */
export const googleCallbackHandler = asyncHandler(async (req, res) => {
  const { code, state } = req.query;

  if (typeof code !== 'string' || typeof state !== 'string') {
    res.status(400).send('Missing code or state parameter.');
    return;
  }

  // Exchange the authorization code for tokens
  const callbackUrl = env.googleCallbackUrl || '/auth/google/callback';
  const redirectUri = `${callbackUrl.replace('/auth/google/callback', '')}/api/desktop/auth/google/callback`;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.googleClientId,
      client_secret: env.googleClientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })
  });

  if (!tokenResponse.ok) {
    res.status(502).send('Failed to exchange authorization code.');
    return;
  }

  const tokenData = (await tokenResponse.json()) as { access_token: string };

  // Fetch user info from Google
  const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` }
  });

  if (!userInfoResponse.ok) {
    res.status(502).send('Failed to fetch user information from Google.');
    return;
  }

  const userInfo = (await userInfoResponse.json()) as {
    id: string;
    email: string;
    name: string;
    picture: string;
  };

  // Complete the auth flow
  await completeGoogleAuth(state, {
    googleId: userInfo.id,
    email: userInfo.email,
    displayName: userInfo.name,
    profileImage: userInfo.picture
  });

  // Show a success page that the user can close
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>M-Music — Login Complete</title>
    <style>
      body { font-family: system-ui, sans-serif; background: #0f0f10; color: #fff; display: flex;
             align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
      .box { max-width: 400px; }
      h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
      p { color: #94a3b8; font-size: 0.9rem; }
      .check { font-size: 3rem; margin-bottom: 1rem; }
    </style>
    </head>
    <body>
      <div class="box">
        <div class="check">✓</div>
        <h1>Login Successful!</h1>
        <p>You are now signed in with Google.<br>You can close this tab and return to M-Music.</p>
      </div>
    </body>
    </html>
  `);
});

/**
 * POST /api/desktop/auth/link-google
 * Upgrade a guest to Google — starts a new OAuth flow for an existing guest device.
 */
export const linkGoogleHandler = asyncHandler(async (req, res) => {
  const result = await linkGoogleToGuest(req.body.deviceId);
  res.json({ success: true, ...result });
});

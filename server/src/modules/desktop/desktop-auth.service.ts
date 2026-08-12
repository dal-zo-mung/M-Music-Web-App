import crypto from 'node:crypto';
import type { DesktopUserProfile } from '../../../../shared/types.js';
import { UserModel, type UserDocument } from '../auth/user.model.js';
import { env } from '../../config/env.js';

type HttpError = Error & { statusCode?: number };

function httpError(message: string, statusCode: number): HttpError {
  const error = new Error(message) as HttpError;
  error.statusCode = statusCode;
  return error;
}

// ── Pending OAuth flows (in-memory, short-lived) ──────────────

interface PendingOAuth {
  deviceId: string;
  createdAt: number;
  completedUser?: DesktopUserProfile;
}

/** Map<token, PendingOAuth>. Entries expire after 10 minutes. */
const pendingOAuthFlows = new Map<string, PendingOAuth>();

const OAUTH_TTL_MS = 10 * 60 * 1000;

function pruneExpiredFlows(): void {
  const now = Date.now();
  for (const [token, flow] of pendingOAuthFlows) {
    if (now - flow.createdAt > OAUTH_TTL_MS) {
      pendingOAuthFlows.delete(token);
    }
  }
}

// ── Helpers ────────────────────────────────────────────────────

function toDesktopUserProfile(user: UserDocument): DesktopUserProfile {
  return {
    id: String(user._id),
    authMethod: user.googleId ? 'google' : 'guest',
    email: user.email ?? null,
    displayName: user.displayName ?? null,
    profileImage: user.profileImage ?? null
  };
}

function validateDeviceId(deviceId: unknown): string {
  if (typeof deviceId !== 'string' || deviceId.trim().length < 8 || deviceId.trim().length > 128) {
    throw httpError('A valid deviceId is required.', 400);
  }
  return deviceId.trim();
}

// ── Service Functions ──────────────────────────────────────────

/**
 * Register or re-identify a guest user by device ID.
 * If the device already exists, returns the existing user.
 */
export async function registerGuest(rawDeviceId: unknown): Promise<DesktopUserProfile> {
  const deviceId = validateDeviceId(rawDeviceId);

  const existing = await UserModel.findOne({ deviceId }).exec();
  if (existing) {
    return toDesktopUserProfile(existing);
  }

  const user = await UserModel.create({
    deviceId,
    source: 'desktop',
    role: 'user',
    displayName: 'Guest User'
  });

  return toDesktopUserProfile(user);
}

/**
 * Look up the current desktop user by device ID.
 */
export async function getDesktopUser(rawDeviceId: unknown): Promise<DesktopUserProfile | null> {
  const deviceId = validateDeviceId(rawDeviceId);
  const user = await UserModel.findOne({ deviceId }).exec();
  return user ? toDesktopUserProfile(user) : null;
}

/**
 * Start a Google OAuth flow for the desktop app.
 * Returns the URL to open in the external browser and an exchange token.
 */
export function initGoogleAuth(rawDeviceId: unknown): { authUrl: string; token: string } {
  const deviceId = validateDeviceId(rawDeviceId);

  if (!env.googleClientId) {
    throw httpError('Google OAuth is not configured on this server.', 503);
  }

  pruneExpiredFlows();

  const token = crypto.randomBytes(32).toString('hex');
  pendingOAuthFlows.set(token, { deviceId, createdAt: Date.now() });

  const callbackUrl = env.googleCallbackUrl || '/auth/google/callback';

  // Build the Google OAuth consent URL with the token in state
  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', env.googleClientId);
  googleAuthUrl.searchParams.set('redirect_uri', `${callbackUrl.replace('/auth/google/callback', '')}/api/desktop/auth/google/callback`);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', 'openid email profile');
  googleAuthUrl.searchParams.set('access_type', 'offline');
  googleAuthUrl.searchParams.set('prompt', 'select_account');
  googleAuthUrl.searchParams.set('state', token);

  return { authUrl: googleAuthUrl.toString(), token };
}

/**
 * Poll to check if a pending OAuth flow has completed.
 */
export function pollGoogleAuth(token: unknown): { status: 'pending' | 'complete'; user?: DesktopUserProfile } {
  if (typeof token !== 'string' || !token.trim()) {
    throw httpError('Token is required.', 400);
  }

  pruneExpiredFlows();
  const flow = pendingOAuthFlows.get(token.trim());

  if (!flow) {
    throw httpError('Token expired or invalid.', 404);
  }

  if (flow.completedUser) {
    pendingOAuthFlows.delete(token.trim());
    return { status: 'complete', user: flow.completedUser };
  }

  return { status: 'pending' };
}

/**
 * Called by the Google OAuth callback to complete the desktop auth flow.
 * Finds or creates the user, links to the device, marks the flow as complete.
 */
export async function completeGoogleAuth(
  token: string,
  googleProfile: { googleId: string; email: string; displayName: string; profileImage: string }
): Promise<void> {
  const flow = pendingOAuthFlows.get(token);
  if (!flow) {
    throw httpError('Token expired or invalid.', 404);
  }

  const { deviceId } = flow;

  // Check if this Google account already has a user record
  let user = await UserModel.findOne({ googleId: googleProfile.googleId }).exec();

  if (user) {
    // Update the user with desktop info if they came from web
    if (!user.deviceId) {
      user.deviceId = deviceId;
    }
    if (user.source === 'web') {
      user.source = 'desktop';
    }
    user.displayName = googleProfile.displayName;
    user.profileImage = googleProfile.profileImage;
    user.email = googleProfile.email;
    await user.save();
  } else {
    // Check if a guest user with this deviceId exists, upgrade them
    user = await UserModel.findOne({ deviceId }).exec();

    if (user) {
      user.googleId = googleProfile.googleId;
      user.email = googleProfile.email;
      user.displayName = googleProfile.displayName;
      user.profileImage = googleProfile.profileImage;
      await user.save();
    } else {
      // Create a new desktop user
      user = await UserModel.create({
        deviceId,
        source: 'desktop',
        role: 'user',
        googleId: googleProfile.googleId,
        email: googleProfile.email,
        displayName: googleProfile.displayName,
        profileImage: googleProfile.profileImage
      });
    }
  }

  flow.completedUser = toDesktopUserProfile(user);
}

/**
 * Upgrade a guest user to Google auth.
 * Opens a new OAuth flow for an existing guest device.
 */
export async function linkGoogleToGuest(rawDeviceId: unknown): Promise<{ authUrl: string; token: string }> {
  const deviceId = validateDeviceId(rawDeviceId);

  const existing = await UserModel.findOne({ deviceId }).exec();
  if (!existing) {
    throw httpError('No user found for this device.', 404);
  }

  if (existing.googleId) {
    throw httpError('This device is already linked to a Google account.', 409);
  }

  // Start a fresh OAuth flow for this device
  return initGoogleAuth(deviceId);
}

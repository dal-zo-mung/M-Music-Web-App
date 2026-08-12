import bcrypt from 'bcrypt';
import { scryptSync, timingSafeEqual } from 'node:crypto';

import type { ProfileAccent, ProfileUpdateRequest, PublicUser } from '../../../../shared/types.js';
import { PROFILE_ACCENTS } from '../../../../shared/types.js';
import { normalizePlainText } from '../shared/security/input.js';
import type { UserDocument } from './user.model.js';

const PASSWORD_HASH_KEY_LENGTH = 64;
const MAX_NAME_LENGTH = 50;
const MAX_PASSWORD_LENGTH = 128;
const USERNAME_PATTERN = /^(?=.{3,30}$)[a-z0-9._-]+$/;

export interface LoginPayload {
  password: string;
  username: string;
}

export interface RegistrationPayload extends LoginPayload {
  email: string;
  firstName: string;
  lastName: string;
}

interface ValidationFailure {
  message: string;
  status: number;
  valid: false;
}

interface ValidationSuccess<TData> {
  data: TData;
  valid: true;
}

type ValidationResult<TData> = ValidationFailure | ValidationSuccess<TData>;

function readString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function normalizeUsername(value: unknown): string {
  return readString(value).trim().toLowerCase();
}

export function normalizeName(value: unknown): string {
  return readString(value).trim();
}

function isProfileAccent(value: unknown): value is ProfileAccent {
  return typeof value === 'string' && (PROFILE_ACCENTS as readonly string[]).includes(value);
}

export function validateProfileUpdatePayload(payload: unknown): ValidationResult<ProfileUpdateRequest> {
  const body = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>;
  const data: ProfileUpdateRequest = {};

  if ('displayName' in body) {
    const displayName = normalizePlainText(body.displayName, { maxLength: 80 });
    data.displayName = displayName.length > 0 ? displayName : null;
  }

  if ('firstName' in body) {
    const firstName = normalizeName(body.firstName);

    if (firstName.length > MAX_NAME_LENGTH) {
      return {
        message: `First name must be ${MAX_NAME_LENGTH} characters or fewer.`,
        status: 400,
        valid: false
      };
    }

    data.firstName = firstName;
  }

  if ('lastName' in body) {
    const lastName = normalizeName(body.lastName);

    if (lastName.length > MAX_NAME_LENGTH) {
      return {
        message: `Last name must be ${MAX_NAME_LENGTH} characters or fewer.`,
        status: 400,
        valid: false
      };
    }

    data.lastName = lastName;
  }

  if ('about' in body) {
    data.about = normalizePlainText(body.about, { maxLength: 1600, preserveNewlines: true });
  }

  if ('tagline' in body) {
    data.tagline = normalizePlainText(body.tagline, { maxLength: 140 });
  }

  if ('accentKey' in body) {
    if (!isProfileAccent(body.accentKey)) {
      return {
        message: 'Profile theme is not valid.',
        status: 400,
        valid: false
      };
    }

    data.accentKey = body.accentKey;
  }

  if (Object.keys(data).length === 0) {
    return {
      message: 'Nothing to update.',
      status: 400,
      valid: false
    };
  }

  return {
    data,
    valid: true
  };
}

export function applyProfileUpdates(user: UserDocument, data: ProfileUpdateRequest): void {
  if (data.displayName !== undefined) {
    user.displayName = data.displayName;
  }

  if (data.firstName !== undefined) {
    user.firstName = data.firstName || null;
  }

  if (data.lastName !== undefined) {
    user.lastName = data.lastName || null;
  }

  if (data.about !== undefined) {
    user.about = data.about;
  }

  if (data.tagline !== undefined) {
    user.tagline = data.tagline;
  }

  if (data.accentKey !== undefined) {
    user.accentKey = data.accentKey;
  }
}

export function toPublicUser(user: UserDocument): PublicUser {
  const aboutRaw = typeof user.about === 'string' ? user.about.trim() : '';
  const taglineRaw = typeof user.tagline === 'string' ? user.tagline.trim() : '';
  const accentKey = isProfileAccent(user.accentKey) ? user.accentKey : 'default';

  return {
    about: aboutRaw.length > 0 ? aboutRaw : null,
    accentKey,
    authProvider: user.googleId ? 'google' : 'local',
    createdAt: user.createdAt.toISOString(),
    displayName: user.displayName ?? null,
    firstName: user.firstName ?? null,
    id: String(user._id),
    lastName: user.lastName ?? null,
    profileImage: user.profileImage ?? null,
    role: user.role ?? 'user',
    tagline: taglineRaw.length > 0 ? taglineRaw : null,
    username: user.username ?? null
  };
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 12);
}

export function isLegacyScryptHash(storedValue: string): boolean {
  return storedValue.includes(':');
}

export function verifyPassword(password: string, storedValue: string): boolean {
  if (!password || !storedValue) {
    return false;
  }

  if (isLegacyScryptHash(storedValue)) {
    const [salt, storedHash] = storedValue.split(':');

    if (!salt || !storedHash) {
      return false;
    }

    const derivedHash = scryptSync(password, salt, PASSWORD_HASH_KEY_LENGTH);
    const storedBuffer = Buffer.from(storedHash, 'hex');

    return storedBuffer.length === derivedHash.length && timingSafeEqual(storedBuffer, derivedHash);
  }

  return bcrypt.compareSync(password, storedValue);
}

export function validatePassword(password: string): { errors: string[]; valid: boolean } {
  const rules = [
    { message: 'Password must be at least 8 characters long.', valid: (candidate: string) => candidate.length >= 8 },
    { message: `Password must be ${MAX_PASSWORD_LENGTH} characters or fewer.`, valid: (candidate: string) => candidate.length <= MAX_PASSWORD_LENGTH },
    { message: 'Password must include at least one uppercase letter.', valid: (candidate: string) => /[A-Z]/.test(candidate) },
    { message: 'Password must include at least one lowercase letter.', valid: (candidate: string) => /[a-z]/.test(candidate) },
    { message: 'Password must include at least one number.', valid: (candidate: string) => /[0-9]/.test(candidate) },
    { message: 'Password must include at least one special character.', valid: (candidate: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(candidate) }
  ];

  const errors = rules.filter((rule) => !rule.valid(password)).map((rule) => rule.message);

  return {
    errors,
    valid: errors.length === 0
  };
}

export function validateRegistrationPayload(payload: unknown): ValidationResult<RegistrationPayload> {
  const username = normalizeUsername((payload as Partial<RegistrationPayload> | undefined)?.username);
  const email = readString((payload as Partial<RegistrationPayload> | undefined)?.email).trim().toLowerCase();
  const firstName = normalizeName((payload as Partial<RegistrationPayload> | undefined)?.firstName);
  const lastName = normalizeName((payload as Partial<RegistrationPayload> | undefined)?.lastName);
  const password = readString((payload as Partial<RegistrationPayload> | undefined)?.password);

  if (!firstName || !lastName || !username || !email || !password) {
    return {
      message: 'Please complete all required fields.',
      status: 400,
      valid: false
    };
  }

  if (!USERNAME_PATTERN.test(username)) {
    return {
      message: 'Username must be 3-30 characters and use only letters, numbers, dots, underscores, or hyphens.',
      status: 400,
      valid: false
    };
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email) || email.length > 100) {
    return {
      message: 'Email address format is invalid.',
      status: 400,
      valid: false
    };
  }

  if (firstName.length > MAX_NAME_LENGTH || lastName.length > MAX_NAME_LENGTH) {
    return {
      message: `Names must be ${MAX_NAME_LENGTH} characters or fewer.`,
      status: 400,
      valid: false
    };
  }

  const passwordValidation = validatePassword(password);

  if (!passwordValidation.valid) {
    return {
      message: passwordValidation.errors.join(' '),
      status: 400,
      valid: false
    };
  }

  return {
    data: { email, firstName, lastName, password, username },
    valid: true
  };
}

export function validateLoginPayload(payload: unknown): ValidationResult<LoginPayload> {
  const username = normalizeUsername((payload as Partial<LoginPayload> | undefined)?.username);
  const password = readString((payload as Partial<LoginPayload> | undefined)?.password);

  if (!username || !password) {
    return {
      message: 'Username/email and password are required.',
      status: 400,
      valid: false
    };
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValidUsername = USERNAME_PATTERN.test(username);
  const isValidEmail = emailPattern.test(username) && username.length <= 100;

  if (!isValidUsername && !isValidEmail) {
    return {
      message: 'Username or email format is invalid.',
      status: 400,
      valid: false
    };
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return {
      message: `Password must be ${MAX_PASSWORD_LENGTH} characters or fewer.`,
      status: 400,
      valid: false
    };
  }

  return {
    data: { password, username },
    valid: true
  };
}

export function isUserLockedOut(user: UserDocument): boolean {
  return Boolean(user.lockoutUntil && user.lockoutUntil > new Date());
}

export function incrementFailedLoginAttempts(user: UserDocument): void {
  user.failedLoginAttempts += 1;
  if (user.failedLoginAttempts >= 5) {
    user.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  }
}

export function resetFailedLoginAttempts(user: UserDocument): void {
  user.failedLoginAttempts = 0;
  user.lockoutUntil = null;
}

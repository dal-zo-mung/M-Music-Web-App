import { model, Schema, type HydratedDocument } from 'mongoose';

import { PROFILE_ACCENTS, type ProfileAccent } from '../../../../shared/types.js';

const ALLOWED_ROLES = new Set(['admin', 'member', 'moderator', 'user']);

export interface UserRecord {
  about?: string | null;
  accentKey?: ProfileAccent;
  tagline?: string | null;
  displayName?: string | null;
  email?: string | null;
  emails: unknown[];
  firstName?: string | null;
  googleId?: string | null;
  lastName?: string | null;
  name: Record<string, unknown>;
  password?: string | null;
  profileImage?: string | null;
  role: 'admin' | 'member' | 'moderator' | 'user';
  source: 'desktop' | 'web';
  deviceId?: string | null;
  username?: string | null;
  failedLoginAttempts: number;
  lockoutUntil?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserRecord>(
  {
    about: { default: '', maxlength: 1600, trim: true, type: String },
    tagline: { default: '', maxlength: 140, trim: true, type: String },
    accentKey: {
      default: 'default',
      enum: [...PROFILE_ACCENTS],
      type: String
    },
    displayName: String,
    email: { index: true, sparse: true, type: String, unique: true, lowercase: true, trim: true },
    emails: { default: [], type: [Schema.Types.Mixed] },
    firstName: String,
    googleId: { index: true, sparse: true, type: String, unique: true },
    lastName: String,
    name: { default: {}, type: Schema.Types.Mixed },
    password: String,
    profileImage: String,
    role: { default: 'user', enum: ['user', 'member', 'moderator', 'admin'], type: String },
    source: { default: 'web', enum: ['web', 'desktop'], type: String },
    deviceId: { index: true, sparse: true, type: String, unique: true },
    username: { index: true, sparse: true, type: String, unique: true },
    failedLoginAttempts: { default: 0, type: Number },
    lockoutUntil: { type: Date }
  },
  { timestamps: true }
);



export type UserDocument = HydratedDocument<UserRecord>;

export const UserModel = model<UserRecord>('User', userSchema);

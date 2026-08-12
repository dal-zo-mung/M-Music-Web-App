import { model, Schema, type HydratedDocument } from 'mongoose';

export type ReleasePlatform = 'win' | 'mac' | 'linux' | 'all';

export interface ReleasePersistenceRecord {
  version: string;
  release_notes?: string;
  platform: ReleasePlatform;
  download_url: string;
  is_active: boolean;
}

const releaseSchema = new Schema<ReleasePersistenceRecord>(
  {
    version: { required: true, trim: true, type: String },
    release_notes: { trim: true, type: String },
    platform: {
      default: 'win',
      enum: ['win', 'mac', 'linux', 'all'],
      required: true,
      type: String
    },
    download_url: { required: true, trim: true, type: String },
    is_active: { default: false, type: Boolean }
  },
  {
    collection: 'releases',
    timestamps: true
  }
);

releaseSchema.index({ is_active: 1, platform: 1 });
releaseSchema.index({ createdAt: -1 });

export type ReleaseDocument = HydratedDocument<ReleasePersistenceRecord>;

export const ReleaseModel = model<ReleasePersistenceRecord>(
  'Release',
  releaseSchema,
  'releases'
);

import { model, Schema, type HydratedDocument, type Types } from 'mongoose';

export interface CommunitySubmissionPersistenceRecord {
  artist: string;
  authorId: Types.ObjectId;
  authorLabel: string;
  authorProfileImage?: string | null;
  authorRole: 'admin' | 'member' | 'moderator' | 'user';
  commentCount: number;
  description: string;
  lyrics: string[];
  releasedDate: string;
  status: 'published' | 'removed';
  title: string;
  youtubeUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunityCommentPersistenceRecord {
  authorId: Types.ObjectId;
  authorLabel: string;
  authorProfileImage?: string | null;
  authorRole: 'admin' | 'member' | 'moderator' | 'user';
  body: string;
  status: 'published' | 'removed';
  submissionId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const communitySubmissionSchema = new Schema<CommunitySubmissionPersistenceRecord>(
  {
    artist: { maxlength: 120, required: true, trim: true, type: String },
    authorId: { index: true, ref: 'User', required: true, type: Schema.Types.ObjectId },
    authorLabel: { maxlength: 120, required: true, trim: true, type: String },
    authorProfileImage: { default: null, type: String },
    authorRole: { enum: ['user', 'member', 'moderator', 'admin'], required: true, type: String },
    commentCount: { default: 0, min: 0, type: Number },
    description: { default: '', maxlength: 500, trim: true, type: String },
    lyrics: { default: [], type: [String] },
    releasedDate: { default: '', maxlength: 40, trim: true, type: String },
    status: { default: 'published', enum: ['published', 'removed'], type: String },
    title: { maxlength: 120, required: true, trim: true, type: String },
    youtubeUrl: { default: '', maxlength: 500, trim: true, type: String }
  },
  { timestamps: true }
);

communitySubmissionSchema.index({ createdAt: -1, status: 1 });

const communityCommentSchema = new Schema<CommunityCommentPersistenceRecord>(
  {
    authorId: { index: true, ref: 'User', required: true, type: Schema.Types.ObjectId },
    authorLabel: { maxlength: 120, required: true, trim: true, type: String },
    authorProfileImage: { default: null, type: String },
    authorRole: { enum: ['user', 'member', 'moderator', 'admin'], required: true, type: String },
    body: { maxlength: 1200, required: true, trim: true, type: String },
    status: { default: 'published', enum: ['published', 'removed'], type: String },
    submissionId: { index: true, ref: 'CommunitySubmission', required: true, type: Schema.Types.ObjectId }
  },
  { timestamps: true }
);

communityCommentSchema.index({ createdAt: -1, status: 1, submissionId: 1 });

export type CommunitySubmissionDocument = HydratedDocument<CommunitySubmissionPersistenceRecord>;
export type CommunityCommentDocument = HydratedDocument<CommunityCommentPersistenceRecord>;

export const CommunitySubmissionModel = model<CommunitySubmissionPersistenceRecord>(
  'CommunitySubmission',
  communitySubmissionSchema
);

export const CommunityCommentModel = model<CommunityCommentPersistenceRecord>(
  'CommunityComment',
  communityCommentSchema
);

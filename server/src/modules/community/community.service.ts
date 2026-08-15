import mongoose from "mongoose";

import type {
  CommunityAuthor,
  CommunityCommentPayload,
  CommunityCommentRecord,
  CommunityFeedResponse,
  CommunitySubmissionDetailResponse,
  CommunitySubmissionPayload,
  CommunitySubmissionRecord,
} from "../../../../shared/types.js";
import {
  normalizePlainText,
  normalizeLyrics,
} from "../shared/security/input.js";
import { normalizeYouTubeUrl } from "../shared/security/url.js";
import type { UserDocument } from "../auth/user.model.js";
import {
  CommunityCommentModel,
  CommunitySubmissionModel,
  type CommunityCommentPersistenceRecord,
  type CommunitySubmissionPersistenceRecord,
} from "./community.model.js";

type HttpError = Error & { statusCode?: number };

function getUserLabel(user: UserDocument): string {
  const fullName = [user.firstName, user.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return user.username || user.displayName || fullName || "Community Member";
}

function toCommunityAuthor(record: {
  authorId: unknown;
  authorLabel: string;
  authorProfileImage?: string | null;
  authorRole: CommunityAuthor["role"];
}): CommunityAuthor {
  return {
    id: String(record.authorId),
    label: record.authorLabel,
    profileImage: record.authorProfileImage ?? null,
    role: record.authorRole,
  };
}

function toSubmissionRecord(
  record: CommunitySubmissionPersistenceRecord & { _id: unknown },
): CommunitySubmissionRecord {
  return {
    _id: String(record._id),
    artist: record.artist,
    author: toCommunityAuthor(record),
    commentCount: record.commentCount,
    createdAt: record.createdAt.toISOString(),
    description: record.description,
    lyrics: Array.isArray(record.lyrics) ? record.lyrics : [],
    releasedDate: record.releasedDate,
    status: record.status,
    title: record.title,
    youtubeUrl: record.youtubeUrl,
  };
}

function toCommentRecord(
  record: CommunityCommentPersistenceRecord & { _id: unknown },
): CommunityCommentRecord {
  return {
    _id: String(record._id),
    author: toCommunityAuthor(record),
    body: record.body,
    createdAt: record.createdAt.toISOString(),
    submissionId: String(record.submissionId),
  };
}

function validationError(message: string): HttpError {
  const error = new Error(message) as HttpError;
  error.statusCode = 400;
  return error;
}

function validateSubmissionPayload(payload: CommunitySubmissionPayload) {
  const title = normalizePlainText(payload.title, { maxLength: 120 });
  const artist = normalizePlainText(payload.artist, { maxLength: 120 });
  const description = normalizePlainText(payload.description, {
    maxLength: 500,
    preserveNewlines: true,
  });
  const releasedDate = normalizePlainText(payload.releasedDate, {
    maxLength: 40,
  });
  const lyrics = normalizeLyrics(payload.lyrics);
  const youtubeUrl = normalizeYouTubeUrl(payload.youtubeUrl);

  if (!title) {
    throw validationError("Song title is required.");
  }

  if (!artist) {
    throw validationError("Artist name is required.");
  }

  if (lyrics.length === 0 || lyrics.every((line) => line.trim().length === 0)) {
    throw validationError("Lyrics are required.");
  }

  if (payload.youtubeUrl.trim().length > 0 && !youtubeUrl) {
    throw validationError("Only valid YouTube links are allowed.");
  }

  return {
    artist,
    description,
    lyrics,
    releasedDate,
    title,
    youtubeUrl,
  };
}

function validateCommentPayload(payload: CommunityCommentPayload) {
  const body = normalizePlainText(payload.body, {
    maxLength: 1200,
    preserveNewlines: true,
  });

  if (!body) {
    throw validationError("Comment text is required.");
  }

  return { body };
}

export async function listCommunityFeed(
  currentUser: UserDocument | null,
): Promise<CommunityFeedResponse> {
  const itemsPromise = CommunitySubmissionModel.find({ status: "published" })
    .sort({ createdAt: -1 })
    .limit(24)
    .lean<Array<CommunitySubmissionPersistenceRecord & { _id: unknown }>>()
    .exec();

  const minePromise = currentUser
    ? CommunitySubmissionModel.find(
        mongoose.trusted({
          authorId: currentUser._id,
          status: mongoose.trusted({ $ne: "removed" }),
        }),
      )
        .sort({ createdAt: -1 })
        .limit(12)
        .lean<Array<CommunitySubmissionPersistenceRecord & { _id: unknown }>>()
        .exec()
    : Promise.resolve([]);

  const [items, mine] = await Promise.all([itemsPromise, minePromise]);

  return {
    items: items.map(toSubmissionRecord),
    mine: mine.map(toSubmissionRecord),
  };
}

export async function getCommunitySubmissionDetails(
  submissionId: string,
): Promise<CommunitySubmissionDetailResponse | null> {
  const submission = await CommunitySubmissionModel.findOne({
    _id: submissionId,
    status: "published",
  })
    .lean<CommunitySubmissionPersistenceRecord & { _id: unknown }>()
    .exec();

  if (!submission) {
    return null;
  }

  const comments = await CommunityCommentModel.find({
    status: "published",
    submissionId,
  })
    .sort({ createdAt: -1 })
    .limit(80)
    .lean<Array<CommunityCommentPersistenceRecord & { _id: unknown }>>()
    .exec();

  return {
    comments: comments.map(toCommentRecord),
    submission: toSubmissionRecord(submission),
  };
}

export async function createCommunitySubmission(
  payload: CommunitySubmissionPayload,
  user: UserDocument,
): Promise<CommunitySubmissionRecord> {
  const validated = validateSubmissionPayload(payload);

  const created = await CommunitySubmissionModel.create({
    ...validated,
    authorId: user._id,
    authorLabel: getUserLabel(user),
    authorProfileImage: user.profileImage ?? null,
    authorRole: user.role ?? "member",
  });

  return toSubmissionRecord(created.toObject());
}

export async function createCommunityComment(
  submissionId: string,
  payload: CommunityCommentPayload,
  user: UserDocument,
): Promise<CommunityCommentRecord> {
  const submission = await CommunitySubmissionModel.findOne({
    _id: submissionId,
    status: "published",
  }).exec();

  if (!submission) {
    const error = new Error("Community lyric post not found.") as HttpError;
    error.statusCode = 404;
    throw error;
  }

  const validated = validateCommentPayload(payload);

  const created = await CommunityCommentModel.create({
    authorId: user._id,
    authorLabel: getUserLabel(user),
    authorProfileImage: user.profileImage ?? null,
    authorRole: user.role ?? "member",
    body: validated.body,
    submissionId: submission._id,
  });

  await CommunitySubmissionModel.updateOne(
    { _id: submission._id },
    { $inc: { commentCount: 1 } },
  ).exec();

  return toCommentRecord(created.toObject());
}

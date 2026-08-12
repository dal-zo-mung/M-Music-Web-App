import type { NextFunction, Request, Response } from 'express';

import type { CommunityCommentPayload, CommunitySubmissionPayload } from '../../../../shared/types.js';
import { resolveCurrentUser } from '../auth/auth.guard.js';
import {
  createCommunityComment,
  createCommunitySubmission,
  getCommunitySubmissionDetails,
  listCommunityFeed
} from './community.service.js';

export async function listCommunityFeedHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const currentUser = await resolveCurrentUser(req);
    res.json(await listCommunityFeed(currentUser));
  } catch (error) {
    next(error);
  }
}

export async function getCommunitySubmissionDetailsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const detail = await getCommunitySubmissionDetails(String(req.params.submissionId));

    if (!detail) {
      res.status(404).json({
        error: 'Community lyric post not found.',
        status: 404,
        success: false
      });
      return;
    }

    res.json(detail);
  } catch (error) {
    next(error);
  }
}

export async function createCommunitySubmissionHandler(
  req: Request<unknown, unknown, CommunitySubmissionPayload>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    res.status(201).json(await createCommunitySubmission(req.body, req.currentUser!));
  } catch (error) {
    next(error);
  }
}

export async function createCommunityCommentHandler(
  req: Request<{ submissionId: string }, unknown, CommunityCommentPayload>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    res.status(201).json(await createCommunityComment(req.params.submissionId, req.body, req.currentUser!));
  } catch (error) {
    next(error);
  }
}

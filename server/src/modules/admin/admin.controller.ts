import type { NextFunction, Request, Response } from "express";

import type {
  AdminPasswordResetRequest,
  AdminRoleUpdateRequest,
  AdminSongCreateRequest,
  AdminStatusUpdateRequest,
} from "../../../../shared/types.js";
import {
  createSong,
  deleteUser,
  deleteSong,
  getAdminStats,
  getUserDetail,
  listCommunitySubmissionsAdmin,
  listSongsAdmin,
  listUsers,
  resetUserPassword,
  unlockUser,
  updateCommentStatus,
  updateSong,
  updateSubmissionStatus,
  updateUserRole,
} from "./admin.service.js";

// ── Dashboard ───────────────────────────────────────────────

export async function getStatsHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const stats = await getAdminStats();
    res.json({
      status: true,
      message: "Stats retrieved successfully.",
      data: { stats },
    });
  } catch (error) {
    next(error);
  }
}

// ── Users ───────────────────────────────────────────────────

export async function listUsersHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await listUsers(req.query);
    res.json({ status: true, message: "Users retrieved successfully.", data });
  } catch (error) {
    next(error);
  }
}

export async function getUserDetailHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await getUserDetail(String(req.params.userId));
    res.json({
      status: true,
      message: "User details retrieved successfully.",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateUserRoleHandler(
  req: Request<{ userId: string }, unknown, AdminRoleUpdateRequest>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await updateUserRole(
      req.params.userId,
      req.body.role,
      req.currentUser!,
    );
    res.json({
      status: true,
      message: "User role updated successfully.",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

export async function unlockUserHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await unlockUser(String(req.params.userId));
    res.json({
      status: true,
      message: "User unlocked successfully.",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

export async function resetUserPasswordHandler(
  req: Request<{ userId: string }, unknown, AdminPasswordResetRequest>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await resetUserPassword(req.params.userId, req.body.password);
    res.json({
      status: true,
      message: "User password reset successfully.",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteUserHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const deleted = await deleteUser(
      String(req.params.userId),
      req.currentUser!,
    );
    res.json({
      status: true,
      message: "User deleted successfully.",
      data: { deleted },
    });
  } catch (error) {
    next(error);
  }
}

// ── Songs ───────────────────────────────────────────────────

export async function listSongsAdminHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await listSongsAdmin(req.query);
    res.json({ status: true, message: "Songs retrieved successfully.", data });
  } catch (error) {
    next(error);
  }
}

export async function getSongAdminHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { getSongDetailAdmin } = await import("./admin.service.js");
    const song = await getSongDetailAdmin(String(req.params.songId));
    res.json({
      status: true,
      message: "Song details retrieved successfully.",
      data: { song },
    });
  } catch (error) {
    next(error);
  }
}

export async function createSongHandler(
  req: Request<unknown, unknown, AdminSongCreateRequest>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const song = await createSong(req.body);
    res.status(201).json({
      status: true,
      message: "Song created successfully.",
      data: { song },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSongHandler(
  req: Request<{ songId: string }, unknown, Partial<AdminSongCreateRequest>>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const song = await updateSong(req.params.songId, req.body);
    const statusUpdate = (req.body as any).status;
    let message = "Song updated successfully.";
    if (statusUpdate === "published")
      message = "Song publish is successfully!!!";
    if (statusUpdate === "removed")
      message = "Song unpublish is successfully!!!";
    res.json({ status: true, message, data: { song } });
  } catch (error) {
    next(error);
  }
}

export async function deleteSongHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const deleted = await deleteSong(String(req.params.songId));
    res.json({
      status: true,
      message: "Song deleted successfully.",
      data: { deleted },
    });
  } catch (error) {
    next(error);
  }
}

// ── Community Moderation ────────────────────────────────────

export async function listCommunityAdminHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await listCommunitySubmissionsAdmin(req.query);
    res.json({
      status: true,
      message: "Community submissions retrieved successfully.",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSubmissionStatusHandler(
  req: Request<{ submissionId: string }, unknown, AdminStatusUpdateRequest>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const submission = await updateSubmissionStatus(
      req.params.submissionId,
      req.body.status,
    );
    res.json({
      status: true,
      message: "Submission status updated successfully.",
      data: { submission },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCommentStatusHandler(
  req: Request<{ commentId: string }, unknown, AdminStatusUpdateRequest>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const comment = await updateCommentStatus(
      req.params.commentId,
      req.body.status,
    );
    res.json({
      status: true,
      message: "Comment status updated successfully.",
      data: { comment },
    });
  } catch (error) {
    next(error);
  }
}

import type {
  AdminCommunitySubmissionsResponse,
  AdminPasswordResetRequest,
  AdminRoleUpdateRequest,
  AdminSongCreateRequest,
  AdminSongRecord,
  AdminSongsResponse,
  AdminStatsResponse,
  AdminStatusUpdateRequest,
  AdminUserDetailResponse,
  AdminUserRecord,
  AdminUsersResponse,
  CommunityCommentRecord,
  CommunitySubmissionRecord
} from '@shared/types';
import { deleteJson, fetchJson, patchJson, postJson } from './api';

export async function fetchAdminStats(): Promise<AdminStatsResponse> {
  return fetchJson<AdminStatsResponse>('/api/admin/stats');
}

export async function fetchAdminUsers(params: Record<string, string>): Promise<AdminUsersResponse> {
  const query = new URLSearchParams(params).toString();
  return fetchJson<AdminUsersResponse>(`/api/admin/users?${query}`);
}

export async function fetchAdminUserDetail(userId: string): Promise<AdminUserDetailResponse> {
  return fetchJson<AdminUserDetailResponse>(`/api/admin/users/${userId}`);
}

export async function updateAdminUserRole(userId: string, role: string): Promise<{ success: boolean; user: AdminUserRecord }> {
  return patchJson<{ success: boolean; user: AdminUserRecord }>(
    `/api/admin/users/${userId}/role`,
    { role: role as 'admin' | 'member' | 'moderator' | 'user' }
  );
}

export async function unlockAdminUser(userId: string): Promise<{ success: boolean; user: AdminUserRecord }> {
  return patchJson<{ success: boolean; user: AdminUserRecord }>(
    `/api/admin/users/${userId}/unlock`,
    {}
  );
}

export async function resetAdminUserPassword(userId: string, password: string): Promise<{ success: boolean; user: AdminUserRecord }> {
  return patchJson<{ success: boolean; user: AdminUserRecord }>(
    `/api/admin/users/${userId}/password`,
    { password }
  );
}

export async function deleteAdminUser(userId: string): Promise<{ success: boolean; deleted: unknown }> {
  return deleteJson<{ success: boolean; deleted: unknown }>(`/api/admin/users/${userId}`);
}

export async function fetchAdminSongs(params: Record<string, string>): Promise<AdminSongsResponse> {
  const query = new URLSearchParams(params).toString();
  return fetchJson<AdminSongsResponse>(`/api/admin/songs?${query}`);
}

export async function createAdminSong(payload: AdminSongCreateRequest): Promise<{ success: boolean; song: AdminSongRecord }> {
  return postJson<{ success: boolean; song: AdminSongRecord }>(
    '/api/admin/songs',
    payload
  );
}

export async function updateAdminSong(songId: string, payload: Partial<AdminSongCreateRequest>): Promise<{ success: boolean; song: AdminSongRecord }> {
  return patchJson<{ success: boolean; song: AdminSongRecord }>(
    `/api/admin/songs/${songId}`,
    payload
  );
}

export async function deleteAdminSong(songId: string): Promise<{ success: boolean; deleted: unknown }> {
  return deleteJson<{ success: boolean; deleted: unknown }>(`/api/admin/songs/${songId}`);
}

export async function fetchAdminCommunity(params: Record<string, string>): Promise<AdminCommunitySubmissionsResponse> {
  const query = new URLSearchParams(params).toString();
  return fetchJson<AdminCommunitySubmissionsResponse>(`/api/admin/community/submissions?${query}`);
}

export async function updateAdminSubmissionStatus(submissionId: string, status: string): Promise<{ success: boolean; submission: CommunitySubmissionRecord }> {
  return patchJson<{ success: boolean; submission: CommunitySubmissionRecord }>(
    `/api/admin/community/submissions/${submissionId}/status`,
    { status: status as 'published' | 'removed' }
  );
}

export async function updateAdminCommentStatus(commentId: string, status: string): Promise<{ success: boolean; comment: CommunityCommentRecord }> {
  return patchJson<{ success: boolean; comment: CommunityCommentRecord }>(
    `/api/admin/community/comments/${commentId}/status`,
    { status: status as 'published' | 'removed' }
  );
}

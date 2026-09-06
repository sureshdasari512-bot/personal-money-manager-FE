import { apiFetch } from '../../lib/api-client';
import type {
  CreateInvitationPayload,
  CreateUserPayload,
  InvitationResponse,
  InvitationsResponse,
  UpdateUserPayload,
  UserResponse,
  UsersResponse,
} from './types';

/**
 * Lists all accounts (admin only).
 *
 * @returns Users payload
 */
export function fetchUsers(): Promise<UsersResponse> {
  return apiFetch<UsersResponse>('/users');
}

/**
 * Loads one account (admin only).
 *
 * @param userId - Target user
 * @returns User payload
 */
export function fetchUser(userId: string): Promise<UserResponse> {
  return apiFetch<UserResponse>(`/users/${userId}`);
}

/**
 * Creates an account (admin only). Invite-accept remains the onboarding path.
 *
 * @param payload - Email, password, and role
 * @returns Created user
 */
export function createUser(payload: CreateUserPayload): Promise<UserResponse> {
  return apiFetch<UserResponse>('/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Updates email, role, and access (admin only).
 *
 * @param userId - Target user
 * @param payload - Updated fields
 * @returns Updated user
 */
export function updateUser(userId: string, payload: UpdateUserPayload): Promise<UserResponse> {
  return apiFetch<UserResponse>(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Soft-deletes an account (admin only).
 *
 * @param userId - Target user
 */
export function deleteUser(userId: string): Promise<void> {
  return apiFetch<void>(`/users/${userId}`, { method: 'DELETE' });
}

/**
 * Enables or disables a user account.
 *
 * @param userId - Target user
 * @param isActive - Desired access flag
 * @returns Updated user
 */
export function setUserAccess(userId: string, isActive: boolean): Promise<UserResponse> {
  return apiFetch<UserResponse>(`/users/${userId}/access`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
}

/**
 * Lists invitations (admin only).
 *
 * @returns Invitations payload
 */
export function fetchInvitations(): Promise<InvitationsResponse> {
  return apiFetch<InvitationsResponse>('/invitations');
}

/**
 * Loads one invitation (admin only).
 *
 * @param invitationId - Invitation id
 * @returns Invitation payload
 */
export function fetchInvitation(invitationId: string): Promise<InvitationResponse> {
  return apiFetch<InvitationResponse>(`/invitations/${invitationId}`);
}

/**
 * Sends an admin invitation for a new user.
 *
 * @param payload - Invitee email and role
 * @returns Created invitation (includes token for the email link)
 */
export function createInvitation(payload: CreateInvitationPayload): Promise<InvitationResponse> {
  return apiFetch<InvitationResponse>('/invitations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Revokes a pending invitation (admin only).
 *
 * @param invitationId - Invitation id
 * @returns Revoked invitation
 */
export function revokeInvitation(invitationId: string): Promise<InvitationResponse> {
  return apiFetch<InvitationResponse>(`/invitations/${invitationId}/revoke`, {
    method: 'POST',
  });
}

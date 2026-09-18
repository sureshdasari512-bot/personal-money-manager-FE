import { apiFetch } from '../../lib/api-client';
import type {
  AcceptInvitePayload,
  AuthResponse,
  ForgotPasswordPayload,
  ForgotPasswordResponse,
  LoginPayload,
  MeResponse,
  ResetPasswordPayload,
} from './types';

/**
 * Logs in with email and password. Auth cookies are set by the API.
 *
 * @param payload - Credentials
 * @returns Authenticated public user
 */
export function login(payload: LoginPayload): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Rotates the refresh cookie and issues a new access cookie.
 *
 * @returns Current user after rotation
 */
export function refreshSession(): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/refresh', { method: 'POST' });
}

/**
 * Clears auth cookies on the API.
 */
export function logout(): Promise<void> {
  return apiFetch<void>('/auth/logout', { method: 'POST' });
}

/**
 * Loads the current session from the httpOnly cookie.
 *
 * @returns Current user or fails with 401
 */
export function fetchCurrentUser(): Promise<MeResponse> {
  return apiFetch<MeResponse>('/auth/me', { signal: AbortSignal.timeout(20_000) });
}

/**
 * Activates an invited account.
 *
 * @param payload - Invite token plus chosen password
 * @returns Newly created user (cookies set by the API)
 */
export function acceptInvite(payload: AcceptInvitePayload): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/accept-invite', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Requests a password-reset email. Always returns the same generic message.
 *
 * @param payload - Account email
 * @returns Client-safe confirmation copy
 */
export function requestPasswordReset(payload: ForgotPasswordPayload): Promise<ForgotPasswordResponse> {
  return apiFetch<ForgotPasswordResponse>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Sets a new password from the email link and starts a session.
 *
 * @param payload - Reset token plus new password
 * @returns Authenticated public user
 */
export function resetPassword(payload: ResetPasswordPayload): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

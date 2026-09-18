import type { PublicUser } from '../../types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AcceptInvitePayload {
  token: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}

export interface AuthResponse {
  user: PublicUser;
}

export interface MeResponse {
  user: PublicUser;
}

export interface ForgotPasswordResponse {
  message: string;
}

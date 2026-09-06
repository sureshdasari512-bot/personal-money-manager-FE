import type { Invitation, PublicUser } from '../../types';

export interface UsersResponse {
  users: PublicUser[];
}

export interface UserResponse {
  user: PublicUser;
}

export interface InvitationResponse {
  invitation: Invitation;
}

export interface InvitationsResponse {
  invitations: Invitation[];
}

export interface CreateInvitationPayload {
  email: string;
  role: PublicUser['role'];
}

export interface CreateUserPayload {
  email: string;
  password: string;
  role: PublicUser['role'];
}

export interface UpdateUserPayload {
  email: string;
  role: PublicUser['role'];
  isActive: boolean;
}

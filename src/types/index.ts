export type UserRole = 'admin' | 'user';

export type TransactionType = 'lend' | 'borrow';

export type TransactionStatus = 'pending' | 'partially_paid' | 'paid' | 'cancelled';

export interface PublicUser {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  deletedBy: string | null;
}

export interface Person {
  id: string;
  userId: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  deletedAt: string | null;
  deletedBy: string | null;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string;
  updatedBy: string | null;
}

export interface Transaction {
  id: string;
  userId: string;
  personId: string;
  personName?: string;
  type: TransactionType;
  status: TransactionStatus;
  amountCents: number;
  transactionDate: string;
  dueDate: string | null;
  notes: string | null;
  deletedAt: string | null;
  deletedBy: string | null;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string;
  updatedBy: string | null;
}

export interface Repayment {
  id: string;
  transactionId: string;
  amountCents: number;
  paidOn: string;
  notes: string | null;
  deletedAt: string | null;
  deletedBy: string | null;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string;
  updatedBy: string | null;
}

export interface LedgerTransaction extends Transaction {
  outstandingCents: number;
  repayments: Repayment[];
}

export interface PersonLedger {
  transactions: LedgerTransaction[];
  netBalanceCents: number;
}

export interface DashboardSummary {
  totalOwedToUserCents: number;
  totalUserOwesCents: number;
  overdueCount: number;
  upcomingDueCount: number;
}

export type InvitationStatus = 'pending' | 'accepted' | 'revoked' | 'expired';

export interface Invitation {
  id: string;
  email: string;
  token: string;
  role: UserRole;
  status: InvitationStatus;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  invitedBy: string;
  revokedBy: string | null;
  createdAt: string;
  updatedAt: string;
  updatedBy: string | null;
}

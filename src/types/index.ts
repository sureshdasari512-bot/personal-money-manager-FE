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
  /** Portion of amountCents that reduced the outstanding principal. The rest went to interest. */
  towardPrincipalCents: number;
  paidOn: string;
  notes: string | null;
  allocationId: string | null;
  deletedAt: string | null;
  deletedBy: string | null;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string;
  updatedBy: string | null;
}

export interface RepaymentAllocation {
  id: string;
  userId: string;
  personId: string;
  totalAmountCents: number;
  paidOn: string;
  notes: string | null;
  unallocatedCents: number;
  deletedAt: string | null;
  deletedBy: string | null;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string;
  updatedBy: string | null;
}

export type InterestPeriod = 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';

export interface TransactionInterestConfig {
  id: string;
  transactionId: string;
  userId: string;
  interestRateBps: number;
  interestPeriod: InterestPeriod;
  deletedAt: string | null;
  deletedBy: string | null;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string;
  updatedBy: string | null;
}

export interface LedgerTransaction extends Transaction {
  outstandingCents: number;
  accruedInterestCents: number;
  interestConfig: TransactionInterestConfig | null;
  repayments: Repayment[];
}

export interface PersonLedger {
  transactions: LedgerTransaction[];
  netBalanceCents: number;
}

export interface DashboardPersonBalance {
  personId: string;
  personName: string;
  netBalanceCents: number;
  /** Unpaid accrued interest across all transactions with this person */
  accruedInterestCents: number;
  /** Earliest interest accrual start date for this person (YYYY-MM-DD), null if no interest */
  interestPeriodFrom: string | null;
  /** Latest interest accrual end date (or today if open) for this person (YYYY-MM-DD), null if no interest */
  interestPeriodTo: string | null;
}

export interface DashboardDueItem {
  transactionId: string;
  personId: string;
  personName: string;
  type: TransactionType;
  amountCents: number;
  /** True outstanding = principal + unpaid interest */
  outstandingCents: number;
  /** Outstanding principal only (excludes interest) */
  outstandingPrincipalCents: number;
  /** Unpaid accrued interest for this transaction */
  accruedInterestCents: number;
  transactionDate: string;
  dueDate: string;
}

export interface DashboardSummary {
  /** Total outstanding (principal + interest) that others owe the user */
  totalOwedToUserCents: number;
  /** Principal-only portion of totalOwedToUserCents */
  totalOwedToUserPrincipalCents: number;
  /** Total outstanding (principal + interest) that the user owes others */
  totalUserOwesCents: number;
  overdueCount: number;
  upcomingDueCount: number;
  people: DashboardPersonBalance[];
  overdue: DashboardDueItem[];
  upcomingDue: DashboardDueItem[];
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

import type {
  InterestPeriod,
  LedgerTransaction,
  PersonLedger,
  Repayment,
  RepaymentAllocation,
  Transaction,
  TransactionInterestConfig,
  TransactionStatus,
  TransactionType,
} from '../../types';

export type {
  InterestPeriod,
  LedgerTransaction,
  PersonLedger,
  Repayment,
  RepaymentAllocation,
  Transaction,
  TransactionInterestConfig,
  TransactionStatus,
  TransactionType,
};

export interface TransactionResponse {
  transaction: Transaction;
}

export interface RepaymentResponse {
  repayment: Repayment;
}

export interface PersonRepaymentResponse {
  allocation: RepaymentAllocation;
  repayments: Repayment[];
}

export interface TransactionFormValues {
  type: TransactionType;
  amount: string;
  transactionDate: string;
  dueDate?: string;
  notes?: string;
}

export interface InterestConfigPayload {
  interestRateBps: number;
  interestPeriod: InterestPeriod;
}

export interface InterestConfigResponse {
  interestConfig: TransactionInterestConfig;
}

export interface CreateTransactionPayload {
  personId: string;
  type: TransactionType;
  amountCents: number;
  transactionDate: string;
  dueDate?: string;
  notes?: string;
  /** Optional interest config to set immediately after creating the transaction */
  interest?: InterestConfigPayload;
}

export interface CreateRepaymentPayload {
  amountCents: number;
  paidOn: string;
  notes?: string;
}

export interface RepaymentPreview {
  amountCents: number;
  accruedInterestCents: number;
  towardInterestCents: number;
  towardPrincipalCents: number;
  outstandingPrincipalBefore: number;
  outstandingPrincipalAfter: number;
  remainingInterestCents: number;
  willFullySettle: boolean;
}

export interface RepaymentPreviewResponse {
  preview: RepaymentPreview;
}

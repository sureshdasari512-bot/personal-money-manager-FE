import type {
  LedgerTransaction,
  PersonLedger,
  Repayment,
  Transaction,
  TransactionStatus,
  TransactionType,
} from '../../types';

export type {
  LedgerTransaction,
  PersonLedger,
  Repayment,
  Transaction,
  TransactionStatus,
  TransactionType,
};

export interface TransactionResponse {
  transaction: Transaction;
}

export interface RepaymentResponse {
  repayment: Repayment;
}

export interface TransactionFormValues {
  type: TransactionType;
  amount: string;
  transactionDate: string;
  dueDate?: string;
  notes?: string;
}

export interface CreateTransactionPayload {
  personId: string;
  type: TransactionType;
  amountCents: number;
  transactionDate: string;
  dueDate?: string;
  notes?: string;
}

export interface CreateRepaymentPayload {
  amountCents: number;
  paidOn: string;
  notes?: string;
}

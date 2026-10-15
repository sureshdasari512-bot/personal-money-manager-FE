import type {
  InterestPeriod,
  LedgerTransaction,
  TransactionInterestConfig,
} from '../../types';

export type { InterestPeriod, LedgerTransaction, TransactionInterestConfig };

export interface InterestConfigPayload {
  interestRateBps: number;
  interestPeriod: InterestPeriod;
  /**
   * Optional effective date (YYYY-MM-DD) for a rate change.
   * Must be >= the transaction date and <= today.
   * Defaults to today on the server when omitted.
   */
  effectiveDate?: string;
}

export interface InterestConfigResponse {
  interestConfig: TransactionInterestConfig;
}

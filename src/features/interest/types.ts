import type {
  InterestPeriod,
  LedgerTransaction,
  TransactionInterestConfig,
} from '../../types';

export type { InterestPeriod, LedgerTransaction, TransactionInterestConfig };

export interface InterestConfigPayload {
  interestRateBps: number;
  interestPeriod: InterestPeriod;
}

export interface InterestConfigResponse {
  interestConfig: TransactionInterestConfig;
}

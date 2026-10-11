import type { InterestPeriod } from '../types';

/**
 * Number of calendar months in one payment period.
 * Also the multiplier on the monthly rate to get the period interest.
 *
 * Example: quarterly → 3 months → interest = principal × monthly_rate × 3
 */
export const PERIOD_MONTHS: Record<InterestPeriod, number> = {
  monthly: 1,
  quarterly: 3,
  half_yearly: 6,
  yearly: 12,
};

/** Human-readable label for each payment period. */
export const PERIOD_LABELS: Record<InterestPeriod, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  half_yearly: 'Half-yearly',
  yearly: 'Yearly',
};

/**
 * Calculates the number of whole completed payment periods between two ISO dates.
 * Interest is collected only in complete periods — no partial-period accrual.
 *
 * @param startDate - ISO date string (YYYY-MM-DD)
 * @param endDate   - ISO date string (YYYY-MM-DD)
 * @param period    - Payment frequency
 * @returns Number of whole completed periods (>= 0), or 0 for invalid dates
 */
export function computeCompletedPeriods(
  startDate: string,
  endDate: string,
  period: InterestPeriod,
): number {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  const monthsElapsed =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());

  if (monthsElapsed <= 0) return 0;

  return Math.floor(monthsElapsed / PERIOD_MONTHS[period]);
}

/**
 * Calculates simple interest for ONE payment period using a MONTHLY rate.
 *
 * Formula: floor( principal × (monthlyRateBps / 10000) × periodMonths )
 *
 * Example: ₹5,000, 2%/month, quarterly payment
 *   = 500000 × (200 / 10000) × 3 = 30,000 paise = ₹300 per quarter
 *
 * @param openingBalanceCents - Outstanding principal in cents
 * @param monthlyRateBps      - Monthly rate in basis points (e.g. 200 = 2%/month)
 * @param period              - Payment frequency (determines months multiplier)
 * @returns Interest for one period in cents, floored
 */
export function calculatePeriodInterestCents(
  openingBalanceCents: number,
  monthlyRateBps: number,
  period: InterestPeriod,
): number {
  if (openingBalanceCents <= 0 || monthlyRateBps <= 0) return 0;
  const months = PERIOD_MONTHS[period];
  return Math.floor((openingBalanceCents * monthlyRateBps * months) / 10_000);
}

/**
 * Estimates total interest from transaction date to today.
 * Assumes constant opening balance (no mid-way repayments).
 * The server's interest_accruals table is authoritative for real totals.
 *
 * @param outstandingCents - Current outstanding principal
 * @param monthlyRateBps   - Monthly rate in basis points
 * @param period           - Payment frequency
 * @param transactionDate  - ISO date the loan started
 * @returns Estimated total accrued interest in cents
 */
export function estimateTotalInterestCents(
  outstandingCents: number,
  monthlyRateBps: number,
  period: InterestPeriod,
  transactionDate: string,
): number {
  const today = new Date().toISOString().slice(0, 10);
  const completedPeriods = computeCompletedPeriods(transactionDate, today, period);
  if (completedPeriods === 0) return 0;
  const perPeriod = calculatePeriodInterestCents(outstandingCents, monthlyRateBps, period);
  return perPeriod * completedPeriods;
}

/**
 * Converts a monthly rate % string typed by the user (e.g. "2")
 * to basis points integer (e.g. 200). Returns null if blank or invalid.
 *
 * @param ratePercent - User-typed monthly rate string
 * @returns Basis points integer, or null
 */
export function percentToBps(ratePercent: string): number | null {
  const parsed = parseFloat(ratePercent);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed * 100);
}

/**
 * Converts basis points to a display-friendly percentage string.
 *
 * @param bps - Basis points integer (e.g. 200)
 * @returns Formatted string (e.g. "2.00")
 */
export function bpsToPercent(bps: number): string {
  return (bps / 100).toFixed(2);
}

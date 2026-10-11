import { describe, expect, it } from 'vitest';
import {
  bpsToPercent,
  calculatePeriodInterestCents,
  computeCompletedPeriods,
  estimateTotalInterestCents,
  percentToBps,
} from './simpleInterest';

// ---------------------------------------------------------------------------
// Model: monthlyRateBps = MONTHLY rate (e.g. 200 = 2% per month)
//        period         = when they PAY (monthly / quarterly / half_yearly / yearly)
//        formula        = principal × (monthlyRateBps / 10000) × periodMonths
// ---------------------------------------------------------------------------

describe('computeCompletedPeriods', () => {
  it('returns 0 when start equals end', () => {
    expect(computeCompletedPeriods('2024-01-01', '2024-01-01', 'monthly')).toBe(0);
  });

  it('returns 0 for invalid dates (does not throw)', () => {
    expect(computeCompletedPeriods('bad', '2024-01-01', 'monthly')).toBe(0);
  });

  it('monthly: 3 months elapsed = 3 periods', () => {
    expect(computeCompletedPeriods('2024-01-01', '2024-04-01', 'monthly')).toBe(3);
  });

  it('quarterly: 5 months = 1 complete quarter', () => {
    expect(computeCompletedPeriods('2024-01-01', '2024-06-01', 'quarterly')).toBe(1);
  });

  it('quarterly: 6 months = 2 complete quarters', () => {
    expect(computeCompletedPeriods('2024-01-01', '2024-07-01', 'quarterly')).toBe(2);
  });

  it('half_yearly: 12 months = 2 half-years', () => {
    expect(computeCompletedPeriods('2024-01-01', '2025-01-01', 'half_yearly')).toBe(2);
  });

  it('yearly: 11 months = 0 years', () => {
    expect(computeCompletedPeriods('2024-01-01', '2024-12-01', 'yearly')).toBe(0);
  });

  it('yearly: exactly 12 months = 1 year', () => {
    expect(computeCompletedPeriods('2024-01-01', '2025-01-01', 'yearly')).toBe(1);
  });
});

describe('calculatePeriodInterestCents', () => {
  it('returns 0 when balance is 0', () => {
    expect(calculatePeriodInterestCents(0, 200, 'monthly')).toBe(0);
  });

  it('returns 0 when rate is 0', () => {
    expect(calculatePeriodInterestCents(500_000, 0, 'monthly')).toBe(0);
  });

  // ₹5,000 (500,000 paise), 2%/month, paying monthly
  // = 500000 × (200/10000) × 1 = 10,000 paise = ₹100
  it('monthly: 2%/month on ₹5,000 = ₹100 per month', () => {
    expect(calculatePeriodInterestCents(500_000, 200, 'monthly')).toBe(10_000);
  });

  // ₹5,000, 2%/month, paying quarterly → 2% × 3 months = 6% per quarter
  // = 500000 × (200/10000) × 3 = 30,000 paise = ₹300
  it('quarterly: 2%/month on ₹5,000 = ₹300 per quarter', () => {
    expect(calculatePeriodInterestCents(500_000, 200, 'quarterly')).toBe(30_000);
  });

  // ₹5,000, 2%/month, paying half-yearly → 2% × 6 = 12% per half-year
  // = 500000 × (200/10000) × 6 = 60,000 paise = ₹600
  it('half_yearly: 2%/month on ₹5,000 = ₹600 per half-year', () => {
    expect(calculatePeriodInterestCents(500_000, 200, 'half_yearly')).toBe(60_000);
  });

  // ₹5,000, 2%/month, paying yearly → 2% × 12 = 24% per year
  // = 500000 × (200/10000) × 12 = 120,000 paise = ₹1,200
  it('yearly: 2%/month on ₹5,000 = ₹1,200 per year', () => {
    expect(calculatePeriodInterestCents(500_000, 200, 'yearly')).toBe(120_000);
  });

  it('floors fractional paise — never rounds up', () => {
    expect(calculatePeriodInterestCents(1, 1, 'monthly')).toBe(0);
  });
});

describe('estimateTotalInterestCents', () => {
  it('returns 0 when no complete period elapsed', () => {
    const past = new Date();
    past.setMonth(past.getMonth() - 2);
    const start = past.toISOString().slice(0, 10);
    // 2 months elapsed, quarterly → 0 complete quarters
    expect(estimateTotalInterestCents(500_000, 200, 'quarterly', start)).toBe(0);
  });
});

describe('percentToBps', () => {
  it('converts 2% to 200 bps', () => {
    expect(percentToBps('2')).toBe(200);
  });

  it('converts 1.5% to 150 bps', () => {
    expect(percentToBps('1.5')).toBe(150);
  });

  it('converts 0.5% to 50 bps', () => {
    expect(percentToBps('0.5')).toBe(50);
  });

  it('returns null for empty string', () => {
    expect(percentToBps('')).toBeNull();
  });

  it('returns null for zero', () => {
    expect(percentToBps('0')).toBeNull();
  });

  it('returns null for negative', () => {
    expect(percentToBps('-1')).toBeNull();
  });

  it('returns null for non-numeric', () => {
    expect(percentToBps('abc')).toBeNull();
  });
});

describe('bpsToPercent', () => {
  it('converts 200 bps to "2.00"', () => {
    expect(bpsToPercent(200)).toBe('2.00');
  });

  it('converts 150 bps to "1.50"', () => {
    expect(bpsToPercent(150)).toBe('1.50');
  });

  it('converts 50 bps to "0.50"', () => {
    expect(bpsToPercent(50)).toBe('0.50');
  });
});

import { describe, expect, it } from 'vitest';
import { outstandingByType } from './outstandingByType';

describe('outstandingByType', () => {
  it('keeps lend and borrow outstanding separate', () => {
    expect(
      outstandingByType([
        { type: 'lend', status: 'pending', outstandingCents: 100000, accruedInterestCents: 0 },
        { type: 'lend', status: 'partially_paid', outstandingCents: 25000, accruedInterestCents: 0 },
        { type: 'borrow', status: 'pending', outstandingCents: 40000, accruedInterestCents: 0 },
        { type: 'lend', status: 'pending', outstandingCents: 0, accruedInterestCents: 0 },
      ]),
    ).toEqual({ theyOweYouCents: 125000, theyOweYouPrincipalCents: 125000, youOweThemCents: 40000, youOweThemPrincipalCents: 40000 });
  });

  it('excludes paid transactions entirely — stale accrual data must not inflate balance', () => {
    expect(
      outstandingByType([
        { type: 'lend', status: 'paid', outstandingCents: 0, accruedInterestCents: 1064 },
        { type: 'lend', status: 'pending', outstandingCents: 50000, accruedInterestCents: 0 },
      ]),
    ).toEqual({ theyOweYouCents: 50000, theyOweYouPrincipalCents: 50000, youOweThemCents: 0, youOweThemPrincipalCents: 0 });
  });

  it('excludes cancelled transactions entirely', () => {
    expect(
      outstandingByType([
        { type: 'lend', status: 'cancelled', outstandingCents: 200000, accruedInterestCents: 500 },
        { type: 'borrow', status: 'cancelled', outstandingCents: 100000, accruedInterestCents: 0 },
      ]),
    ).toEqual({ theyOweYouCents: 0, theyOweYouPrincipalCents: 0, youOweThemCents: 0, youOweThemPrincipalCents: 0 });
  });

  it('includes interest in theyOweYouCents for active lends', () => {
    expect(
      outstandingByType([
        { type: 'lend', status: 'partially_paid', outstandingCents: 90000, accruedInterestCents: 2000 },
      ]),
    ).toEqual({ theyOweYouCents: 92000, theyOweYouPrincipalCents: 90000, youOweThemCents: 0, youOweThemPrincipalCents: 0 });
  });
});

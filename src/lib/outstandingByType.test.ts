import { describe, expect, it } from 'vitest';
import { outstandingByType } from './outstandingByType';

describe('outstandingByType', () => {
  it('keeps lend and borrow outstanding separate', () => {
    expect(
      outstandingByType([
        { type: 'lend', outstandingCents: 100000, accruedInterestCents: 0 },
        { type: 'lend', outstandingCents: 25000, accruedInterestCents: 0 },
        { type: 'borrow', outstandingCents: 40000, accruedInterestCents: 0 },
        { type: 'lend', outstandingCents: 0, accruedInterestCents: 0 },
      ]),
    ).toEqual({ theyOweYouCents: 125000, theyOweYouPrincipalCents: 125000, youOweThemCents: 40000 });
  });
});

import { describe, expect, it } from 'vitest';
import { formatAllocationSplit, totalsByAllocationId } from './allocationSplit';

describe('formatAllocationSplit', () => {
  it('explains a slice of a larger payment', () => {
    const caption = formatAllocationSplit(500000, 1000000);
    expect(caption).toContain('5,000');
    expect(caption).toContain('10,000');
    expect(caption).toContain('applied here');
  });

  it('hides the split when this loan received the whole payment', () => {
    expect(formatAllocationSplit(1000000, 1000000)).toBeNull();
  });
});

describe('totalsByAllocationId', () => {
  it('sums slices that share an allocation id', () => {
    const totals = totalsByAllocationId([
      {
        repayments: [{ allocationId: 'pay-1', amountCents: 500000 }],
      },
      {
        repayments: [
          { allocationId: 'pay-1', amountCents: 500000 },
          { allocationId: null, amountCents: 200000 },
        ],
      },
    ]);

    expect(totals['pay-1']).toBe(1000000);
  });
});

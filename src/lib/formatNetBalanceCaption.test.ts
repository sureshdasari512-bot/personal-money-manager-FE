import { describe, expect, it } from 'vitest';
import { formatNetBalanceCaption } from './formatNetBalanceCaption';

describe('formatNetBalanceCaption', () => {
  it('says they owe you when the net is positive', () => {
    expect(formatNetBalanceCaption(50000)).toBe('They owe you');
  });

  it('says you owe them when the net is negative', () => {
    expect(formatNetBalanceCaption(-20000)).toBe('You owe them');
  });

  it('says settled when the net is zero', () => {
    expect(formatNetBalanceCaption(0)).toBe('Settled');
  });
});

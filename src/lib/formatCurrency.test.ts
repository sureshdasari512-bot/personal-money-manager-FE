import { describe, expect, it } from 'vitest';
import { formatCurrency } from './formatCurrency';

describe('formatCurrency', () => {
  it('formats integer cents as major units', () => {
    const formatted = formatCurrency(250050, 'INR');
    expect(formatted).toContain('2,500.50');
  });
});

import { describe, expect, it } from 'vitest';
import { formatCurrency } from './formatCurrency';

describe('formatCurrency', () => {
  it('formats integer cents as major units with no decimals', () => {
    const formatted = formatCurrency(250050, 'INR');
    expect(formatted).toContain('2,501'); // 250050 paise = ₹2500.50 → rounds to ₹2,501
    expect(formatted).not.toContain('.');
  });

  it('formats whole-rupee amounts with no decimals', () => {
    const formatted = formatCurrency(100000, 'INR'); // ₹1000 exactly
    expect(formatted).toContain('1,000');
    expect(formatted).not.toContain('.');
  });

  it('formats zero', () => {
    const formatted = formatCurrency(0, 'INR');
    expect(formatted).toContain('0');
    expect(formatted).not.toContain('.');
  });
});

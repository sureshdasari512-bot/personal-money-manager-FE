import { describe, expect, it } from 'vitest';
import { formatDate, formatLoanWhen, formatPaymentWhen, formatTime } from './formatDate';

describe('formatLoanWhen', () => {
  it('says when money was lent, not paid', () => {
    expect(formatLoanWhen('lend', '2026-08-01', 'en-GB')).toBe('Lent on 1 Aug 2026');
  });

  it('says when money was borrowed', () => {
    expect(formatLoanWhen('borrow', '2026-08-01', 'en-GB')).toBe('Borrowed on 1 Aug 2026');
  });
});

describe('formatDate', () => {
  it('formats a date-only value without shifting the calendar day', () => {
    expect(formatDate('2026-09-09', 'en-GB')).toBe('9 Sept 2026');
  });
});

describe('formatTime', () => {
  it('formats a 12-hour clock time', () => {
    const value = new Date(2026, 8, 9, 10, 34);
    expect(formatTime(value, 'en-IN')).toMatch(/10:34/i);
    expect(formatTime(value, 'en-IN').toLowerCase()).toMatch(/am/);
  });
});

describe('formatPaymentWhen', () => {
  it('combines the payment date and recorded time when they are the same day', () => {
    const recordedAt = new Date(2020, 0, 15, 10, 34).toISOString();
    expect(formatPaymentWhen('2020-01-15', recordedAt, 'en-GB')).toBe(
      'Paid 15 Jan 2020 at 10:34 am',
    );
  });

  it('says today when the payment was recorded today', () => {
    const now = new Date();
    const paidOn = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const caption = formatPaymentWhen(paidOn, now.toISOString(), 'en-IN');
    expect(caption.startsWith('Paid today at ')).toBe(true);
  });

  it('keeps a backdated payment date separate from the recorded clock time', () => {
    const recordedAt = new Date(2020, 6, 15, 10, 34).toISOString();
    expect(formatPaymentWhen('2020-01-15', recordedAt, 'en-GB')).toBe(
      'Paid 15 Jan 2020 · recorded 15 Jul 2020 at 10:34 am',
    );
  });
});

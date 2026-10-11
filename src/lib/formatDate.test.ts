import { describe, expect, it } from 'vitest';
import { formatDate, formatLoanWhen, formatPaymentWhen, formatTime } from './formatDate';

describe('formatDate', () => {
  it('formats a date-only value as "5 Sept 2026"', () => {
    expect(formatDate('2026-09-05')).toBe('5 Sept 2026');
  });

  it('does not shift the calendar day due to UTC offset', () => {
    expect(formatDate('2026-09-09')).toBe('9 Sept 2026');
  });

  it('formats a date in a different month correctly', () => {
    expect(formatDate('2026-08-01')).toBe('1 Aug 2026');
  });
});

describe('formatLoanWhen', () => {
  it('prefixes lend dates with "Lent on"', () => {
    expect(formatLoanWhen('lend', '2026-08-01')).toBe('Lent on 1 Aug 2026');
  });

  it('prefixes borrow dates with "Borrowed on"', () => {
    expect(formatLoanWhen('borrow', '2026-08-01')).toBe('Borrowed on 1 Aug 2026');
  });
});

describe('formatTime', () => {
  it('formats a 12-hour clock time with am/pm', () => {
    const value = new Date(2026, 8, 9, 10, 34);
    expect(formatTime(value)).toMatch(/10:34/i);
    expect(formatTime(value).toLowerCase()).toMatch(/am/);
  });
});

describe('formatPaymentWhen', () => {
  it('combines the payment date and recorded time when on the same day', () => {
    const recordedAt = new Date(2020, 0, 15, 10, 34).toISOString();
    expect(formatPaymentWhen('2020-01-15', recordedAt)).toBe(
      'Paid 15 Jan 2020 at 10:34 am',
    );
  });

  it('says "today" when the payment was recorded today', () => {
    const now = new Date();
    const paidOn = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const caption = formatPaymentWhen(paidOn, now.toISOString());
    expect(caption.startsWith('Paid today at ')).toBe(true);
  });

  it('keeps a backdated payment date separate from the recorded clock time', () => {
    const recordedAt = new Date(2020, 6, 15, 10, 34).toISOString();
    expect(formatPaymentWhen('2020-01-15', recordedAt)).toBe(
      'Paid 15 Jan 2020 · recorded 15 Jul 2020 at 10:34 am',
    );
  });
});

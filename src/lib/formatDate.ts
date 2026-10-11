/**
 * Single source of truth for all date/time display in the app.
 *
 * All functions use `en-GB` locale so the format is always:
 *   - Date:    "5 Sept 2026"
 *   - Time:    "10:34 am"
 *   - Payment: "Paid 5 Sept 2026 at 10:34 am"
 *
 * Never call `toLocaleDateString`, `toLocaleString`, or
 * `Intl.DateTimeFormat` directly in a component — use these instead.
 */

const LOCALE = 'en-GB' as const;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Formats an ISO date string as "5 Sept 2026".
 * Date-only values (YYYY-MM-DD) are parsed as local calendar days so a
 * due date never shifts when the browser timezone is behind UTC.
 *
 * @param value - ISO date (YYYY-MM-DD) or datetime string
 * @returns Formatted date, e.g. "5 Sept 2026"
 */
export function formatDate(value: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parseDateValue(value));
}

/**
 * Labels the loan date so it is not mistaken for a payment date.
 *
 * @param type - 'lend' or 'borrow'
 * @param transactionDate - Calendar day the money moved (YYYY-MM-DD)
 * @returns e.g. "Lent on 5 Sept 2026" or "Borrowed on 5 Sept 2026"
 */
export function formatLoanWhen(type: 'lend' | 'borrow', transactionDate: string): string {
  const day = formatDate(transactionDate);
  return type === 'lend' ? `Lent on ${day}` : `Borrowed on ${day}`;
}

/**
 * Formats a clock time in 12-hour form.
 *
 * @param value - Date instance
 * @returns e.g. "10:34 am"
 */
export function formatTime(value: Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(value);
}

/**
 * Builds a human-readable payment caption combining the calendar date the
 * user chose and the time the record was saved.
 *
 * Same-day:  "Paid today at 10:34 am"
 * Past day:  "Paid 5 Sept 2026 at 10:34 am"
 * Backdated: "Paid 15 Jan 2020 · recorded 15 Jul 2020 at 10:34 am"
 *
 * @param paidOn     - Payment calendar date (YYYY-MM-DD)
 * @param recordedAt - Server ISO timestamp when the repayment was saved
 * @returns Client-facing payment caption
 */
export function formatPaymentWhen(paidOn: string, recordedAt: string): string {
  const paidLabel = formatFriendlyDay(paidOn);
  const recorded = new Date(recordedAt);

  if (Number.isNaN(recorded.getTime())) {
    return `Paid ${paidLabel}`;
  }

  const timeLabel = formatTime(recorded);
  const paidDay = toLocalIsoDate(parseDateValue(paidOn));
  const recordedDay = toLocalIsoDate(recorded);

  if (paidDay === recordedDay) {
    return `Paid ${paidLabel} at ${timeLabel}`;
  }

  return `Paid ${paidLabel} · recorded ${formatFriendlyDay(recordedAt)} at ${timeLabel}`;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Parses a date-only string as a local calendar day to avoid UTC-shift,
 * or a datetime string as an instant.
 */
function parseDateValue(value: string): Date {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) {
    return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
  }
  return new Date(value);
}

/**
 * Returns "today", "yesterday", or the formatted date string.
 */
function formatFriendlyDay(value: string): string {
  const date = parseDateValue(value);
  const day = toLocalIsoDate(date);

  if (day === toLocalIsoDate(new Date())) {
    return 'today';
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (day === toLocalIsoDate(yesterday)) {
    return 'yesterday';
  }

  return formatDate(value);
}

/**
 * Local calendar date as YYYY-MM-DD from a Date instance.
 */
function toLocalIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

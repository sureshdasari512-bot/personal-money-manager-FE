/**
 * Labels the loan date so it is not mistaken for a payment date.
 *
 * @param type - Lend or borrow
 * @param transactionDate - Calendar day the money moved
 * @param locales - Locale for the date; defaults to the browser locale
 * @returns Client-facing line such as `Lent on 1 Aug 2026`
 */
export function formatLoanWhen(
  type: 'lend' | 'borrow',
  transactionDate: string,
  locales?: Intl.LocalesArgument,
): string {
  const day = formatDate(transactionDate, locales);
  return type === 'lend' ? `Lent on ${day}` : `Borrowed on ${day}`;
}

/**
 * Formats an ISO date string for display.
 * Date-only values (`YYYY-MM-DD`) are parsed as local calendar days
 * so a due date does not shift when the browser is behind UTC.
 *
 * @param value - ISO date or datetime
 * @param locales - Locale for month names; defaults to the browser locale
 * @returns Localized date string
 */
export function formatDate(value: string, locales?: Intl.LocalesArgument): string {
  return new Intl.DateTimeFormat(locales, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(parseDateValue(value));
}

/**
 * Formats a clock time in 12-hour form so clients can read it without guessing.
 *
 * @param value - Instant to format
 * @param locales - Locale for AM/PM style; defaults to the browser locale
 * @returns Localized time such as `10:34 am`
 */
export function formatTime(value: Date, locales?: Intl.LocalesArgument): string {
  return new Intl.DateTimeFormat(locales, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(value);
}

/**
 * Builds a payment caption: calendar day the client chose, plus the time it was recorded.
 * Does not attach the recorded clock time to a different payment date (backdated entries).
 *
 * @param paidOn - Payment calendar date (`YYYY-MM-DD`)
 * @param recordedAt - Server timestamp when the repayment was saved
 * @param locales - Locale for date and time; defaults to the browser locale
 * @returns Client-facing line such as `Paid today at 10:34 am`
 */
export function formatPaymentWhen(
  paidOn: string,
  recordedAt: string,
  locales?: Intl.LocalesArgument,
): string {
  const paidLabel = formatFriendlyDay(paidOn, locales);
  const recorded = new Date(recordedAt);

  if (Number.isNaN(recorded.getTime())) {
    return `Paid ${paidLabel}`;
  }

  const timeLabel = formatTime(recorded, locales);
  const paidDay = toLocalIsoDate(parseDateValue(paidOn));
  const recordedDay = toLocalIsoDate(recorded);

  if (paidDay === recordedDay) {
    return `Paid ${paidLabel} at ${timeLabel}`;
  }

  return `Paid ${paidLabel} · recorded ${formatFriendlyDay(recordedAt, locales)} at ${timeLabel}`;
}

/**
 * Parses a date-only string as a local calendar day, or a datetime as an instant.
 *
 * @param value - ISO date or datetime
 * @returns Local Date
 */
function parseDateValue(value: string): Date {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) {
    return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
  }
  return new Date(value);
}

/**
 * Formats a day as Today, Yesterday, or a short date.
 *
 * @param value - ISO date or datetime
 * @param locales - Locale for the fallback date
 * @returns Friendly day label
 */
function formatFriendlyDay(value: string, locales?: Intl.LocalesArgument): string {
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

  return formatDate(value, locales);
}

/**
 * Local calendar date as `YYYY-MM-DD`.
 *
 * @param date - Instant in the user's timezone
 * @returns Date-only string
 */
function toLocalIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

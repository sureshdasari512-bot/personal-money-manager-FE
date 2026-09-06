/**
 * Formats an ISO date string for display.
 * Date-only values (`YYYY-MM-DD`) are parsed as local calendar days
 * so a due date does not shift when the browser is behind UTC.
 *
 * @param value - ISO date or datetime
 * @returns Localized date string
 */
export function formatDate(value: string): string {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.slice(0, 10));
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value);

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

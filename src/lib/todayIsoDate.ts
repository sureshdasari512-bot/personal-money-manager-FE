/**
 * Local calendar date as `YYYY-MM-DD` for date inputs and overdue checks.
 *
 * @returns Today's date in the user's timezone
 */
export function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

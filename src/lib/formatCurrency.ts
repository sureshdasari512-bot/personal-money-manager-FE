/**
 * Formats an integer cent/paise amount for display. Never format raw floats.
 *
 * @param amountCents - Amount in the smallest currency unit
 * @param currency - ISO currency code for the deployment (single-currency)
 * @returns Localized currency string
 */
export function formatCurrency(amountCents: number, currency = 'INR'): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
  }).format(amountCents / 100);
}

/**
 * Explains a signed net balance in client language.
 *
 * @param netBalanceCents - Positive = they owe you; negative = you owe them
 * @returns Caption for the dashboard people list
 */
export function formatNetBalanceCaption(netBalanceCents: number): string {
  if (netBalanceCents > 0) {
    return 'They owe you';
  }
  if (netBalanceCents < 0) {
    return 'You owe them';
  }
  return 'Settled';
}

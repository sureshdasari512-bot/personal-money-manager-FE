import { tokens } from '../lib/design-tokens';
import { formatCurrency } from '../lib/formatCurrency';

interface BalanceBreakdownProps {
  theyOweYouCents: number;
  youOweThemCents: number;
  netBalanceCents: number;
  scope?: 'overall' | 'person';
}

/**
 * Shows lent vs borrowed outstanding separately, then the final net.
 * Use this wherever a single signed number would mix the two sides.
 *
 * @param theyOweYouCents - Outstanding lends (they still owe you)
 * @param youOweThemCents - Outstanding borrows (you still owe them)
 * @param netBalanceCents - Lends minus borrows
 * @param scope - Home screen vs one person
 */
export function BalanceBreakdown({
  theyOweYouCents,
  youOweThemCents,
  netBalanceCents,
  scope = 'overall',
}: BalanceBreakdownProps) {
  return (
    <section className="flex flex-col gap-3" aria-label="Balance breakdown">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <AmountCard
          eyebrow="They owe you"
          amountCents={theyOweYouCents}
          hint="Money you lent that is still outstanding"
          tone="lend"
        />
        <AmountCard
          eyebrow="You owe them"
          amountCents={youOweThemCents}
          hint="Money you borrowed that is still outstanding"
          tone="borrow"
        />
      </div>
      <div
        className="p-5 sm:p-6"
        style={{
          background: tokens.color.surface,
          borderRadius: tokens.radius.lg,
          boxShadow: `inset 0 0 0 1px ${tokens.color.line}`,
        }}
      >
        <p className="text-sm font-medium" style={{ color: tokens.color.muted }}>
          Final amount
        </p>
        <p
          className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl"
          style={{ color: tokens.color.ink }}
        >
          {formatCurrency(netBalanceCents)}
        </p>
        <p className="mt-2 text-sm" style={{ color: tokens.color.muted }}>
          {netCaption(netBalanceCents, scope)}
        </p>
      </div>
    </section>
  );
}

interface AmountCardProps {
  eyebrow: string;
  amountCents: number;
  hint: string;
  tone: 'lend' | 'borrow';
}

/**
 * One side of the lend/borrow split.
 *
 * @param eyebrow - Short label
 * @param amountCents - Outstanding on that side
 * @param hint - Plain-language explanation
 * @param tone - Lend vs borrow color
 */
function AmountCard({ eyebrow, amountCents, hint, tone }: AmountCardProps) {
  const accent = tone === 'lend' ? tokens.color.success : tokens.color.info;

  return (
    <div
      className="p-4 sm:p-5"
      style={{
        background: tone === 'lend' ? tokens.color.successSoft : tokens.color.infoSoft,
        borderRadius: tokens.radius.lg,
        boxShadow: `inset 0 0 0 1px ${tone === 'lend' ? tokens.color.successSoft : tokens.color.infoSoft}`,
      }}
    >
      <p className="text-sm font-semibold" style={{ color: accent }}>
        {eyebrow}
      </p>
      <p className="mt-1 text-2xl font-semibold tracking-tight" style={{ color: tokens.color.ink }}>
        {formatCurrency(amountCents)}
      </p>
      <p className="mt-1 text-sm" style={{ color: tokens.color.muted }}>
        {hint}
      </p>
    </div>
  );
}

/**
 * Explains the signed final amount.
 *
 * @param netBalanceCents - Lends minus borrows
 * @param scope - Home screen vs one person
 * @returns Client-facing sentence
 */
function netCaption(netBalanceCents: number, scope: 'overall' | 'person'): string {
  if (netBalanceCents > 0) {
    return scope === 'person'
      ? 'After both sides, they still owe you this much.'
      : 'After both sides, people still owe you this much.';
  }
  if (netBalanceCents < 0) {
    return scope === 'person'
      ? 'After both sides, you still owe them this much.'
      : 'After both sides, you still owe people this much.';
  }
  return scope === 'person'
    ? 'After both sides, you are settled with this person.'
    : 'After both sides, you are settled overall.';
}

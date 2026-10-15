import { tokens } from '../lib/design-tokens';
import { formatCurrency } from '../lib/formatCurrency';

interface BalanceBreakdownProps {
  theyOweYouCents: number;
  /** Principal-only portion of theyOweYouCents — shown in brackets when interest exists */
  theyOweYouPrincipalCents?: number;
  youOweThemCents: number;
  /** Principal-only portion of youOweThemCents — shown in brackets when interest exists */
  youOweThemPrincipalCents?: number;
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
  theyOweYouPrincipalCents,
  youOweThemCents,
  youOweThemPrincipalCents,
  netBalanceCents,
  scope = 'overall',
}: BalanceBreakdownProps) {
  return (
    <section className="flex flex-col gap-3" aria-label="Balance breakdown">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <AmountCard
          eyebrow="Lent"
          amountCents={theyOweYouCents}
          principalCents={theyOweYouPrincipalCents}
          hint="Total to collect (principal + interest)"
          tone="lend"
        />
        <AmountCard
          eyebrow="Borrowed"
          amountCents={youOweThemCents}
          principalCents={youOweThemPrincipalCents}
          hint="Amount you still need to return"
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
  /** When provided, shown in brackets as the principal-only figure */
  principalCents?: number;
  hint: string;
  tone: 'lend' | 'borrow';
}

/**
 * One side of the lend/borrow split.
 *
 * @param eyebrow       - Short label
 * @param amountCents   - Live total (principal + interest)
 * @param principalCents - Principal-only, shown in brackets when different from amountCents
 * @param hint          - Plain-language explanation
 * @param tone          - Lend vs borrow color
 */
function AmountCard({ eyebrow, amountCents, principalCents, hint, tone }: AmountCardProps) {
  const accent = tone === 'lend' ? tokens.color.success : tokens.color.info;
  const showPrincipal =
    principalCents !== undefined && principalCents !== amountCents && principalCents > 0;

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
        {showPrincipal ? (
          <span className="ml-1.5 text-sm font-normal" style={{ color: tokens.color.muted }}>
            ({formatCurrency(principalCents)} principal)
          </span>
        ) : null}
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
    return 'After both sides, this is the net amount to collect.';
  }
  if (netBalanceCents < 0) {
    return 'After both sides, this is the net amount to return.';
  }
  return scope === 'person'
    ? 'After both sides, you are settled with this person.'
    : 'After both sides, you are settled overall.';
}

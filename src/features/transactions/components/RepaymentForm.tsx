import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '../../../components/Button';
import { FormError } from '../../../components/FormError';
import { Input } from '../../../components/Input';
import { tokens } from '../../../lib/design-tokens';
import { formatCurrency } from '../../../lib/formatCurrency';
import { todayIsoDate } from '../../../lib/todayIsoDate';
import type { FieldErrors } from '../../../types/errors';
import { previewRepayment } from '../api';
import type { CreateRepaymentPayload, RepaymentPreview } from '../types';

interface RepaymentFormProps {
  transactionId: string;
  /** Total outstanding = principal + accrued interest combined */
  totalOwedCents: number;
  accruedInterestCents: number;
  isSaving: boolean;
  fieldErrors?: FieldErrors;
  globalError?: string | null;
  submitLabel?: string;
  onSubmit: (payload: CreateRepaymentPayload) => Promise<void>;
}

/**
 * Repayment form that fetches a live preview breakdown as the user types.
 * Interest is always cleared first; remaining amount reduces principal.
 * The breakdown is shown before the user confirms so they know exactly
 * how their payment is allocated.
 *
 * @param transactionId - Used to fetch the server-side preview
 * @param totalOwedCents - Principal + accrued interest (max the user can pay)
 * @param accruedInterestCents - Interest portion of the total owed
 */
export function RepaymentForm({
  transactionId,
  totalOwedCents,
  accruedInterestCents,
  isSaving,
  fieldErrors = {},
  globalError,
  submitLabel = 'Confirm repayment',
  onSubmit,
}: RepaymentFormProps) {
  const [amount, setAmount] = useState('');
  const [paidOn, setPaidOn] = useState(todayIsoDate());
  const [notes, setNotes] = useState('');
  const [amountError, setAmountError] = useState<string | undefined>();
  const [preview, setPreview] = useState<RepaymentPreview | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch the preview from the server whenever the amount changes.
  const fetchPreview = useCallback(
    async (rawAmount: string) => {
      const amountCents = Math.round(Number(rawAmount) * 100);
      if (!Number.isFinite(amountCents) || amountCents <= 0) {
        setPreview(null);
        return;
      }
      if (amountCents > totalOwedCents) {
        setPreview(null);
        return;
      }
      setIsPreviewLoading(true);
      try {
        const res = await previewRepayment(transactionId, amountCents);
        setPreview(res.preview);
      } catch {
        setPreview(null);
      } finally {
        setIsPreviewLoading(false);
      }
    },
    [transactionId, totalOwedCents],
  );

  // Debounce preview fetch by 400 ms so we don't fire on every keystroke.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!amount) {
      setPreview(null);
      return;
    }
    debounceRef.current = setTimeout(() => {
      void fetchPreview(amount);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [amount, fetchPreview]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const amountCents = Math.round(Number(amount) * 100);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      setAmountError('Amount must be greater than 0');
      return;
    }
    if (amountCents > totalOwedCents) {
      setAmountError(`Amount cannot exceed the total to pay (${formatCurrency(totalOwedCents)})`);
      return;
    }
    setAmountError(undefined);
    await onSubmit({
      amountCents,
      paidOn,
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    });
  }

  const hasInterest = accruedInterestCents > 0;

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <FormError message={globalError} />

      {/* Total owed summary */}
      <div
        className="rounded-xl p-3"
        style={{ background: tokens.color.canvas }}
      >
        <div className="flex items-center justify-between text-sm">
          <span style={{ color: tokens.color.muted }}>Outstanding principal</span>
          <span className="font-medium" style={{ color: tokens.color.ink }}>
            {formatCurrency(totalOwedCents - accruedInterestCents)}
          </span>
        </div>
        {hasInterest ? (
          <div className="mt-1 flex items-center justify-between text-sm">
            <span style={{ color: tokens.color.warning }}>Accrued interest</span>
            <span className="font-medium" style={{ color: tokens.color.warning }}>
              + {formatCurrency(accruedInterestCents)}
            </span>
          </div>
        ) : null}
        <div
          className="mt-2 flex items-center justify-between border-t pt-2 text-sm font-semibold"
          style={{ borderColor: tokens.color.line }}
        >
          <span style={{ color: tokens.color.ink }}>Total to pay</span>
          <span style={{ color: tokens.color.ink }}>{formatCurrency(totalOwedCents)}</span>
        </div>
      </div>

      <Input
        label="Amount"
        name="amountCents"
        type="number"
        inputMode="decimal"
        min="0.01"
        step="0.01"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        error={amountError ?? fieldErrors.amountCents}
        required
      />

      {/* Live breakdown — only shown when interest exists and amount is valid */}
      {hasInterest && preview ? (
        <BreakdownCard preview={preview} isLoading={isPreviewLoading} />
      ) : null}
      {hasInterest && isPreviewLoading && !preview ? (
        <p className="text-xs" style={{ color: tokens.color.muted }}>
          Calculating breakdown…
        </p>
      ) : null}

      <Input
        label="Payment date"
        name="paidOn"
        type="date"
        value={paidOn}
        onChange={(e) => setPaidOn(e.target.value)}
        error={fieldErrors.paidOn}
        required
      />
      <Input
        label="Notes (optional)"
        name="notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        error={fieldErrors.notes}
      />
      <Button type="submit" isLoading={isSaving}>
        {submitLabel}
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Breakdown card
// ---------------------------------------------------------------------------

function BreakdownCard({
  preview,
  isLoading,
}: {
  preview: RepaymentPreview;
  isLoading: boolean;
}) {
  return (
    <div
      className="rounded-xl p-3"
      style={{
        background: tokens.color.warningSoft,
        border: `1px solid #fde68a`,
        opacity: isLoading ? 0.6 : 1,
        transition: 'opacity 150ms',
      }}
    >
      <p
        className="mb-2 text-xs font-semibold uppercase tracking-wide"
        style={{ color: tokens.color.warning }}
      >
        How this payment is applied
      </p>

      {preview.towardInterestCents > 0 ? (
        <Row
          label="Clears accrued interest"
          value={formatCurrency(preview.towardInterestCents)}
          valueColor={tokens.color.warning}
        />
      ) : null}

      {preview.towardPrincipalCents > 0 ? (
        <Row
          label="Reduces principal"
          value={formatCurrency(preview.towardPrincipalCents)}
          valueColor={tokens.color.success}
        />
      ) : null}

      <div
        className="mt-2 border-t pt-2"
        style={{ borderColor: '#fde68a' }}
      >
        <Row
          label="Principal remaining after"
          value={formatCurrency(preview.outstandingPrincipalAfter)}
          valueColor={tokens.color.ink}
          bold
        />
        {preview.remainingInterestCents > 0 ? (
          <Row
            label="Interest still unpaid"
            value={formatCurrency(preview.remainingInterestCents)}
            valueColor={tokens.color.warning}
            bold
          />
        ) : null}
      </div>

      {preview.willFullySettle ? (
        <p
          className="mt-2 rounded-lg px-2 py-1 text-xs font-semibold"
          style={{ background: tokens.color.successSoft, color: tokens.color.success }}
        >
          ✓ This payment will fully settle the loan including all interest
        </p>
      ) : null}
    </div>
  );
}

function Row({
  label,
  value,
  valueColor,
  bold = false,
}: {
  label: string;
  value: string;
  valueColor: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-0.5 text-sm">
      <span style={{ color: tokens.color.muted }}>{label}</span>
      <span
        className={bold ? 'font-semibold' : 'font-medium'}
        style={{ color: valueColor }}
      >
        {value}
      </span>
    </div>
  );
}

import { FormEvent, useState } from 'react';
import { Button } from '../../../components/Button';
import { FormError } from '../../../components/FormError';
import { Input } from '../../../components/Input';
import { tokens } from '../../../lib/design-tokens';
import { bpsToPercent, percentToBps, PERIOD_LABELS } from '../../../lib/simpleInterest';
import { todayIsoDate } from '../../../lib/todayIsoDate';
import type { FieldErrors } from '../../../types/errors';
import type {
  CreateTransactionPayload,
  InterestConfigPayload,
  InterestPeriod,
  TransactionFormValues,
  TransactionType,
} from '../types';

interface TransactionFormProps {
  personId: string;
  initialValues?: TransactionFormValues;
  /** Pre-filled interest config — passed when editing a loan that already has interest */
  initialInterest?: InterestConfigPayload | null;
  isSaving: boolean;
  fieldErrors?: FieldErrors;
  globalError?: string | null;
  submitLabel?: string;
  onSubmit: (payload: CreateTransactionPayload) => Promise<void>;
}

const PERIOD_OPTIONS: { value: InterestPeriod; label: string; hint: string }[] = [
  { value: 'monthly',     label: PERIOD_LABELS.monthly,     hint: 'Pay every month' },
  { value: 'quarterly',   label: PERIOD_LABELS.quarterly,   hint: 'Pay every 3 months' },
  { value: 'half_yearly', label: PERIOD_LABELS.half_yearly, hint: 'Pay every 6 months' },
  { value: 'yearly',      label: PERIOD_LABELS.yearly,      hint: 'Pay once a year' },
];

/**
 * Lend / borrow form with an optional inline interest section.
 * The interest toggle is shown on both create AND edit.
 * On create  → transaction is saved first, then interest config is set.
 * On edit    → interest section is pre-filled from initialInterest;
 *              parent calls upsertInterestConfig after updateTransaction.
 */
export function TransactionForm({
  personId,
  initialValues,
  initialInterest,
  isSaving,
  fieldErrors = {},
  globalError,
  submitLabel = 'Save transaction',
  onSubmit,
}: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>(initialValues?.type ?? 'lend');
  const [amount, setAmount] = useState(initialValues?.amount ?? '');
  const [transactionDate, setTransactionDate] = useState(
    initialValues?.transactionDate ?? todayIsoDate(),
  );
  const [dueDate, setDueDate] = useState(initialValues?.dueDate ?? '');
  const [notes, setNotes] = useState(initialValues?.notes ?? '');

  // Interest — pre-filled when editing a loan that already has interest
  const [withInterest, setWithInterest] = useState(Boolean(initialInterest));
  const [ratePercent, setRatePercent] = useState(
    initialInterest ? bpsToPercent(initialInterest.interestRateBps) : '',
  );
  const [period, setPeriod] = useState<InterestPeriod>(
    initialInterest?.interestPeriod ?? 'monthly',
  );

  const [amountError, setAmountError] = useState<string | undefined>();
  const [dateError, setDateError] = useState<string | undefined>();
  const [rateError, setRateError] = useState<string | undefined>();

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const amountCents = Math.round(Number(amount) * 100);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      setAmountError('Amount must be greater than 0');
      return;
    }
    setAmountError(undefined);

    if (dueDate && dueDate < transactionDate) {
      setDateError('Due date cannot be before the transaction date');
      return;
    }
    setDateError(undefined);

    let interest: InterestConfigPayload | undefined;
    if (withInterest) {
      const bps = percentToBps(ratePercent);
      if (bps === null) {
        setRateError('Enter a valid rate greater than 0%');
        return;
      }
      if (bps > 5_000) {
        setRateError('Monthly rate cannot exceed 50%');
        return;
      }
      setRateError(undefined);
      interest = { interestRateBps: bps, interestPeriod: period };
    }

    await onSubmit({
      personId,
      type,
      amountCents,
      transactionDate,
      ...(dueDate ? { dueDate } : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
      ...(interest ? { interest } : {}),
    });
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <FormError message={globalError} />

      {/* Type */}
      <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
        Type
        <select
          name="type"
          className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-base shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          value={type}
          onChange={(e) => setType(e.target.value as TransactionType)}
        >
          <option value="lend">Lent</option>
          <option value="borrow">Borrowed</option>
        </select>
        {fieldErrors.type ? <p className="text-sm text-red-600">{fieldErrors.type}</p> : null}
      </label>

      {/* Amount */}
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

      {/* Transaction date */}
      <Input
        label={type === 'lend' ? 'Date you lent the money' : 'Date you borrowed the money'}
        name="transactionDate"
        type="date"
        value={transactionDate}
        onChange={(e) => setTransactionDate(e.target.value)}
        error={fieldErrors.transactionDate}
        required
      />

      {/* Due date */}
      <Input
        label="Due date (optional)"
        name="dueDate"
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        error={dateError ?? fieldErrors.dueDate}
      />

      {/* Notes */}
      <Input
        label="Notes (optional)"
        name="notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        error={fieldErrors.notes}
      />

      {/* ── Interest section (create + edit) ── */}
      <div
        className="rounded-xl"
        style={{
          border: `1px solid ${withInterest ? tokens.color.primary : tokens.color.line}`,
          transition: 'border-color 200ms',
        }}
      >
        {/* Toggle */}
        <button
          type="button"
          onClick={() => setWithInterest((v) => !v)}
          className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition-colors hover:bg-slate-50"
        >
          <div>
            <p className="text-sm font-semibold" style={{ color: tokens.color.ink }}>
              {withInterest ? 'Interest configured' : 'Add interest'}
            </p>
            <p className="text-xs" style={{ color: tokens.color.muted }}>
              {withInterest
                ? 'Daily interest accrues from the lend date'
                : 'Optional — skip if no interest applies'}
            </p>
          </div>
          <span
            className="flex h-5 w-9 items-center rounded-full transition-colors"
            style={{ background: withInterest ? tokens.color.primary : tokens.color.line }}
          >
            <span
              className="h-4 w-4 rounded-full bg-white shadow transition-transform"
              style={{ transform: withInterest ? 'translateX(18px)' : 'translateX(2px)' }}
            />
          </span>
        </button>

        {/* Expandable fields */}
        {withInterest ? (
          <div
            className="flex flex-col gap-4 px-4 pb-4"
            style={{ borderTop: `1px solid ${tokens.color.line}` }}
          >
            <div className="pt-3">
              <Input
                label="Monthly interest rate (%)"
                name="interestRate"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                max="50"
                placeholder="e.g. 2"
                value={ratePercent}
                onChange={(e) => setRatePercent(e.target.value)}
                error={rateError ?? fieldErrors.interestRateBps}
                hint="e.g. 2 means 2% per month — accrues daily (÷ 30)"
                required
              />
            </div>

            {/* Period picker */}
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-700">Interest period</span>
              <div className="grid grid-cols-2 gap-2">
                {PERIOD_OPTIONS.map(({ value, label, hint }) => {
                  const selected = period === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPeriod(value)}
                      className="flex flex-col items-start rounded-lg border px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                      style={{
                        borderColor: selected ? tokens.color.primary : tokens.color.line,
                        background: selected ? tokens.color.primarySoft : tokens.color.surface,
                      }}
                      aria-pressed={selected}
                    >
                      <span
                        className="font-semibold"
                        style={{ color: selected ? tokens.color.primary : tokens.color.ink }}
                      >
                        {label}
                      </span>
                      <span className="text-xs" style={{ color: tokens.color.muted }}>
                        {hint}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Daily rate preview */}
            {ratePercent && Number(ratePercent) > 0 ? (
              <p
                className="rounded-lg px-3 py-2 text-xs"
                style={{ background: tokens.color.canvas, color: tokens.color.muted }}
              >
                Daily rate = {Number(ratePercent).toFixed(2)}% ÷ 30 — same divisor every
                month including February
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <Button type="submit" isLoading={isSaving}>
        {submitLabel}
      </Button>
    </form>
  );
}

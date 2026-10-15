import { type FormEvent, useMemo, useState } from 'react';
import { Button } from '../../../components/Button';
import { FormError } from '../../../components/FormError';
import { Input } from '../../../components/Input';
import { tokens } from '../../../lib/design-tokens';
import { formatDate } from '../../../lib/formatDate';
import { todayIsoDate } from '../../../lib/todayIsoDate';
import { bpsToPercent, percentToBps, PERIOD_LABELS } from '../../../lib/simpleInterest';
import type { FieldErrors } from '../../../types/errors';
import type { InterestConfigPayload, InterestPeriod, LedgerTransaction } from '../types';

interface InterestConfigFormProps {
  transaction: LedgerTransaction;
  isSaving: boolean;
  fieldErrors?: FieldErrors;
  globalError?: string | null;
  onSubmit: (payload: InterestConfigPayload) => Promise<void>;
  onCancel: () => void;
}

const PERIOD_OPTIONS: { value: InterestPeriod; label: string; hint: string }[] = [
  { value: 'monthly', label: PERIOD_LABELS.monthly, hint: 'Pay every month' },
  { value: 'quarterly', label: PERIOD_LABELS.quarterly, hint: 'Pay every 3 months' },
  { value: 'half_yearly', label: PERIOD_LABELS.half_yearly, hint: 'Pay every 6 months' },
  { value: 'yearly', label: PERIOD_LABELS.yearly, hint: 'Pay once a year' },
];

/**
 * Form to set or update simple interest on a transaction.
 * Converts user-facing % to basis points before submit.
 *
 * Editing an existing config:
 *  - Shows the current rate so the user knows what they're changing FROM.
 *  - Exposes an "Apply from" date picker (default = today) so the user can
 *    choose when the new rate takes effect. Allowed range: loan date → today.
 *  - The date picker is hidden when only the period changes (no rate change),
 *    because period changes don't create a new rate-history segment.
 *  - Shows a contextual note explaining what will happen on submit.
 *
 * Purely presentational — all state mutations flow through callbacks.
 *
 * @param transaction  - The transaction being configured
 * @param isSaving     - In-flight flag
 * @param fieldErrors  - Per-field errors from the API
 * @param globalError  - Form-level error from the API
 * @param onSubmit     - Called with bps + period + optional effectiveDate
 * @param onCancel     - Called when the user dismisses without saving
 */
export function InterestConfigForm({
  transaction,
  isSaving,
  fieldErrors = {},
  globalError,
  onSubmit,
  onCancel,
}: InterestConfigFormProps) {
  const existing = transaction.interestConfig;
  const today = todayIsoDate();

  const [ratePercent, setRatePercent] = useState<string>(
    existing ? bpsToPercent(existing.interestRateBps) : '',
  );
  const [period, setPeriod] = useState<InterestPeriod>(
    existing?.interestPeriod ?? 'monthly',
  );
  // Default effective date = today; only sent to the server when a rate change happens.
  const [effectiveDate, setEffectiveDate] = useState<string>(today);
  const [rateError, setRateError] = useState<string | undefined>();
  const [effectiveDateError, setEffectiveDateError] = useState<string | undefined>();

  // Detect whether the user has actually changed the rate value.
  const newBps = useMemo(() => percentToBps(ratePercent), [ratePercent]);
  const rateActuallyChanged =
    existing !== null && newBps !== null && newBps !== existing.interestRateBps;

  /**
   * Validates all fields client-side and submits.
   *
   * @param event - Form submit event
   */
  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    let hasError = false;

    const bps = percentToBps(ratePercent);
    if (bps === null) {
      setRateError('Enter a valid rate greater than 0%');
      hasError = true;
    } else if (bps > 5_000) {
      setRateError('Monthly rate cannot exceed 50% per month');
      hasError = true;
    } else {
      setRateError(undefined);
    }

    // Only validate effectiveDate when editing AND the rate actually changed.
    // Period-only changes don't create a new rate segment, so no date needed.
    if (existing && rateActuallyChanged) {
      if (!effectiveDate) {
        setEffectiveDateError('Apply-from date is required');
        hasError = true;
      } else if (effectiveDate < transaction.transactionDate) {
        setEffectiveDateError(`Date cannot be before the loan date (${formatDate(transaction.transactionDate)})`);
        hasError = true;
      } else if (effectiveDate > today) {
        setEffectiveDateError('Date cannot be in the future');
        hasError = true;
      } else {
        setEffectiveDateError(undefined);
      }
    }

    if (hasError) return;

    const payload: InterestConfigPayload = {
      interestRateBps: bps!,
      interestPeriod: period,
      // Only send effectiveDate when there is an existing config AND the rate changed.
      // First-time setup and period-only changes don't need it.
      ...(existing && rateActuallyChanged ? { effectiveDate } : {}),
    };

    await onSubmit(payload);
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <FormError message={globalError} />

      {/* ── Current rate context (edit mode only) ── */}
      {existing ? (
        <div
          className="flex items-center justify-between rounded-lg px-3 py-2.5"
          style={{
            background: tokens.color.canvas,
            boxShadow: `inset 0 0 0 1px ${tokens.color.line}`,
            borderRadius: tokens.radius.sm,
          }}
        >
          <span className="text-sm" style={{ color: tokens.color.muted }}>
            Current rate
          </span>
          <span className="text-sm font-semibold" style={{ color: tokens.color.ink }}>
            {bpsToPercent(existing.interestRateBps)}% / month · {PERIOD_LABELS[existing.interestPeriod]}
          </span>
        </div>
      ) : null}

      {/* ── Advisory notice (set mode only — not needed in edit, user knows) ── */}
      {!existing ? (
        <p
          className="rounded-lg px-3 py-2.5 text-sm leading-5"
          style={{
            background: tokens.color.warningSoft,
            color: tokens.color.warning,
            borderRadius: tokens.radius.sm,
          }}
        >
          Interest shown here is <strong>advisory only</strong> — it does not
          auto-create repayments. Record repayments manually to cover
          principal + interest.
        </p>
      ) : null}

      {/* ── Rate input ── */}
      <Input
        label={existing ? 'New monthly interest rate (%)' : 'Monthly interest rate (%)'}
        name="interestRateBps"
        type="number"
        inputMode="decimal"
        min="0.01"
        step="0.01"
        max="50"
        placeholder="e.g. 2"
        value={ratePercent}
        onChange={(e) => {
          setRatePercent(e.target.value);
          setRateError(undefined);
        }}
        error={rateError ?? fieldErrors.interestRateBps}
        hint="Monthly rate — e.g. 2 means 2% per month"
        required
      />

      {/* ── Period picker ── */}
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
                <span style={{ color: tokens.color.muted }}>{hint}</span>
              </button>
            );
          })}
        </div>
        {fieldErrors.interestPeriod ? (
          <p className="text-sm text-red-600">{fieldErrors.interestPeriod}</p>
        ) : null}
      </div>

      {/* ── Apply-from date — only when editing AND the rate actually changed ── */}
      {existing && rateActuallyChanged ? (
        <div className="flex flex-col gap-2">
          <Input
            label="Apply new rate from"
            name="effectiveDate"
            type="date"
            value={effectiveDate}
            min={transaction.transactionDate}
            max={today}
            onChange={(e) => {
              setEffectiveDate(e.target.value);
              setEffectiveDateError(undefined);
            }}
            error={effectiveDateError ?? fieldErrors.effectiveDate}
            hint={`Choose when the new rate starts. Loan date: ${formatDate(transaction.transactionDate)}.`}
            required
          />
          {/* Contextual confirmation note */}
          <p
            className="rounded-lg px-3 py-2 text-xs leading-5"
            style={{
              background: tokens.color.infoSoft,
              color: tokens.color.primary,
              borderRadius: tokens.radius.sm,
            }}
          >
            Interest from <strong>{formatDate(transaction.transactionDate)}</strong> to{' '}
            <strong>{effectiveDate ? formatDate(effectiveDate) : '…'}</strong> stays at{' '}
            <strong>{bpsToPercent(existing.interestRateBps)}%</strong>. From{' '}
            <strong>{effectiveDate ? formatDate(effectiveDate) : '…'}</strong> onwards the
            new rate of <strong>{ratePercent || '…'}%</strong> will apply.
          </p>
        </div>
      ) : null}

      {/* ── Period-only change note ── */}
      {existing && !rateActuallyChanged && period !== existing.interestPeriod ? (
        <p
          className="rounded-lg px-3 py-2 text-xs leading-5"
          style={{
            background: tokens.color.canvas,
            color: tokens.color.muted,
            borderRadius: tokens.radius.sm,
            boxShadow: `inset 0 0 0 1px ${tokens.color.line}`,
          }}
        >
          Only the payment period is changing — the interest rate stays at{' '}
          <strong style={{ color: tokens.color.ink }}>
            {bpsToPercent(existing.interestRateBps)}% / month
          </strong>
          . No new rate segment is created.
        </p>
      ) : null}

      <div className="flex gap-2">
        <Button type="submit" isLoading={isSaving} className="flex-1">
          {existing ? 'Update interest' : 'Set interest'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  );
}

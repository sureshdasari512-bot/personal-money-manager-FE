import { type FormEvent, useState } from 'react';
import { Button } from '../../../components/Button';
import { FormError } from '../../../components/FormError';
import { Input } from '../../../components/Input';
import { tokens } from '../../../lib/design-tokens';
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
 * Purely presentational — all state mutations via callbacks.
 *
 * @param transaction  - The transaction being configured
 * @param isSaving     - In-flight flag
 * @param fieldErrors  - Per-field errors from the API
 * @param globalError  - Form-level error from the API
 * @param onSubmit     - Called with bps + period when form is valid
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

  const [ratePercent, setRatePercent] = useState<string>(
    existing ? bpsToPercent(existing.interestRateBps) : '',
  );
  const [period, setPeriod] = useState<InterestPeriod>(
    existing?.interestPeriod ?? 'monthly',
  );
  const [rateError, setRateError] = useState<string | undefined>();

  /**
   * Validates the rate field client-side and submits in basis points.
   *
   * @param event - Form submit event
   */
  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const bps = percentToBps(ratePercent);
    if (bps === null) {
      setRateError('Enter a valid annual rate greater than 0%');
      return;
    }
    if (bps > 5_000) {
      setRateError('Monthly rate cannot exceed 50% per month');
      return;
    }
    setRateError(undefined);
    await onSubmit({ interestRateBps: bps, interestPeriod: period });
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <FormError message={globalError} />

      {/* Advisory notice */}
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

      <Input
        label="Monthly interest rate (%)"
        name="interestRateBps"
        type="number"
        inputMode="decimal"
        min="0.01"
        step="0.01"
        max="50"
        placeholder="e.g. 2"
        value={ratePercent}
        onChange={(e) => setRatePercent(e.target.value)}
        error={rateError ?? fieldErrors.interestRateBps}
        hint="Monthly rate — e.g. 2 means 2% per month"
        required
      />

      {/* Period picker — styled like the type select in TransactionForm */}
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

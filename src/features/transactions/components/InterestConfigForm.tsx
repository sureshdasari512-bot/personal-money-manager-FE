import { FormEvent, useState } from 'react';
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
  onRemove?: () => Promise<void>;
}

const PERIOD_OPTIONS: { value: InterestPeriod; label: string }[] = [
  { value: 'monthly', label: PERIOD_LABELS.monthly },
  { value: 'quarterly', label: PERIOD_LABELS.quarterly },
  { value: 'half_yearly', label: PERIOD_LABELS.half_yearly },
  { value: 'yearly', label: PERIOD_LABELS.yearly },
];

/**
 * Form to set or update simple interest on a transaction.
 * Converts user-facing % to basis points before submit.
 * Supports remove (soft-delete) when an existing config is present.
 *
 * @param transaction  - The transaction being configured
 * @param isSaving     - In-flight flag (disables controls)
 * @param fieldErrors  - Per-field errors from the API
 * @param globalError  - Form-level error from the API
 * @param onSubmit     - Called with bps + period when form is valid
 * @param onRemove     - Called when user removes the interest config (optional)
 */
export function InterestConfigForm({
  transaction,
  isSaving,
  fieldErrors = {},
  globalError,
  onSubmit,
  onRemove,
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
    if (bps > 100_000) {
      setRateError('Interest rate cannot exceed 1000%');
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
        className="rounded-lg px-3 py-2 text-sm"
        style={{
          background: tokens.color.warningSoft,
          color: tokens.color.warning,
          borderRadius: tokens.radius.sm,
        }}
      >
        Interest is <strong>advisory only</strong> — it does not auto-create repayments.
        Record repayments manually to cover principal + interest.
      </p>

      <Input
        label="Annual interest rate (%)"
        name="interestRateBps"
        type="number"
        inputMode="decimal"
        min="0.01"
        step="0.01"
        max="1000"
        placeholder="e.g. 12.5"
        value={ratePercent}
        onChange={(event) => setRatePercent(event.target.value)}
        error={rateError ?? fieldErrors.interestRateBps}
        hint="Enter the yearly rate — e.g. 12.5 for 12.5% p.a."
        required
      />

      <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
        Interest period
        <select
          name="interestPeriod"
          value={period}
          onChange={(event) => setPeriod(event.target.value as InterestPeriod)}
          className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-base shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          aria-describedby={fieldErrors.interestPeriod ? 'interestPeriod-error' : undefined}
        >
          {PERIOD_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {fieldErrors.interestPeriod ? (
          <p id="interestPeriod-error" className="text-sm text-red-600">
            {fieldErrors.interestPeriod}
          </p>
        ) : null}
      </label>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" isLoading={isSaving} className="flex-1">
          {existing ? 'Update interest' : 'Set interest'}
        </Button>
        {existing && onRemove ? (
          <Button
            type="button"
            variant="danger"
            isLoading={isSaving}
            onClick={onRemove}
            className="flex-1"
          >
            Remove interest
          </Button>
        ) : null}
      </div>
    </form>
  );
}

import { FormEvent, useState } from 'react';
import { Button } from '../../../components/Button';
import { FormError } from '../../../components/FormError';
import { Input } from '../../../components/Input';
import { formatCurrency } from '../../../lib/formatCurrency';
import { todayIsoDate } from '../../../lib/todayIsoDate';
import type { FieldErrors } from '../../../types/errors';
import type { CreateRepaymentPayload } from '../types';

interface RepaymentFormProps {
  outstandingCents: number;
  isSaving: boolean;
  fieldErrors?: FieldErrors;
  globalError?: string | null;
  onSubmit: (payload: CreateRepaymentPayload) => Promise<void>;
}

/**
 * Presentational repayment form. Converts major units to integer cents before submit.
 *
 * @param outstandingCents - Remaining balance on the parent transaction
 * @param isSaving - In-flight flag
 * @param fieldErrors - Per-field messages from the API
 * @param globalError - Form-level message from the API
 * @param onSubmit - Persist handler
 */
export function RepaymentForm({
  outstandingCents,
  isSaving,
  fieldErrors = {},
  globalError,
  onSubmit,
}: RepaymentFormProps) {
  const [amount, setAmount] = useState('');
  const [paidOn, setPaidOn] = useState(todayIsoDate());
  const [notes, setNotes] = useState('');
  const [amountError, setAmountError] = useState<string | undefined>();

  /**
   * Validates amount and forwards integer cents.
   *
   * @param event - Form submit event
   */
  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const amountCents = Math.round(Number(amount) * 100);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      setAmountError('Amount must be greater than 0');
      return;
    }
    if (amountCents > outstandingCents) {
      setAmountError('Amount is more than the remaining balance');
      return;
    }
    setAmountError(undefined);
    await onSubmit({
      amountCents,
      paidOn,
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    });
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <FormError message={globalError} />
      <p className="text-sm text-slate-500">
        Remaining balance: {formatCurrency(outstandingCents)}
      </p>
      <Input
        label="Amount"
        name="amountCents"
        type="number"
        inputMode="decimal"
        min="0.01"
        step="0.01"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
        error={amountError ?? fieldErrors.amountCents}
        required
      />
      <Input
        label="Payment date"
        name="paidOn"
        type="date"
        value={paidOn}
        onChange={(event) => setPaidOn(event.target.value)}
        error={fieldErrors.paidOn}
        required
      />
      <Input
        label="Notes"
        name="notes"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        error={fieldErrors.notes}
      />
      <Button type="submit" isLoading={isSaving}>
        Save repayment
      </Button>
    </form>
  );
}

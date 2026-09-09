import { FormEvent, useState } from 'react';
import { Button } from '../../../components/Button';
import { FormError } from '../../../components/FormError';
import { Input } from '../../../components/Input';
import { todayIsoDate } from '../../../lib/todayIsoDate';
import type { FieldErrors } from '../../../types/errors';
import type { CreateTransactionPayload, TransactionFormValues, TransactionType } from '../types';

interface TransactionFormProps {
  personId: string;
  initialValues?: TransactionFormValues;
  isSaving: boolean;
  fieldErrors?: FieldErrors;
  globalError?: string | null;
  submitLabel?: string;
  onSubmit: (payload: CreateTransactionPayload) => Promise<void>;
}

/**
 * Presentational lend/borrow form. Converts major units to integer cents before submit.
 *
 * @param personId - Person this transaction belongs to
 * @param initialValues - Values when editing
 * @param isSaving - In-flight flag
 * @param fieldErrors - Per-field messages from the API
 * @param globalError - Form-level message from the API
 * @param submitLabel - Primary button text
 * @param onSubmit - Persist handler
 */
export function TransactionForm({
  personId,
  initialValues,
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
  const [amountError, setAmountError] = useState<string | undefined>();
  const [dateError, setDateError] = useState<string | undefined>();

  /**
   * Validates amount and dates, then submits integer cents.
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
    if (dueDate && dueDate < transactionDate) {
      setDateError('Due date cannot be before the date the money moved');
      return;
    }
    setAmountError(undefined);
    setDateError(undefined);
    await onSubmit({
      personId,
      type,
      amountCents,
      transactionDate,
      ...(dueDate ? { dueDate } : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    });
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <FormError message={globalError} />
      <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
        Type
        <select
          name="type"
          className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-base shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          value={type}
          onChange={(event) => setType(event.target.value as TransactionType)}
        >
          <option value="lend">Lend</option>
          <option value="borrow">Borrow</option>
        </select>
        {fieldErrors.type ? <p className="text-sm text-red-600">{fieldErrors.type}</p> : null}
      </label>
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
        label={type === 'lend' ? 'Date you lent the money' : 'Date you borrowed the money'}
        name="transactionDate"
        type="date"
        value={transactionDate}
        onChange={(event) => setTransactionDate(event.target.value)}
        error={fieldErrors.transactionDate}
        required
      />
      <Input
        label="Due date"
        name="dueDate"
        type="date"
        value={dueDate}
        onChange={(event) => setDueDate(event.target.value)}
        error={dateError ?? fieldErrors.dueDate}
      />
      <Input
        label="Notes"
        name="notes"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        error={fieldErrors.notes}
      />
      <Button type="submit" isLoading={isSaving}>
        {submitLabel}
      </Button>
    </form>
  );
}

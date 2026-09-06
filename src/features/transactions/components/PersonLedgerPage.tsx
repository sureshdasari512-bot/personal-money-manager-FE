import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../../../components/Button';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { EmptyState } from '../../../components/EmptyState';
import { FormError } from '../../../components/FormError';
import { Modal } from '../../../components/Modal';
import { PageHeader } from '../../../components/PageHeader';
import { Spinner } from '../../../components/Spinner';
import { formatCurrency } from '../../../lib/formatCurrency';
import type { LedgerTransaction, Transaction } from '../../../types';
import { toApiError, type FieldErrors } from '../../../types/errors';
import { usePerson } from '../../people/hooks/usePerson';
import {
  createRepayment,
  createTransaction,
  deleteRepayment,
  deleteTransaction,
  updateTransaction,
} from '../api';
import { useTransactions } from '../hooks/useTransactions';
import type { CreateRepaymentPayload, CreateTransactionPayload, TransactionFormValues } from '../types';
import { RepaymentForm } from './RepaymentForm';
import { TransactionForm } from './TransactionForm';
import { TransactionRow } from './TransactionRow';

/**
 * Person-level ledger: history, net balance, transactions, and repayments.
 */
export function PersonLedgerPage() {
  const { personId } = useParams<{ personId: string }>();
  const { person, isLoading: isPersonLoading, error: personError } = usePerson(personId ?? '');
  const { transactions, netBalanceCents, isLoading, error, reload } = useTransactions(
    personId ?? '',
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [repayingTransaction, setRepayingTransaction] = useState<LedgerTransaction | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<LedgerTransaction | null>(null);
  const [repaymentToDelete, setRepaymentToDelete] = useState<{
    transaction: LedgerTransaction;
    repaymentId: string;
  } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingRepaymentId, setDeletingRepaymentId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  if (!personId) {
    return <p className="text-sm text-red-600">Missing person.</p>;
  }

  /**
   * Opens the create dialog with a clean form.
   */
  function openCreate(): void {
    setEditingTransaction(null);
    setFieldErrors({});
    setGlobalError(null);
    setIsModalOpen(true);
  }

  /**
   * Opens the edit dialog for an existing transaction.
   *
   * @param transaction - Transaction to edit
   */
  function openEdit(transaction: Transaction): void {
    setEditingTransaction(transaction);
    setFieldErrors({});
    setGlobalError(null);
    setIsModalOpen(true);
  }

  /**
   * Closes the create/edit dialog.
   */
  function closeModal(): void {
    setIsModalOpen(false);
    setEditingTransaction(null);
    setFieldErrors({});
    setGlobalError(null);
  }

  /**
   * Opens the repayment dialog for a transaction.
   *
   * @param transaction - Parent transaction
   */
  function openRepayment(transaction: LedgerTransaction): void {
    setRepayingTransaction(transaction);
    setFieldErrors({});
    setGlobalError(null);
  }

  /**
   * Closes the repayment dialog.
   */
  function closeRepayment(): void {
    setRepayingTransaction(null);
    setFieldErrors({});
    setGlobalError(null);
  }

  /**
   * Creates or updates a transaction, then refreshes the ledger.
   *
   * @param payload - Transaction fields in cents
   */
  async function handleSave(payload: CreateTransactionPayload): Promise<void> {
    setIsSaving(true);
    setFieldErrors({});
    setGlobalError(null);
    try {
      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, payload);
      } else {
        await createTransaction(payload);
      }
      closeModal();
      await reload();
    } catch (err) {
      const apiError = toApiError(err);
      setFieldErrors(apiError.fields ?? {});
      setGlobalError(apiError.message);
    } finally {
      setIsSaving(false);
    }
  }

  /**
   * Records a repayment, then refreshes the ledger.
   *
   * @param payload - Repayment fields in cents
   */
  async function handleRepayment(payload: CreateRepaymentPayload): Promise<void> {
    if (!repayingTransaction) {
      return;
    }
    setIsSaving(true);
    setFieldErrors({});
    setGlobalError(null);
    try {
      await createRepayment(repayingTransaction.id, payload);
      closeRepayment();
      await reload();
    } catch (err) {
      const apiError = toApiError(err);
      setFieldErrors(apiError.fields ?? {});
      setGlobalError(apiError.message);
    } finally {
      setIsSaving(false);
    }
  }

  /**
   * Soft-deletes the transaction chosen in the confirm dialog.
   * Cascades when that transaction has repayments.
   */
  async function handleDelete(): Promise<void> {
    if (!transactionToDelete) {
      return;
    }

    const hasRepayments = transactionToDelete.repayments.length > 0;
    setDeletingId(transactionToDelete.id);
    setListError(null);
    try {
      await deleteTransaction(transactionToDelete.id, hasRepayments);
      setTransactionToDelete(null);
      await reload();
    } catch (err) {
      setListError(toApiError(err).message);
    } finally {
      setDeletingId(null);
    }
  }

  /**
   * Soft-deletes the repayment chosen in the confirm dialog.
   */
  async function handleDeleteRepayment(): Promise<void> {
    if (!repaymentToDelete) {
      return;
    }

    setDeletingRepaymentId(repaymentToDelete.repaymentId);
    setListError(null);
    try {
      await deleteRepayment(repaymentToDelete.transaction.id, repaymentToDelete.repaymentId);
      setRepaymentToDelete(null);
      await reload();
    } catch (err) {
      setListError(toApiError(err).message);
    } finally {
      setDeletingRepaymentId(null);
    }
  }

  if (isLoading || isPersonLoading) {
    return <Spinner />;
  }

  if (error || personError) {
    return <p className="text-sm text-red-600">{personError ?? error}</p>;
  }

  const initialValues = editingTransaction ? toFormValues(editingTransaction) : undefined;

  return (
    <main>
      <p className="mb-4">
        <Link to="/people" className="text-sm font-semibold text-blue-700 hover:text-blue-800">
          Back to people
        </Link>
      </p>
      <PageHeader
        eyebrow="Ledger"
        title={person?.name ?? 'Person'}
        description="Lend and borrow history for this contact."
        action={<Button onClick={openCreate}>Add transaction</Button>}
      />
      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Net balance</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
          {formatCurrency(netBalanceCents)}
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Positive means they owe you. Negative means you owe them.
        </p>
      </section>

      <FormError message={listError} />

      {transactions.length === 0 ? (
        <EmptyState
          title="No transactions yet"
          description="Add your first lend or borrow for this person."
          action={<Button onClick={openCreate}>Add transaction</Button>}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {transactions.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              isDeleting={deletingId === transaction.id}
              deletingRepaymentId={deletingRepaymentId}
              onEdit={openEdit}
              onDelete={setTransactionToDelete}
              onAddRepayment={openRepayment}
              onDeleteRepayment={(row, repayment) => {
                setRepaymentToDelete({ transaction: row, repaymentId: repayment.id });
              }}
            />
          ))}
        </div>
      )}

      <Modal
        title={editingTransaction ? 'Edit transaction' : 'Add transaction'}
        isOpen={isModalOpen}
        onClose={closeModal}
      >
        <TransactionForm
          key={editingTransaction?.id ?? 'create'}
          personId={personId}
          initialValues={initialValues}
          isSaving={isSaving}
          fieldErrors={fieldErrors}
          globalError={globalError}
          submitLabel={editingTransaction ? 'Save changes' : 'Save transaction'}
          onSubmit={handleSave}
        />
      </Modal>

      <Modal title="Add repayment" isOpen={Boolean(repayingTransaction)} onClose={closeRepayment}>
        {repayingTransaction ? (
          <RepaymentForm
            key={repayingTransaction.id}
            outstandingCents={repayingTransaction.outstandingCents}
            isSaving={isSaving}
            fieldErrors={fieldErrors}
            globalError={globalError}
            onSubmit={handleRepayment}
          />
        ) : null}
      </Modal>

      <ConfirmDialog
        title="Delete this transaction?"
        description={
          transactionToDelete?.repayments.length
            ? 'This transaction has repayments. Deleting it will also remove those repayments from the ledger.'
            : 'Remove this transaction from the ledger?'
        }
        confirmLabel="Delete transaction"
        isOpen={Boolean(transactionToDelete)}
        isConfirming={Boolean(deletingId)}
        onCancel={() => setTransactionToDelete(null)}
        onConfirm={() => {
          void handleDelete();
        }}
      />

      <ConfirmDialog
        title="Remove this repayment?"
        description="The outstanding balance on this transaction will go back up by this amount."
        confirmLabel="Remove repayment"
        isOpen={Boolean(repaymentToDelete)}
        isConfirming={Boolean(deletingRepaymentId)}
        onCancel={() => setRepaymentToDelete(null)}
        onConfirm={() => {
          void handleDeleteRepayment();
        }}
      />
    </main>
  );
}

/**
 * Maps a stored transaction to major-unit form values.
 *
 * @param transaction - Persisted transaction
 * @returns Form values for the edit dialog
 */
function toFormValues(transaction: Transaction): TransactionFormValues {
  return {
    type: transaction.type,
    amount: (transaction.amountCents / 100).toFixed(2),
    transactionDate: transaction.transactionDate.slice(0, 10),
    ...(transaction.dueDate ? { dueDate: transaction.dueDate.slice(0, 10) } : {}),
    ...(transaction.notes ? { notes: transaction.notes } : {}),
  };
}

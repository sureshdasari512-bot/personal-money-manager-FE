import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/Button';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { EmptyState } from '../../../components/EmptyState';
import { FormError } from '../../../components/FormError';
import { Modal } from '../../../components/Modal';
import { PageHeader } from '../../../components/PageHeader';
import { Spinner } from '../../../components/Spinner';
import type { Person } from '../../../types';
import { toApiError, type FieldErrors } from '../../../types/errors';
import { createPerson, deletePerson, updatePerson } from '../api';
import { usePeople } from '../hooks/usePeople';
import type { PersonFormValues } from '../types';
import { PersonForm } from './PersonForm';

/**
 * Contact list for the signed-in user. Create, edit, and soft-delete people.
 */
export function PeoplePage() {
  const { people, isLoading, error, reload } = usePeople();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  /**
   * Opens the create dialog with a clean form.
   */
  function openCreate(): void {
    setEditingPerson(null);
    setFieldErrors({});
    setGlobalError(null);
    setIsModalOpen(true);
  }

  /**
   * Opens the edit dialog for an existing contact.
   *
   * @param person - Contact to edit
   */
  function openEdit(person: Person): void {
    setEditingPerson(person);
    setFieldErrors({});
    setGlobalError(null);
    setIsModalOpen(true);
  }

  /**
   * Closes the create/edit dialog.
   */
  function closeModal(): void {
    setIsModalOpen(false);
    setEditingPerson(null);
    setFieldErrors({});
    setGlobalError(null);
  }

  /**
   * Creates or updates a contact, then refreshes the list.
   *
   * @param values - Form values
   */
  async function handleSave(values: PersonFormValues): Promise<void> {
    setIsSaving(true);
    setFieldErrors({});
    setGlobalError(null);
    try {
      if (editingPerson) {
        await updatePerson(editingPerson.id, values);
      } else {
        await createPerson(values);
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
   * Soft-deletes the contact chosen in the confirm dialog.
   */
  async function handleDelete(): Promise<void> {
    if (!personToDelete) {
      return;
    }

    setDeletingId(personToDelete.id);
    setListError(null);
    try {
      await deletePerson(personToDelete.id);
      setPersonToDelete(null);
      await reload();
    } catch (err) {
      setListError(toApiError(err).message);
    } finally {
      setDeletingId(null);
    }
  }

  if (isLoading) {
    return <Spinner />;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  return (
    <main>
      <PageHeader
        eyebrow="Contacts"
        title="People"
        description="People you lend money to or borrow money from."
        action={<Button onClick={openCreate}>Add person</Button>}
      />

      <FormError message={listError} />

      {people.length === 0 ? (
        <EmptyState
          title="No people yet"
          description="Add the first person you lend to or borrow from."
          action={<Button onClick={openCreate}>Add person</Button>}
        />
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {people.map((person) => (
            <li
              key={person.id}
              className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{person.name}</p>
                <p className="truncate text-sm text-slate-500">
                  {person.phone ?? person.email ?? 'No contact details'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to={`/people/${person.id}`}
                  className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                >
                  Ledger
                </Link>
                <Button variant="secondary" onClick={() => openEdit(person)}>
                  Edit
                </Button>
                <Button
                  variant="danger"
                  isLoading={deletingId === person.id}
                  onClick={() => setPersonToDelete(person)}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        title={editingPerson ? 'Edit person' : 'Add person'}
        isOpen={isModalOpen}
        onClose={closeModal}
      >
        <PersonForm
          key={editingPerson?.id ?? 'create'}
          initialValues={
            editingPerson
              ? {
                  name: editingPerson.name,
                  ...(editingPerson.phone ? { phone: editingPerson.phone } : {}),
                  ...(editingPerson.email ? { email: editingPerson.email } : {}),
                  ...(editingPerson.notes ? { notes: editingPerson.notes } : {}),
                }
              : undefined
          }
          isSaving={isSaving}
          fieldErrors={fieldErrors}
          globalError={globalError}
          submitLabel={editingPerson ? 'Save changes' : 'Save person'}
          onSubmit={handleSave}
        />
      </Modal>

      <ConfirmDialog
        title="Remove this person?"
        description={
          personToDelete
            ? `Remove ${personToDelete.name} from your contacts? Their ledger will no longer be listed here.`
            : ''
        }
        confirmLabel="Remove person"
        isOpen={Boolean(personToDelete)}
        isConfirming={Boolean(deletingId)}
        onCancel={() => setPersonToDelete(null)}
        onConfirm={() => {
          void handleDelete();
        }}
      />
    </main>
  );
}

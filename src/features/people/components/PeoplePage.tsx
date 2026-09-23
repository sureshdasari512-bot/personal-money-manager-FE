import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/Button';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { EmptyState } from '../../../components/EmptyState';
import { FormError } from '../../../components/FormError';
import { Modal } from '../../../components/Modal';
import { PageHeader } from '../../../components/PageHeader';
import type { Person } from '../../../types';
import { toApiError, type FieldErrors } from '../../../types/errors';
import { createPerson, deletePerson, updatePerson } from '../api';
import { usePeople } from '../hooks/usePeople';
import type { PersonFormValues } from '../types';
import { PersonForm } from './PersonForm';

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function PersonRowSkeleton() {
  return (
    <li className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-2">
        <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />
      </div>
      <div className="flex gap-2">
        <div className="h-9 w-16 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-9 w-14 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-9 w-16 animate-pulse rounded-lg bg-slate-100" />
      </div>
    </li>
  );
}

function PeopleListSkeleton() {
  return (
    <ul
      aria-busy="true"
      aria-label="Loading contacts"
      className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      {Array.from({ length: 5 }).map((_, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <PersonRowSkeleton key={i} />
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Search bar
// ---------------------------------------------------------------------------

interface SearchBarProps {
  value: string;
  onChange: (q: string) => void;
}

/**
 * Controlled search input with a clear button and accessible label.
 * Debouncing is handled by the usePeople hook — this component is purely presentational.
 *
 * @param value - Current query string
 * @param onChange - Called on every keystroke; hook debounces the API call
 */
function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      {/* Search icon */}
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
          />
        </svg>
      </span>

      <input
        type="search"
        aria-label="Search contacts"
        placeholder="Search by name, phone or email…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
      />

      {/* Clear button — only visible when there is a query */}
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Contact row
// ---------------------------------------------------------------------------

interface PersonRowProps {
  person: Person;
  deletingId: string | null;
  onEdit: (person: Person) => void;
  onDelete: (person: Person) => void;
}

/**
 * Presentational contact row — no data fetching, pure props.
 *
 * @param person - Contact to display
 * @param deletingId - Id currently being deleted (shows spinner on that row)
 * @param onEdit - Opens the edit modal for this contact
 * @param onDelete - Opens the confirm dialog for this contact
 */
function PersonRow({ person, deletingId, onEdit, onDelete }: PersonRowProps) {
  const subtitle = person.phone ?? person.email ?? 'No contact details';

  return (
    <li className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate font-medium text-slate-900">{person.name}</p>
        <p className="truncate text-sm text-slate-500">{subtitle}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          to={`/people/${person.id}`}
          className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-blue-700 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
        >
          Ledger
        </Link>
        <Button variant="secondary" onClick={() => onEdit(person)}>
          Edit
        </Button>
        <Button
          variant="danger"
          isLoading={deletingId === person.id}
          onClick={() => onDelete(person)}
        >
          Delete
        </Button>
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

/**
 * Contact list for the signed-in user.
 * Features: cursor-based pagination, debounced search (name/phone/email),
 * skeleton loading, full CRUD via modal + confirm dialog.
 */
export function PeoplePage() {
  const {
    people,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    query,
    setQuery,
    sentinelRef,
    reload,
  } = usePeople();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Modal helpers
  // -------------------------------------------------------------------------

  function openCreate(): void {
    setEditingPerson(null);
    setFieldErrors({});
    setGlobalError(null);
    setIsModalOpen(true);
  }

  /**
   * @param person - Contact to edit
   */
  function openEdit(person: Person): void {
    setEditingPerson(person);
    setFieldErrors({});
    setGlobalError(null);
    setIsModalOpen(true);
  }

  function closeModal(): void {
    setIsModalOpen(false);
    setEditingPerson(null);
    setFieldErrors({});
    setGlobalError(null);
  }

  // -------------------------------------------------------------------------
  // CRUD handlers
  // -------------------------------------------------------------------------

  /**
   * Creates or updates a contact, then refreshes from page one.
   *
   * @param values - Form values submitted by PersonForm
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
   * Soft-deletes the contact selected in the confirm dialog.
   */
  async function handleDelete(): Promise<void> {
    if (!personToDelete) return;
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

  // -------------------------------------------------------------------------
  // Derived state
  // -------------------------------------------------------------------------

  const isSearching = query.trim().length > 0;
  const showEmptySearch = !isLoading && isSearching && people.length === 0;
  const showEmptyList = !isLoading && !isSearching && people.length === 0;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <main>
      <PageHeader
        eyebrow="Contacts"
        title="People"
        description="People you lend money to or borrow money from."
        action={<Button onClick={openCreate}>Add person</Button>}
      />

      {/* Search bar — always visible so users know the feature exists */}
      <div className="mb-4">
        <SearchBar value={query} onChange={setQuery} />
      </div>

      <FormError message={listError ?? error} />

      {isLoading ? (
        <PeopleListSkeleton />
      ) : showEmptyList ? (
        <EmptyState
          title="No people yet"
          description="Add the first person you lend to or borrow from."
          action={<Button onClick={openCreate}>Add person</Button>}
        />
      ) : showEmptySearch ? (
        <EmptyState
          title="No contacts found"
          description={`No contacts match "${query}". Try a different name, phone, or email.`}
        />
      ) : (
        <>
          {/* Result count while searching */}
          {isSearching && (
            <p className="mb-2 text-sm text-slate-500">
              {people.length} result{people.length === 1 ? '' : 's'} for &ldquo;{query}&rdquo;
            </p>
          )}

          <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {people.map((person) => (
              <PersonRow
                key={person.id}
                person={person}
                deletingId={deletingId}
                onEdit={openEdit}
                onDelete={setPersonToDelete}
              />
            ))}

            {/* Inline skeleton rows while next page loads */}
            {isLoadingMore && (
              <>
                <PersonRowSkeleton />
                <PersonRowSkeleton />
                <PersonRowSkeleton />
              </>
            )}
          </ul>

          {/* Invisible sentinel — IntersectionObserver triggers next page fetch
              200 px before this element enters the viewport. Only rendered
              while more pages exist (search always sets hasMore = false). */}
          {hasMore && (
            <div ref={sentinelRef} aria-hidden="true" className="h-1" />
          )}

          {/* Inline feedback while the next page is loading */}
          {isLoadingMore && (
            <p className="mt-3 text-center text-xs text-slate-400">Loading more…</p>
          )}

          {/* End-of-list indicator — only for paginated (non-search) view */}
          {!hasMore && !isSearching && people.length > 0 && (
            <p className="mt-4 text-center text-xs text-slate-400">
              All {people.length} contact{people.length === 1 ? '' : 's'} loaded
            </p>
          )}
        </>
      )}

      {/* Create / Edit modal */}
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

      {/* Delete confirm dialog */}
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

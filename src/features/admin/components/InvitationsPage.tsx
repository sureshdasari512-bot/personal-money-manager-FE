import { FormEvent, useState } from 'react';
import { Button } from '../../../components/Button';
import { EmptyState } from '../../../components/EmptyState';
import { FormError } from '../../../components/FormError';
import { Input } from '../../../components/Input';
import { PageHeader } from '../../../components/PageHeader';
import { Spinner } from '../../../components/Spinner';
import { StatusBadge } from '../../../components/StatusBadge';
import { toApiError, type FieldErrors } from '../../../types/errors';
import type { InvitationStatus, UserRole } from '../../../types';
import { createInvitation } from '../api';
import { useInvitations } from '../hooks/useInvitations';

/**
 * Admin invitation form and list. Account creation is invite-only.
 */
export function InvitationsPage() {
  const { invitations, isLoading, error, reload, revoke } = useInvitations();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  /**
   * Creates an invitation via POST /invitations.
   *
   * @param event - Form submit event
   */
  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSaving(true);
    setFieldErrors({});
    setGlobalError(null);
    setMessage(null);
    try {
      const response = await createInvitation({ email: email.trim(), role });
      setMessage(`Invitation emailed to ${response.invitation.email}.`);
      setEmail('');
      setRole('user');
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
   * Revokes a pending invitation.
   *
   * @param invitationId - Invitation id
   */
  async function handleRevoke(invitationId: string): Promise<void> {
    setRevokingId(invitationId);
    setGlobalError(null);
    try {
      await revoke(invitationId);
    } catch (err) {
      setGlobalError(toApiError(err).message);
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <main>
      <PageHeader
        eyebrow="Admin"
        title="Invitations"
        description="New accounts can only be created from an invite. The person gets an email with an activate link."
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Send an invite</h2>
        <form className="mt-4 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <FormError message={globalError} />
          {message ? (
            <p role="status" className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
              {message}
            </p>
          ) : null}
          <Input
            label="Email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={fieldErrors.email}
          />
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
            Role
            <select
              name="role"
              className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-base shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
              value={role}
              onChange={(event) => setRole(event.target.value as UserRole)}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            {fieldErrors.role ? <p className="text-sm text-red-600">{fieldErrors.role}</p> : null}
          </label>
          <div>
            <Button type="submit" isLoading={isSaving}>
              Send invite
            </Button>
          </div>
        </form>
      </section>

      <h2 className="mt-8 text-lg font-semibold text-slate-900">All invitations</h2>
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      ) : invitations.length === 0 ? (
        <div className="mt-3">
          <EmptyState title="No invitations yet" description="Send the first invite to onboard a user." />
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {invitations.map((invitation) => (
            <li key={invitation.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{invitation.email}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <StatusBadge label={invitation.role} tone="neutral" />
                  <StatusBadge
                    label={invitation.status}
                    tone={invitationStatusTone(invitation.status)}
                  />
                </div>
              </div>
              {invitation.status === 'pending' ? (
                <Button
                  variant="danger"
                  isLoading={revokingId === invitation.id}
                  onClick={() => {
                    void handleRevoke(invitation.id);
                  }}
                >
                  Revoke
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

/**
 * Picks a badge tone for an invitation status.
 *
 * @param status - Derived invitation status
 * @returns Design-system tone
 */
function invitationStatusTone(status: InvitationStatus): 'success' | 'warning' | 'danger' | 'info' {
  if (status === 'accepted') {
    return 'success';
  }
  if (status === 'pending') {
    return 'info';
  }
  if (status === 'expired') {
    return 'warning';
  }
  return 'danger';
}

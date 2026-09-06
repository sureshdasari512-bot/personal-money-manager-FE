import { Button } from '../../../components/Button';
import { EmptyState } from '../../../components/EmptyState';
import { PageHeader } from '../../../components/PageHeader';
import { Spinner } from '../../../components/Spinner';
import { StatusBadge } from '../../../components/StatusBadge';
import { setUserAccess } from '../api';
import { useUsers } from '../hooks/useUsers';

/**
 * Admin user list with enable/disable controls. Hidden from non-admins via RoleGuard.
 * The API omits the signed-in admin so they cannot manage their own account.
 */
export function UserManagementPage() {
  const { users, setUsers, isLoading, error } = useUsers();

  /**
   * Toggles access and updates local state on success.
   *
   * @param userId - Target user
   * @param isActive - Desired flag
   */
  async function handleToggle(userId: string, isActive: boolean): Promise<void> {
    const response = await setUserAccess(userId, isActive);
    setUsers((current) => current.map((user) => (user.id === userId ? response.user : user)));
  }

  if (isLoading) {
    return <Spinner />;
  }

  if (error) {
    return <p className="text-sm text-red-600">Could not load users.</p>;
  }

  return (
    <main>
      <PageHeader
        eyebrow="Admin"
        title="Users"
        description="Enable or disable access. Disabled users cannot sign in."
      />
      {users.length === 0 ? (
        <EmptyState title="No users yet" description="Invite someone from the Invites page." />
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {users.map((user) => (
            <li key={user.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{user.email}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <StatusBadge label={user.role} tone={user.role === 'admin' ? 'info' : 'neutral'} />
                  <StatusBadge
                    label={user.isActive ? 'Active' : 'Disabled'}
                    tone={user.isActive ? 'success' : 'danger'}
                  />
                </div>
              </div>
              <Button
                variant={user.isActive ? 'danger' : 'primary'}
                onClick={() => {
                  void handleToggle(user.id, !user.isActive);
                }}
              >
                {user.isActive ? 'Disable' : 'Enable'}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

import { useCallback, useEffect, useState } from 'react';
import type { Invitation } from '../../../types';
import { toApiError } from '../../../types/errors';
import { fetchInvitations, revokeInvitation } from '../api';

/**
 * Loads the admin invitation list and supports revoke + local refresh.
 *
 * @returns Invitations plus loading, error, and revoke helpers
 */
export function useInvitations() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchInvitations();
      setInvitations(response.invitations);
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  /**
   * Revokes a pending invite and updates the local list.
   *
   * @param invitationId - Invitation to revoke
   */
  async function revoke(invitationId: string): Promise<void> {
    const response = await revokeInvitation(invitationId);
    setInvitations((current) =>
      current.map((invitation) =>
        invitation.id === invitationId ? response.invitation : invitation,
      ),
    );
  }

  return { invitations, isLoading, error, reload, revoke };
}

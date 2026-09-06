import { FormEvent, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '../../../components/AuthLayout';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { acceptInvite } from '../api';

/**
 * Completes an admin invitation by setting the invitee's password.
 */
export function AcceptInvitePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Activates the invited account.
   *
   * @param event - Form submit event
   */
  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!token) {
      setError('Invitation token is missing');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    setError(undefined);
    try {
      await acceptInvite({ token, password });
      navigate('/dashboard', { replace: true });
    } catch {
      setError('This invitation is invalid or expired');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Activate your account"
      description="Choose a password to finish joining Personal Money Manager."
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={error}
          required
        />
        <Button type="submit" isLoading={isLoading} className="w-full">
          Activate account
        </Button>
      </form>
    </AuthLayout>
  );
}

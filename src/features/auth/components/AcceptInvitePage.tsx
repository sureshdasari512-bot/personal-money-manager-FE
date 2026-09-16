import { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '../../../components/AuthLayout';
import { Button } from '../../../components/Button';
import { FormError } from '../../../components/FormError';
import { Input } from '../../../components/Input';
import { useAcceptInvite } from '../hooks/useAcceptInvite';

/**
 * Completes an admin invitation by setting the invitee's password.
 */
export function AcceptInvitePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';
  const {
    values,
    fieldErrors,
    globalError,
    isSubmitting,
    hasToken,
    setPassword,
    setConfirmPassword,
    markConfirmTouched,
    submit,
  } = useAcceptInvite(token);

  /**
   * Prevents the default submit and runs the activate-account hook.
   *
   * @param event - Form submit event
   */
  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void submit();
  }

  if (!hasToken) {
    return (
      <AuthLayout
        title="Invite link is incomplete"
        description="This page needs a valid invitation token from your email."
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-600">
            Ask your administrator to send a new invitation, then open the link from that email.
          </p>
          <Button type="button" className="w-full" onClick={() => navigate('/login')}>
            Back to sign in
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Activate your account"
      description="Create a password to finish joining Personal Money Manager."
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <FormError message={globalError} />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={values.password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
          hint="Use at least 8 characters."
          required
        />
        <Input
          label="Confirm password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          onBlur={markConfirmTouched}
          error={fieldErrors.confirmPassword}
          hint="Re-enter the same password."
          required
        />
        <Button type="submit" isLoading={isSubmitting} className="mt-1 w-full">
          Activate account
        </Button>
        <p className="text-center text-sm text-slate-500">
          Already activated?{' '}
          <Link to="/login" className="font-semibold text-blue-700 hover:text-blue-800">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

import { FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AuthLayout } from '../../../components/AuthLayout';
import { Button } from '../../../components/Button';
import { FormError } from '../../../components/FormError';
import { Input } from '../../../components/Input';
import { useAuth } from '../../../hooks/useAuth';
import { useLogin } from '../hooks/useLogin';

/**
 * Invite-only login screen. Calls POST /auth/login and shows
 * global + field errors from the shared API error envelope.
 */
export function LoginPage() {
  const { user } = useAuth();
  const { values, fieldErrors, globalError, isSubmitting, isLocked, setEmail, setPassword, submit } =
    useLogin();

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin/users' : '/dashboard'} replace />;
  }

  /**
   * Prevents the default submit and runs the login hook.
   *
   * @param event - Form submit event
   */
  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void submit();
  }

  return (
    <AuthLayout
      title="Sign in"
      description="Access is invite-only. Use the email you were invited with."
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <FormError message={globalError} />
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(event) => setEmail(event.target.value)}
          error={fieldErrors.email}
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={values.password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
        />
        <p className="-mt-2 text-right">
          <Link
            to="/forgot-password"
            className="text-sm font-semibold text-blue-700 hover:text-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          >
            Forgot password?
          </Link>
        </p>
        <Button type="submit" isLoading={isSubmitting} disabled={isLocked} className="mt-1 w-full">
          Sign in
        </Button>
        <p className="text-center text-xs text-slate-500">3 sign-in attempts per 15 minutes.</p>
      </form>
    </AuthLayout>
  );
}

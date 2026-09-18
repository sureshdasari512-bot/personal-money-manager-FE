import { FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../../components/AuthLayout';
import { Button } from '../../../components/Button';
import { FormError } from '../../../components/FormError';
import { Input } from '../../../components/Input';
import { useAuth } from '../../../hooks/useAuth';
import { useForgotPassword } from '../hooks/useForgotPassword';

/**
 * Forgot-password screen. Unknown or disabled emails show a field error
 * telling the user to contact an administrator.
 */
export function ForgotPasswordPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { values, fieldErrors, globalError, successMessage, isSubmitting, setEmail, submit } =
    useForgotPassword();

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin/users' : '/dashboard'} replace />;
  }

  /**
   * Prevents the default submit and requests a reset email.
   *
   * @param event - Form submit event
   */
  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void submit();
  }

  if (successMessage) {
    return (
      <AuthLayout title="Check your inbox" description={successMessage}>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-600">
            Open the email and tap Reset password. The link expires in 1 hour.
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
      title="Forgot password"
      description="Enter the email you were invited with. We will send a reset link to an active account."
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
          required
        />
        <Button type="submit" isLoading={isSubmitting} className="mt-1 w-full">
          Send reset link
        </Button>
        <p className="text-center text-sm text-slate-500">
          Remembered it?{' '}
          <Link to="/login" className="font-semibold text-blue-700 hover:text-blue-800">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

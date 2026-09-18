import { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '../../../components/AuthLayout';
import { Button } from '../../../components/Button';
import { FormError } from '../../../components/FormError';
import { Input } from '../../../components/Input';
import { useResetPassword } from '../hooks/useResetPassword';

/**
 * Completes a password reset from the emailed link.
 */
export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = (params.get('token') ?? '').trim();
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
  } = useResetPassword(token);

  /**
   * Prevents the default submit and saves the new password.
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
        title="Reset link is incomplete"
        description="This page needs a valid token from your reset email."
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-600">
            Request a new reset link from the sign-in page, then open the email we send.
          </p>
          <Button type="button" className="w-full" onClick={() => navigate('/forgot-password')}>
            Request a new link
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Choose a new password"
      description="Use at least 8 characters. Other devices will be signed out."
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <FormError message={globalError} />
        <Input
          label="New password"
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
          Save password
        </Button>
        <p className="text-center text-sm text-slate-500">
          <Link to="/login" className="font-semibold text-blue-700 hover:text-blue-800">
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { toApiError, type FieldErrors } from '../../../types/errors';

interface ResetPasswordFormValues {
  password: string;
  confirmPassword: string;
}

interface UseResetPasswordResult {
  values: ResetPasswordFormValues;
  fieldErrors: FieldErrors;
  globalError: string | null;
  isSubmitting: boolean;
  hasToken: boolean;
  setPassword: (password: string) => void;
  setConfirmPassword: (confirmPassword: string) => void;
  markConfirmTouched: () => void;
  submit: () => Promise<void>;
}

/**
 * Validates the reset-password form. Confirm is checked only after that field is visited.
 *
 * @param values - Password and confirmation
 * @param confirmTouched - Whether confirm password has been blurred or submitted
 * @returns Field errors, or an empty object when valid
 */
function validateResetPasswordFields(
  values: ResetPasswordFormValues,
  confirmTouched: boolean,
): FieldErrors {
  const fields: FieldErrors = {};
  if (!values.password) {
    fields.password = 'Password is required';
  } else if (values.password.length < 8) {
    fields.password = 'Password must be at least 8 characters';
  }

  if (confirmTouched) {
    if (!values.confirmPassword) {
      fields.confirmPassword = 'Confirm your password';
    } else if (values.password !== values.confirmPassword) {
      fields.confirmPassword = 'Passwords do not match';
    }
  }

  return fields;
}

/**
 * Owns reset-password form state and POST /auth/reset-password.
 *
 * @param token - Reset token from the URL
 * @returns Form values, error state, and submit handler
 */
export function useResetPassword(token: string): UseResetPasswordResult {
  const { completePasswordReset } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState<ResetPasswordFormValues>({
    password: '',
    confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);

  /**
   * Updates the password and clears that field's error.
   *
   * @param password - Next password value
   */
  function setPassword(password: string): void {
    const nextValues = { ...values, password };
    setValues(nextValues);
    setFieldErrors((current) => {
      const next = { ...current };
      delete next.password;
      if (confirmTouched && nextValues.confirmPassword === password) {
        delete next.confirmPassword;
      }
      return next;
    });
  }

  /**
   * Updates the confirmation and clears a stale mismatch error.
   *
   * @param confirmPassword - Next confirmation value
   */
  function setConfirmPassword(confirmPassword: string): void {
    setValues((current) => ({ ...current, confirmPassword }));
    setFieldErrors((current) => {
      const next = { ...current };
      delete next.confirmPassword;
      return next;
    });
  }

  /**
   * Marks confirm password as visited so mismatch can be shown.
   */
  function markConfirmTouched(): void {
    setConfirmTouched(true);
    setFieldErrors(validateResetPasswordFields(values, true));
  }

  /**
   * Validates locally, then resets the password and routes by role.
   */
  async function submit(): Promise<void> {
    if (!token) {
      setGlobalError('This reset link is missing a token. Request a new one from the sign-in page.');
      return;
    }

    setConfirmTouched(true);
    const localFields = validateResetPasswordFields(values, true);
    if (Object.keys(localFields).length > 0) {
      setFieldErrors(localFields);
      setGlobalError('Please fix the highlighted fields');
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});
    setGlobalError(null);

    try {
      const user = await completePasswordReset(token, values.password);
      navigate(user.role === 'admin' ? '/admin/users' : '/dashboard', { replace: true });
    } catch (error) {
      const apiError = toApiError(error);
      setFieldErrors(apiError.fields ?? {});
      setGlobalError(apiError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    values,
    fieldErrors,
    globalError,
    isSubmitting,
    hasToken: Boolean(token),
    setPassword,
    setConfirmPassword,
    markConfirmTouched,
    submit,
  };
}

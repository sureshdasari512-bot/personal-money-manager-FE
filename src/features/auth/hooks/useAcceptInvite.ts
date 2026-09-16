import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { toApiError, type FieldErrors } from '../../../types/errors';

interface AcceptInviteFormValues {
  password: string;
  confirmPassword: string;
}

interface UseAcceptInviteResult {
  values: AcceptInviteFormValues;
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
 * Validates the activate-account form. Confirm-password is checked only after
 * that field has been visited, so the user is not warned while still typing.
 *
 * @param values - Password and confirmation
 * @param confirmTouched - Whether confirm password has been blurred or submitted
 * @returns Field errors, or an empty object when valid
 */
function validateAcceptInviteFields(
  values: AcceptInviteFormValues,
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
 * Owns activate-account form state and POST /auth/accept-invite.
 *
 * @param token - Invite token from the URL
 * @returns Form values, error state, and submit handler
 */
export function useAcceptInvite(token: string): UseAcceptInviteResult {
  const { completeInvite } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState<AcceptInviteFormValues>({
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
    setFieldErrors(validateAcceptInviteFields(values, true));
  }

  /**
   * Validates locally, then activates the account and routes by role.
   */
  async function submit(): Promise<void> {
    if (!token) {
      setGlobalError('This invite link is missing a token. Ask your admin for a new invitation.');
      return;
    }

    setConfirmTouched(true);
    const localFields = validateAcceptInviteFields(values, true);
    if (Object.keys(localFields).length > 0) {
      setFieldErrors(localFields);
      setGlobalError('Please fix the highlighted fields');
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});
    setGlobalError(null);

    try {
      const user = await completeInvite(token, values.password);
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

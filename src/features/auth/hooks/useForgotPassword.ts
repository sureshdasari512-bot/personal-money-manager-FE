import { useState } from 'react';
import { toApiError, type FieldErrors } from '../../../types/errors';
import * as authApi from '../api';

interface ForgotPasswordFormValues {
  email: string;
}

interface UseForgotPasswordResult {
  values: ForgotPasswordFormValues;
  fieldErrors: FieldErrors;
  globalError: string | null;
  successMessage: string | null;
  isSubmitting: boolean;
  setEmail: (email: string) => void;
  submit: () => Promise<void>;
}

/**
 * Validates the forgot-password email field.
 *
 * @param values - Email
 * @returns Field errors, or an empty object when valid
 */
function validateForgotPasswordFields(values: ForgotPasswordFormValues): FieldErrors {
  const fields: FieldErrors = {};
  if (!values.email.trim()) {
    fields.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    fields.email = 'Enter a valid email';
  }
  return fields;
}

/**
 * Owns forgot-password form state and POST /auth/forgot-password.
 *
 * @returns Form values, error/success state, and submit handler
 */
export function useForgotPassword(): UseForgotPasswordResult {
  const [values, setValues] = useState<ForgotPasswordFormValues>({ email: '' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Updates the email and clears that field's error.
   *
   * @param email - Next email value
   */
  function setEmail(email: string): void {
    setValues({ email });
    setFieldErrors((current) => {
      const next = { ...current };
      delete next.email;
      return next;
    });
  }

  /**
   * Validates locally, then requests a reset email.
   */
  async function submit(): Promise<void> {
    const localFields = validateForgotPasswordFields(values);
    if (Object.keys(localFields).length > 0) {
      setFieldErrors(localFields);
      setGlobalError('Please fix the highlighted fields');
      setSuccessMessage(null);
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});
    setGlobalError(null);
    setSuccessMessage(null);

    try {
      const result = await authApi.requestPasswordReset({ email: values.email.trim() });
      setSuccessMessage(result.message);
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
    successMessage,
    isSubmitting,
    setEmail,
    submit,
  };
}

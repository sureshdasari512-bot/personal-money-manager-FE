import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { toApiError, type FieldErrors } from '../../../types/errors';

interface LoginFormValues {
  email: string;
  password: string;
}

interface UseLoginResult {
  values: LoginFormValues;
  fieldErrors: FieldErrors;
  globalError: string | null;
  isSubmitting: boolean;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  submit: () => Promise<void>;
}

/**
 * Validates a login form locally using the same field-error shape as the API.
 *
 * @param values - Email and password
 * @returns Field errors, or an empty object when valid
 */
function validateLoginFields(values: LoginFormValues): FieldErrors {
  const fields: FieldErrors = {};
  if (!values.email.trim()) {
    fields.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    fields.email = 'Enter a valid email';
  }
  if (!values.password) {
    fields.password = 'Password is required';
  } else if (values.password.length < 8) {
    fields.password = 'Password must be at least 8 characters';
  }
  return fields;
}

/**
 * Owns login form state, local + API field errors, and POST /auth/login.
 *
 * @returns Form values, error state, and submit handler
 */
export function useLogin(): UseLoginResult {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState<LoginFormValues>({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Updates the email and clears that field's error.
   *
   * @param email - Next email value
   */
  function setEmail(email: string): void {
    setValues((current) => ({ ...current, email }));
    setFieldErrors((current) => {
      const next = { ...current };
      delete next.email;
      return next;
    });
  }

  /**
   * Updates the password and clears that field's error.
   *
   * @param password - Next password value
   */
  function setPassword(password: string): void {
    setValues((current) => ({ ...current, password }));
    setFieldErrors((current) => {
      const next = { ...current };
      delete next.password;
      return next;
    });
  }

  /**
   * Validates locally, then calls POST /auth/login and routes by role.
   */
  async function submit(): Promise<void> {
    const localFields = validateLoginFields(values);
    if (Object.keys(localFields).length > 0) {
      setFieldErrors(localFields);
      setGlobalError('Please fix the highlighted fields');
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});
    setGlobalError(null);

    try {
      const user = await login(values.email.trim(), values.password);
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
    setEmail,
    setPassword,
    submit,
  };
}

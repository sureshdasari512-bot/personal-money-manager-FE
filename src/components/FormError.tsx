interface FormErrorProps {
  message?: string | null;
}

/**
 * Global form-level error. Field errors belong on the Input, not here.
 *
 * @param message - Global error text from the API or client validation
 */
export function FormError({ message }: FormErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {message}
    </p>
  );
}

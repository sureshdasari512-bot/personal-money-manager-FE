import { useState, type InputHTMLAttributes } from 'react';
import { tokens } from '../lib/design-tokens';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

/**
 * Shared labeled input with inline field-level validation.
 * Password fields include a show/hide control with an accessible name.
 *
 * @param label - Visible accessible label (never placeholder-only)
 * @param error - Field-level error shown next to the control
 * @param hint - Optional helper under the control when there is no error
 */
export function Input({
  label,
  error,
  hint,
  id,
  className = '',
  type = 'text',
  ...props
}: InputProps) {
  const inputId = id ?? props.name;
  const errorId = inputId ? `${inputId}-error` : undefined;
  const hintId = inputId ? `${inputId}-hint` : undefined;
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && isPasswordVisible ? 'text' : type;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type={inputType}
          style={{ borderRadius: tokens.radius.sm }}
          className={`min-h-11 w-full border bg-white px-3 py-2 text-base text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${
            isPassword ? 'pr-12' : ''
          } ${error ? 'border-red-500' : 'border-slate-200'} ${className}`}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...props}
        />
        {isPassword ? (
          <button
            type="button"
            className="absolute top-1/2 right-1 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition-colors hover:text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            aria-pressed={isPasswordVisible}
            aria-controls={inputId}
            onClick={() => setIsPasswordVisible((current) => !current)}
          >
            {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
            <span className="sr-only">{isPasswordVisible ? 'Hide password' : 'Show password'}</span>
          </button>
        ) : null}
      </div>
      {error ? (
        <p id={errorId} className="text-sm text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-sm text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Open-eye icon for the hidden-password state.
 */
function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

/**
 * Crossed-eye icon for the visible-password state.
 */
function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 3l18 18M10.5 10.6a3 3 0 0 0 4 4M9.9 5.2A9.8 9.8 0 0 1 12 5c6 0 9.5 7 9.5 7a16 16 0 0 1-2.3 3.2M6.1 6.4C3.9 8 2.5 12 2.5 12S6 19 12 19c1.4 0 2.7-.3 3.8-.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

import type { ButtonHTMLAttributes } from 'react';
import { tokens } from '../lib/design-tokens';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'ghost' | 'secondary';
  isLoading?: boolean;
}

/**
 * Shared button primitive. Screens must use this instead of one-off styled buttons.
 *
 * @param variant - Visual treatment from the design system
 * @param isLoading - Disables the control and shows in-flight feedback
 */
export function Button({
  variant = 'primary',
  isLoading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'bg-blue-700 text-white hover:bg-blue-800',
    secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
  } as const;

  return (
    <button
      style={{ borderRadius: tokens.radius.sm }}
      className={`inline-flex min-h-11 cursor-pointer items-center justify-center px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? 'Working…' : children}
    </button>
  );
}

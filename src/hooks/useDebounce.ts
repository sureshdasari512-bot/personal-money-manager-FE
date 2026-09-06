import { useEffect, useState } from 'react';

/**
 * Debounces a rapidly changing value (search input, etc.).
 *
 * @param value - Latest value
 * @param delayMs - Wait time after the last change
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

/**
 * Accessible loading indicator used by route guards and async views.
 */
export function Spinner() {
  return (
    <div role="status" className="flex items-center justify-center p-6 text-slate-500">
      <span className="sr-only">Loading</span>
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
    </div>
  );
}

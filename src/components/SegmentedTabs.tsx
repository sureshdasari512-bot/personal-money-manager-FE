interface SegmentedTabOption<T extends string> {
  id: T;
  label: string;
  count?: number;
}

interface SegmentedTabsProps<T extends string> {
  value: T;
  options: SegmentedTabOption<T>[];
  ariaLabel: string;
  onChange: (value: T) => void;
}

/**
 * Accessible in-page tabs so lists of different meaning are not mixed.
 *
 * @param value - Selected tab id
 * @param options - Tabs to show
 * @param ariaLabel - Name of this tab list for assistive tech
 * @param onChange - Selected tab changed
 */
export function SegmentedTabs<T extends string>({
  value,
  options,
  ariaLabel,
  onChange,
}: SegmentedTabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="flex gap-1 rounded-xl bg-slate-100 p-1"
    >
      {options.map((option) => {
        const selected = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={selected}
            className={`min-h-11 flex-1 rounded-lg px-3 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${
              selected
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => {
              onChange(option.id);
            }}
          >
            {option.label}
            {option.count !== undefined ? (
              <span className="ml-1.5 font-medium text-slate-500">{option.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

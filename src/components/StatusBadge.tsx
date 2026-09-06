import { tokens } from '../lib/design-tokens';

export type StatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

interface StatusBadgeProps {
  label: string;
  tone?: StatusTone;
  emphasis?: 'primary' | 'secondary';
}

const toneStyle: Record<StatusTone, { background: string; color: string; border: string }> = {
  neutral: {
    background: tokens.color.line,
    color: tokens.color.ink,
    border: tokens.color.line,
  },
  success: {
    background: tokens.color.successSoft,
    color: tokens.color.success,
    border: tokens.color.successSoft,
  },
  warning: {
    background: tokens.color.warningSoft,
    color: tokens.color.warning,
    border: tokens.color.warningSoft,
  },
  danger: {
    background: tokens.color.dangerSoft,
    color: tokens.color.danger,
    border: tokens.color.dangerSoft,
  },
  info: {
    background: tokens.color.infoSoft,
    color: tokens.color.info,
    border: tokens.color.infoSoft,
  },
};

/**
 * Compact status chip. Color comes from design tokens so meaning stays consistent
 * and contrast stays readable (WCAG-oriented pairing of fill + text).
 *
 * @param label - Visible status text (never color-only)
 * @param tone - Semantic color treatment
 * @param emphasis - Primary chips are the main signal; secondary are supporting
 */
export function StatusBadge({ label, tone = 'neutral', emphasis = 'primary' }: StatusBadgeProps) {
  const colors = toneStyle[tone];

  return (
    <span
      style={{
        background: colors.background,
        color: colors.color,
        borderColor: colors.border,
        borderRadius: tokens.radius.sm,
      }}
      className={`inline-flex items-center gap-1.5 border px-2.5 py-0.5 font-medium ${
        emphasis === 'primary' ? 'text-xs' : 'text-[11px] opacity-90'
      }`}
    >
      <span
        aria-hidden="true"
        style={{ background: colors.color }}
        className="h-1.5 w-1.5 shrink-0 rounded-full"
      />
      {label}
    </span>
  );
}

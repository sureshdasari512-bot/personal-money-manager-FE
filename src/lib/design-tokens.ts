/**
 * Centralized design tokens. Components must reference these instead of
 * hardcoding hex codes or pixel values, so the whole app can be re-themed
 * from one place (e.g., adding dark mode later).
 */
export const tokens = {
  color: {
    primary: '#1d4ed8',
    primaryHover: '#1e40af',
    primarySoft: '#eff6ff',
    danger: '#dc2626',
    dangerSoft: '#fef2f2',
    success: '#15803d',
    successSoft: '#f0fdf4',
    warning: '#b45309',
    warningSoft: '#fffbeb',
    info: '#1d4ed8',
    infoSoft: '#eff6ff',
    canvas: '#f4f6f9',
    surface: '#ffffff',
    ink: '#0f172a',
    muted: '#64748b',
    line: '#e2e8f0',
  },
  spacing: { sm: '8px', md: '16px', lg: '24px', xl: '32px' },
  radius: { sm: '8px', md: '12px', lg: '20px' },
} as const;

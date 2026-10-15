import { useEffect, useMemo, useRef, useState } from 'react';
import { tokens } from '../../../lib/design-tokens';
import { formatCurrency } from '../../../lib/formatCurrency';
import { formatDate } from '../../../lib/formatDate';
import { todayIsoDate } from '../../../lib/todayIsoDate';
import { bpsToPercent } from '../../../lib/simpleInterest';
import type { InterestAccrual, InterestRateHistory, Repayment } from '../../../types';
import { getInterestRateHistory } from '../api';

interface InterestRateHistoryViewProps {
  transactionId: string;
  /** All repayments on the transaction — used to compute total interest paid. */
  repayments: Repayment[];
}

/** One display row = one rate segment + its paired accrual (if any). */
interface HistoryRow {
  rateSegment: InterestRateHistory;
  accrual: InterestAccrual | null;
}

/**
 * Builds display rows — each row shows only what its period generated.
 * No per-segment payment attribution (Approach A).
 *
 * @param rateHistory - Rate segments, chronological
 * @param accruals    - Accrual segments, chronological
 * @returns Rows oldest-first
 */
function buildRows(
  rateHistory: InterestRateHistory[],
  accruals: InterestAccrual[],
): HistoryRow[] {
  const accrualByStart = new Map<string, InterestAccrual>(
    accruals.map((a) => [a.periodStartDate, a]),
  );
  return rateHistory.map((seg) => ({
    rateSegment: seg,
    accrual: accrualByStart.get(seg.effectiveFrom) ?? null,
  }));
}

/** Total interest paid (interest-portion of all repayments). */
function calcTotalInterestPaidCents(repayments: Repayment[]): number {
  return repayments.reduce(
    (sum, r) => sum + (r.amountCents - r.towardPrincipalCents),
    0,
  );
}

/** Animated chevron — flips when open. */
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{
        flexShrink: 0,
        color: tokens.color.muted,
        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 180ms ease',
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

/**
 * Displays the interest rate history for a transaction that has had a rate change.
 *
 * Design (Approach A — accordion):
 *  - isLoading starts false — no spinner flash on loans with a single rate.
 *  - isOpen resets to false whenever transactionId changes (e.g. switching loans).
 *  - Collapsed trigger shows only segment count — not outstanding (already on card above).
 *  - Expanded: one compact row per rate segment, then one reconciliation row.
 *  - Hidden entirely when there has been no rate change (single segment).
 *  - Warns softly when a repayment date falls before the latest rate-change date.
 *
 * @param transactionId - The transaction whose history to display
 * @param repayments    - All repayments on the transaction
 */
export function InterestRateHistoryView({
  transactionId,
  repayments,
}: InterestRateHistoryViewProps) {
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [totalAccruedCents, setTotalAccruedCents] = useState(0);
  // Fix #3: start false — avoids spinner flash on every interest-bearing loan
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Fix #4: key on transactionId so isOpen resets when the user switches loans
  const [isOpen, setIsOpen] = useState(false);

  // Stable key — avoids infinite refetch on parent re-render with same array ref.
  const repaymentKey = useMemo(
    () => repayments.map((r) => r.id).join(','),
    [repayments],
  );

  // Keep latest repayments accessible inside the async callback without
  // adding the full array to the effect dependency list.
  const repaymentsRef = useRef(repayments);
  useEffect(() => { repaymentsRef.current = repayments; }, [repayments]);

  // Fix #4: reset accordion when switching to a different transaction.
  useEffect(() => {
    setIsOpen(false);
  }, [transactionId]);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      setIsLoading(true);
      setError(null);
      try {
        const { rateHistory, accruals } = await getInterestRateHistory(transactionId);
        if (cancelled) return;

        // Only show when at least one rate change has happened.
        if (rateHistory.length <= 1) {
          setRows([]);
          setTotalAccruedCents(0);
          return;
        }

        setRows(buildRows(rateHistory, accruals));
        setTotalAccruedCents(
          accruals.reduce((sum, a) => sum + a.accruedInterestCents, 0),
        );
      } catch {
        if (!cancelled) setError('Could not load rate history. Try refreshing.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionId, repaymentKey]);

  // ── Nothing to render states ──────────────────────────────────────────────

  // Fix #3: spinner only shown during an active fetch (isLoading starts false).
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-1">
        <span
          className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"
          style={{ color: tokens.color.muted }}
          aria-hidden
        />
        <p className="text-xs" style={{ color: tokens.color.muted }}>
          Loading rate history…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-lg px-3 py-2 text-xs"
        role="alert"
        style={{
          background: tokens.color.dangerSoft,
          color: tokens.color.danger,
          borderRadius: tokens.radius.sm,
        }}
      >
        {error}
      </div>
    );
  }

  // No rate changes — nothing to show.
  if (rows.length === 0) return null;

  // ── Derived values ────────────────────────────────────────────────────────

  const paidCents = calcTotalInterestPaidCents(repayments);
  const outstandingCents = Math.max(totalAccruedCents - paidCents, 0);
  const rateCount = rows.length;

  // Fix #5: warn when any repayment was recorded before the latest rate-change date.
  const latestSegmentFrom = rows[rows.length - 1]?.rateSegment.effectiveFrom ?? '';
  const hasEarlyRepayment =
    latestSegmentFrom !== '' &&
    repayments.some((r) => r.paidOn < latestSegmentFrom);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <section
      aria-label="Interest rate history"
      style={{
        borderRadius: tokens.radius.md,
        boxShadow: `inset 0 0 0 1px ${tokens.color.line}`,
        overflow: 'hidden',
      }}
    >
      {/* ── Accordion trigger ── */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-slate-50"
        style={{ background: tokens.color.canvas }}
      >
        {/* Fix #5: trigger shows segment count only — outstanding already visible on card above */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold" style={{ color: tokens.color.ink }}>
            Rate history
          </span>
          <span
            className="rounded-full px-1.5 py-0.5 text-xs font-medium"
            style={{ background: tokens.color.line, color: tokens.color.muted }}
          >
            {rateCount} rate{rateCount !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs" style={{ color: tokens.color.muted }}>
            {isOpen ? 'hide' : 'show details'}
          </span>
          <ChevronIcon open={isOpen} />
        </div>
      </button>

      {/* ── Expanded content ── */}
      {isOpen ? (
        <div
          className="flex flex-col"
          style={{ borderTop: `1px solid ${tokens.color.line}` }}
        >
          {/* One compact row per rate segment */}
          {rows.map(({ rateSegment, accrual }, index) => {
            const isCurrentSegment = rateSegment.effectiveTo === null;
            const periodEnd = rateSegment.effectiveTo ?? todayIsoDate();
            const days = accrual?.daysCount ?? 0;
            const isLast = index === rows.length - 1;

            return (
              <div
                key={rateSegment.id}
                className="px-3 py-2.5"
                style={{
                  background: tokens.color.surface,
                  borderBottom: isLast ? 'none' : `1px solid ${tokens.color.line}`,
                }}
              >
                {/* Date range + rate badge */}
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="text-xs font-medium" style={{ color: tokens.color.ink }}>
                    {formatDate(rateSegment.effectiveFrom)}
                    {' – '}
                    {isCurrentSegment ? 'today' : formatDate(periodEnd)}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={{
                      background: isCurrentSegment
                        ? tokens.color.primarySoft
                        : tokens.color.canvas,
                      color: isCurrentSegment ? tokens.color.primary : tokens.color.muted,
                    }}
                  >
                    {bpsToPercent(rateSegment.interestRateBps)}%
                    {isCurrentSegment ? ' · now' : ''}
                  </span>
                </div>

                {/* Days + principal + interest generated */}
                {accrual ? (
                  <div className="mt-0.5 flex items-center justify-between">
                    <span className="text-xs" style={{ color: tokens.color.muted }}>
                      {days} day{days !== 1 ? 's' : ''} · {formatCurrency(accrual.openingBalanceCents)}
                    </span>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: tokens.color.warning }}
                    >
                      +{formatCurrency(accrual.accruedInterestCents)}
                    </span>
                  </div>
                ) : (
                  <p className="mt-0.5 text-xs" style={{ color: tokens.color.muted }}>
                    No interest accrued yet.
                  </p>
                )}
              </div>
            );
          })}

          {/* ── Single reconciliation row ── */}
          <div
            className="px-3 py-2.5"
            style={{
              background: tokens.color.canvas,
              borderTop: `1px solid ${tokens.color.line}`,
            }}
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: tokens.color.muted }}>
                  Total generated
                </span>
                <span className="text-xs font-medium" style={{ color: tokens.color.warning }}>
                  {formatCurrency(totalAccruedCents)}
                </span>
              </div>

              {paidCents > 0 ? (
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: tokens.color.muted }}>
                    Total paid
                  </span>
                  <span className="text-xs font-medium" style={{ color: tokens.color.success }}>
                    − {formatCurrency(paidCents)}
                  </span>
                </div>
              ) : null}

              <div
                className="mt-0.5 flex items-center justify-between border-t pt-1.5"
                style={{ borderColor: tokens.color.line }}
              >
                <span className="text-xs font-semibold" style={{ color: tokens.color.ink }}>
                  Outstanding
                </span>
                <span
                  className="text-xs font-semibold"
                  style={{
                    color: outstandingCents > 0 ? tokens.color.warning : tokens.color.success,
                  }}
                >
                  {outstandingCents > 0 ? formatCurrency(outstandingCents) : '✓ Nil'}
                </span>
              </div>
            </div>
          </div>

          {/* ── Soft warning: repayment recorded before latest rate-change date ── */}
          {hasEarlyRepayment ? (
            <p
              className="px-3 py-2 text-xs leading-5"
              style={{
                background: tokens.color.warningSoft,
                color: tokens.color.warning,
                borderTop: `1px solid ${tokens.color.line}`,
              }}
            >
              A repayment was recorded before the latest rate change date. The totals
              above are still correct — payments always reduce the overall outstanding
              regardless of which rate period they fall in.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

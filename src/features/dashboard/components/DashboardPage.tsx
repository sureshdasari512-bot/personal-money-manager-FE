import { Link } from 'react-router-dom';
import { PageHeader } from '../../../components/PageHeader';
import { Spinner } from '../../../components/Spinner';
import { formatCurrency } from '../../../lib/formatCurrency';
import { useDashboard } from '../hooks/useDashboard';

/**
 * Net-position home screen. Net balance is the most prominent figure.
 */
export function DashboardPage() {
  const { dashboard, isLoading, error } = useDashboard();

  if (isLoading) {
    return <Spinner />;
  }

  if (error || !dashboard) {
    return <p className="text-sm text-red-600">Could not load the dashboard.</p>;
  }

  const net = dashboard.totalOwedToUserCents - dashboard.totalUserOwesCents;

  return (
    <main>
      <PageHeader
        eyebrow="Overview"
        title="Your balance"
        description="What people owe you, minus what you owe them."
      />
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Net balance</p>
        <p className="mt-1 text-4xl font-semibold tracking-tight text-slate-900">
          {formatCurrency(net)}
        </p>
      </section>
      <dl className="mt-4 grid grid-cols-2 gap-3">
        <Stat label="Owed to you" value={formatCurrency(dashboard.totalOwedToUserCents)} />
        <Stat label="You owe" value={formatCurrency(dashboard.totalUserOwesCents)} />
        <Stat label="Overdue" value={String(dashboard.overdueCount)} />
        <Stat label="Due in 7 days" value={String(dashboard.upcomingDueCount)} />
      </dl>
      <p className="mt-6">
        <Link
          to="/people"
          className="text-sm font-semibold text-blue-700 hover:text-blue-800"
        >
          Manage people
        </Link>
      </p>
    </main>
  );
}

/**
 * Supporting dashboard stat — visually smaller than net balance.
 *
 * @param label - Stat name
 * @param value - Formatted value
 */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="mt-1 text-lg font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

import type {
  DashboardDueItem,
  DashboardPersonBalance,
  DashboardSummary,
} from '../../types';

export type { DashboardDueItem, DashboardPersonBalance, DashboardSummary };

export interface DashboardResponse {
  dashboard: DashboardSummary;
}

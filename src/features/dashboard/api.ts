import { apiFetch } from '../../lib/api-client';
import type { DashboardResponse } from './types';

/**
 * Loads dashboard totals, people with balances, and due lists.
 *
 * @returns Dashboard summary payload
 */
export function fetchDashboard(): Promise<DashboardResponse> {
  return apiFetch<DashboardResponse>('/dashboard');
}

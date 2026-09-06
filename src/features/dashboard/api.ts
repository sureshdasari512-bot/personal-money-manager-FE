import { apiFetch } from '../../lib/api-client';
import type { DashboardResponse } from './types';

/**
 * Loads dashboard totals for the current user.
 *
 * @returns Dashboard summary payload
 */
export function fetchDashboard(): Promise<DashboardResponse> {
  return apiFetch<DashboardResponse>('/dashboard');
}

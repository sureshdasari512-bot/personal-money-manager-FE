import { apiFetch } from '../../lib/api-client';
import type { PeoplePage, PersonFormValues, PersonResponse } from './types';

/**
 * Fetches one page of contacts owned by the current user.
 * When `q` is supplied, results are filtered by name/phone/email and cursor
 * pagination is disabled — the full match set is returned.
 *
 * @param cursor - Opaque cursor from the previous page response (absent = first page)
 * @param limit - Records per page (1–100, default 20)
 * @param q - Optional free-text search term
 * @returns One page of people plus pagination metadata
 */
export function fetchPeople(cursor?: string, limit = 20, q?: string): Promise<PeoplePage> {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  params.set('limit', String(limit));
  if (q && q.trim()) params.set('q', q.trim());
  return apiFetch<PeoplePage>(`/people?${params.toString()}`);
}

/**
 * Fetches one contact owned by the current user.
 *
 * @param personId - Person id
 * @returns Person payload
 */
export function fetchPerson(personId: string): Promise<PersonResponse> {
  return apiFetch<PersonResponse>(`/people/${personId}`);
}

/**
 * Creates a contact.
 *
 * @param values - Person form values
 * @returns Created person
 */
export function createPerson(values: PersonFormValues): Promise<PersonResponse> {
  return apiFetch<PersonResponse>('/people', {
    method: 'POST',
    body: JSON.stringify(values),
  });
}

/**
 * Updates a contact owned by the current user.
 *
 * @param personId - Person id
 * @param values - Updated fields
 * @returns Updated person
 */
export function updatePerson(personId: string, values: PersonFormValues): Promise<PersonResponse> {
  return apiFetch<PersonResponse>(`/people/${personId}`, {
    method: 'PUT',
    body: JSON.stringify(values),
  });
}

/**
 * Soft-deletes a contact owned by the current user.
 *
 * @param personId - Person id
 */
export function deletePerson(personId: string): Promise<void> {
  return apiFetch<void>(`/people/${personId}`, { method: 'DELETE' });
}

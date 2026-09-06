import { apiFetch } from '../../lib/api-client';
import type { PeopleResponse, PersonFormValues, PersonResponse } from './types';

/**
 * Fetches contacts owned by the current user.
 *
 * @returns People list payload
 */
export function fetchPeople(): Promise<PeopleResponse> {
  return apiFetch<PeopleResponse>('/people');
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
 * Deletes a contact owned by the current user.
 *
 * @param personId - Person id
 */
export function deletePerson(personId: string): Promise<void> {
  return apiFetch<void>(`/people/${personId}`, { method: 'DELETE' });
}

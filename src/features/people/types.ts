import type { Person } from '../../types';

export interface PeopleResponse {
  people: Person[];
}

export interface PersonResponse {
  person: Person;
}

export interface PersonFormValues {
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
}

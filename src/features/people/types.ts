import type { Person } from '../../types';

export interface PeoplePage {
  people: Person[];
  nextCursor: string | null;
  hasMore: boolean;
}

/** @deprecated use PeoplePage — kept only for PersonResponse compatibility */
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

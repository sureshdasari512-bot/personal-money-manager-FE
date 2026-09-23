import { useCallback, useEffect, useRef, useState } from 'react';
import type { Person } from '../../../types';
import { toApiError } from '../../../types/errors';
import { fetchPeople } from '../api';

const PAGE_LIMIT = 20;
const SEARCH_DEBOUNCE_MS = 600;

interface UsePeopleResult {
  people: Person[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  query: string;
  setQuery: (q: string) => void;
  reload: () => Promise<void>;
  /** Attach to the sentinel element at the bottom of the list to trigger infinite scroll */
  sentinelRef: (node: HTMLElement | null) => void;
}

/**
 * Fetches the current user's contacts with cursor-based pagination (infinite
 * scroll via IntersectionObserver) and debounced free-text search.
 *
 * When a search query is active, pagination is disabled and the full match set
 * is returned. Clearing the query reverts to the infinite-scroll list.
 *
 * @returns People list, pagination state, search state, sentinel ref, and reload
 */
export function usePeople(): UsePeopleResult {
  const [people, setPeople] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQueryState] = useState('');

  const nextCursorRef = useRef<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeQueryRef = useRef<string>('');
  // Tracks whether a loadMore is already in-flight — avoids double-firing
  const isLoadingMoreRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // ---------------------------------------------------------------------------
  // Core fetch helpers
  // ---------------------------------------------------------------------------

  /**
   * Fetches a fresh first page for the given query and resets all list state.
   *
   * @param q - Search term (empty string = no filter)
   */
  const fetchFirstPage = useCallback(async (q: string) => {
    setIsLoading(true);
    setError(null);
    nextCursorRef.current = null;
    activeQueryRef.current = q;
    try {
      const page = await fetchPeople(undefined, PAGE_LIMIT, q || undefined);
      if (activeQueryRef.current !== q) return;
      setPeople(page.people);
      setHasMore(page.hasMore);
      nextCursorRef.current = page.nextCursor;
    } catch (err) {
      if (activeQueryRef.current !== q) return;
      setError(toApiError(err).message);
    } finally {
      if (activeQueryRef.current === q) setIsLoading(false);
    }
  }, []);

  /**
   * Appends the next cursor page. No-ops when already loading, no cursor exists,
   * or no more pages are available.
   */
  const loadMore = useCallback(() => {
    if (isLoadingMoreRef.current || !nextCursorRef.current) return;
    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    setError(null);
    fetchPeople(nextCursorRef.current, PAGE_LIMIT)
      .then((page) => {
        setPeople((prev) => [...prev, ...page.people]);
        setHasMore(page.hasMore);
        nextCursorRef.current = page.nextCursor;
      })
      .catch((err: unknown) => {
        setError(toApiError(err).message);
      })
      .finally(() => {
        isLoadingMoreRef.current = false;
        setIsLoadingMore(false);
      });
  }, []);

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /** Re-fetches the first page with the current query (called after CRUD ops). */
  const reload = useCallback(async () => {
    await fetchFirstPage(activeQueryRef.current);
  }, [fetchFirstPage]);

  /**
   * Updates the search query with debouncing.
   * Resets pagination and fires a new first-page fetch after the delay.
   *
   * @param q - Raw value from the search input
   */
  const setQuery = useCallback(
    (q: string) => {
      setQueryState(q);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void fetchFirstPage(q);
      }, SEARCH_DEBOUNCE_MS);
    },
    [fetchFirstPage],
  );

  // ---------------------------------------------------------------------------
  // IntersectionObserver sentinel — fires loadMore when sentinel enters viewport
  // ---------------------------------------------------------------------------

  /**
   * Callback ref attached to the invisible sentinel element at the list bottom.
   * Re-connects the observer whenever hasMore or the sentinel node changes.
   *
   * @param node - The sentinel DOM element, or null when unmounted
   */
  const sentinelRef = useCallback(
    (node: HTMLElement | null) => {
      // Disconnect any previous observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (!node || !hasMore) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            loadMore();
          }
        },
        { rootMargin: '200px' }, // start fetching 200 px before the sentinel hits the fold
      );
      observerRef.current.observe(node);
    },
    [hasMore, loadMore],
  );

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  useEffect(() => {
    void fetchFirstPage('');
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [fetchFirstPage]);

  return {
    people,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    query,
    setQuery,
    reload,
    sentinelRef,
  };
}

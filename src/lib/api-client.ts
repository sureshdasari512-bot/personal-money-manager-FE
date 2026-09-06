import { ApiError, type ApiErrorBody } from '../types/errors';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';

const AUTH_PATHS_WITHOUT_REFRESH = new Set([
  '/auth/login',
  '/auth/refresh',
  '/auth/logout',
  '/auth/accept-invite',
]);

/**
 * Reads a failed response into the shared error envelope.
 *
 * @param response - Failed fetch response
 * @returns Parsed body or a safe fallback
 */
async function readErrorBody(response: Response): Promise<ApiErrorBody> {
  try {
    const body = (await response.json()) as Partial<ApiErrorBody>;
    return {
      message: body.message ?? `Request failed: ${response.status}`,
      fields: body.fields ?? null,
    };
  } catch {
    return { message: `Request failed: ${response.status}`, fields: null };
  }
}

/**
 * Calls POST /auth/refresh without going through apiFetch to avoid a retry loop.
 *
 * @returns Whether a new access cookie was issued
 */
async function tryRefreshSession(): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
  return response.ok;
}

/**
 * Base fetch wrapper. `credentials: 'include'` is required on every call so
 * the httpOnly auth cookie is sent cross-origin (frontend and backend are
 * on different domains). On 401, one refresh-token rotation is attempted.
 *
 * @param path - API path beginning with a leading slash
 * @param options - Standard fetch options merged into the authenticated defaults
 * @returns Parsed JSON body
 * @throws {ApiError} When the response is not OK
 */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await send(path, options);

  if (response.status === 401 && !AUTH_PATHS_WITHOUT_REFRESH.has(path)) {
    const refreshed = await tryRefreshSession();
    if (refreshed) {
      return parseOk<T>(await send(path, options));
    }
  }

  return parseOk<T>(response);
}

/**
 * Sends one authenticated request.
 *
 * @param path - API path
 * @param options - Fetch options
 * @returns Raw response
 */
async function send(path: string, options: RequestInit): Promise<Response> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers,
  });
}

/**
 * Parses a successful response or throws the shared API error.
 *
 * @param response - Fetch response
 * @returns Parsed JSON body
 * @throws {ApiError} When the response is not OK
 */
async function parseOk<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await readErrorBody(response);
    throw new ApiError(body.message, response.status, body.fields);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

/**
 * The one place the app talks to the API gateway. Every request goes to the
 * same-origin `/api/*` path, which Next rewrites to the gateway (see
 * `next.config.ts`), so cookies flow automatically and there is no CORS.
 */

/** Base path for all API calls (proxied to the gateway by Next rewrites). */
export const API_BASE = "/api";

/** Field-level validation issues, as returned by the backend's Zod parser. */
export type ApiErrorDetail = {
  path?: (string | number)[];
  message: string;
  [key: string]: unknown;
};

/**
 * A normalized error for any non-2xx API response (or network failure). Carries
 * the backend error `code`, a human message, the HTTP status, and any
 * field-level `details` so forms can map them onto inputs.
 */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: ApiErrorDetail[];

  constructor(args: {
    code: string;
    message: string;
    status: number;
    details?: ApiErrorDetail[];
  }) {
    super(args.message);
    this.name = "ApiError";
    this.code = args.code;
    this.status = args.status;
    this.details = args.details;
  }

  /** Map of `fieldName -> first error message`, derived from `details`. */
  get fieldErrors(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const detail of this.details ?? []) {
      const key = detail.path?.[detail.path.length - 1];
      if (key != null && out[String(key)] === undefined) {
        out[String(key)] = detail.message;
      }
    }
    return out;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** Query-string params; `undefined`/empty values are dropped. */
  params?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
};

function buildUrl(path: string, params?: RequestOptions["params"]): string {
  const url = `${API_BASE}${path}`;
  if (!params) return url;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `${url}?${qs}` : url;
}

async function toApiError(res: Response): Promise<ApiError> {
  let code = "UNKNOWN";
  let message = res.statusText || "Request failed";
  let details: ApiErrorDetail[] | undefined;

  try {
    const data = await res.json();
    if (data && typeof data === "object") {
      code = data.error ?? data.code ?? code;
      message = data.message ?? message;
      if (Array.isArray(data.details)) details = data.details;
    }
  } catch {
    // Non-JSON error body (e.g. a gateway 502) — keep the status text.
  }

  return new ApiError({ code, message, status: res.status, details });
}

/**
 * Endpoints that must never trigger a refresh-and-retry: the refresh call
 * itself (avoid loops) and the public credential flows (a 401 there is a real
 * answer, not an expired session).
 */
const NO_REFRESH_PATHS = new Set([
  "/auth/refresh",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
]);

let refreshInFlight: Promise<boolean> | null = null;

/**
 * Ask the auth service to rotate the session using the refresh-token cookie.
 * De-duplicated so a burst of 401s triggers at most one refresh round-trip.
 */
function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

/**
 * Perform a JSON API request. Resolves to the parsed body (typed as `T`), or
 * throws an {@link ApiError}. Always sends credentials so the session cookies
 * ride along. On a 401 it transparently refreshes the short-lived access token
 * once (sliding session) and replays the request.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, params, signal } = options;
  const url = buildUrl(path, params);

  const send = async (): Promise<Response> => {
    try {
      return await fetch(url, {
        method,
        credentials: "include",
        headers:
          body !== undefined ? { "content-type": "application/json" } : {},
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal,
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") throw err;
      throw new ApiError({
        code: "NETWORK_ERROR",
        message: "Could not reach the server. Check your connection and retry.",
        status: 0,
      });
    }
  };

  let res = await send();

  if (res.status === 401 && !NO_REFRESH_PATHS.has(path)) {
    if (await refreshSession()) {
      res = await send();
    }
  }

  if (!res.ok) throw await toApiError(res);

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/** Build a same-origin gateway URL (used for file downloads / report exports). */
export function apiUrl(
  path: string,
  params?: RequestOptions["params"],
): string {
  return buildUrl(path, params);
}

export const API_BASE = "/api";

export type ApiErrorDetail = {
	path?: (string | number)[];
	message: string;
	[key: string]: unknown;
};

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

export async function apiFetch<T>(
	path: string,
	options: RequestOptions = {},
): Promise<T> {
	const { method = "GET", body, params, signal } = options;

	let res: Response;
	try {
		res = await fetch(buildUrl(path, params), {
			method,
			credentials: "include",
			headers: body !== undefined ? { "content-type": "application/json" } : {},
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

	if (!res.ok) throw await toApiError(res);

	if (res.status === 204) return undefined as T;
	const text = await res.text();
	return (text ? JSON.parse(text) : undefined) as T;
}

export function apiUrl(
	path: string,
	params?: RequestOptions["params"],
): string {
	return buildUrl(path, params);
}

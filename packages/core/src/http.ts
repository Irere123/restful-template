import { ApiError, codeFromStatus } from "./errors";

export interface ServiceRequestOptions {
	method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
	body?: unknown;
	headers?: Record<string, string>;
	/** Forward the caller's `Cookie` header for user-context downstream calls. */
	cookie?: string;
	/** Internal shared key for trusted service-to-service calls. */
	internalKey?: string;
	timeoutMs?: number;
}

/**
 * Typed JSON HTTP client for inter-service calls. Translates non-2xx upstream
 * responses and network/timeout failures into {@link ApiError}s so they flow
 * through the standard error handler with a sensible status.
 *
 * @example
 *   const { extinguishers } = await serviceRequest<{ extinguishers: E[] }>(
 *     `${cfg.managementUrl}/extinguishers`,
 *     { cookie: req.headers.cookie },
 *   );
 */
export const serviceRequest = async <T = unknown>(
	url: string,
	opts: ServiceRequestOptions = {},
): Promise<T> => {
	const {
		method = "GET",
		body,
		headers = {},
		cookie,
		internalKey,
		timeoutMs = 10_000,
	} = opts;

	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const res = await fetch(url, {
			method,
			headers: {
				...(body !== undefined ? { "content-type": "application/json" } : {}),
				...(cookie ? { cookie } : {}),
				...(internalKey ? { "x-internal-key": internalKey } : {}),
				...headers,
			},
			body: body !== undefined ? JSON.stringify(body) : undefined,
			signal: controller.signal,
		});

		const text = await res.text();
		const data = text ? JSON.parse(text) : undefined;

		if (!res.ok) {
			throw new ApiError({
				code: codeFromStatus(res.status),
				message:
					(data as { message?: string } | undefined)?.message ??
					`Upstream request failed (${res.status})`,
				details: data,
			});
		}

		return data as T;
	} catch (err) {
		if (err instanceof ApiError) throw err;
		if (err instanceof Error && err.name === "AbortError") {
			throw new ApiError({
				code: "GATEWAY_TIMEOUT",
				message: `Upstream request timed out: ${url}`,
				cause: err,
			});
		}
		throw new ApiError({
			code: "BAD_GATEWAY",
			message: `Upstream service is unavailable: ${url}`,
			cause: err,
		});
	} finally {
		clearTimeout(timer);
	}
};

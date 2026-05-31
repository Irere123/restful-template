import type { ErrorResponse } from "@api/types";

/**
 * error codes mapped to their HTTP status codes.
 * Throw an {@link ApiError} with one of these codes anywhere in the API and the
 * central error handler will translate it into the right HTTP response.
 */
export const ERROR_STATUS_CODES = {
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	PAYMENT_REQUIRED: 402,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	METHOD_NOT_SUPPORTED: 405,
	TIMEOUT: 408,
	CONFLICT: 409,
	PRECONDITION_FAILED: 412,
	PAYLOAD_TOO_LARGE: 413,
	UNSUPPORTED_MEDIA_TYPE: 415,
	UNPROCESSABLE_CONTENT: 422,
	TOO_MANY_REQUESTS: 429,
	CLIENT_CLOSED_REQUEST: 499,
	INTERNAL_SERVER_ERROR: 500,
	NOT_IMPLEMENTED: 501,
	BAD_GATEWAY: 502,
	SERVICE_UNAVAILABLE: 503,
	GATEWAY_TIMEOUT: 504,
} as const;

export type ApiErrorCode = keyof typeof ERROR_STATUS_CODES;

/** Human-readable fallback message used when none is supplied. */
const DEFAULT_MESSAGES: Record<ApiErrorCode, string> = {
	BAD_REQUEST: "Bad request",
	UNAUTHORIZED: "Unauthorized",
	PAYMENT_REQUIRED: "Payment required",
	FORBIDDEN: "Forbidden",
	NOT_FOUND: "Not found",
	METHOD_NOT_SUPPORTED: "Method not supported",
	TIMEOUT: "Request timed out",
	CONFLICT: "Conflict",
	PRECONDITION_FAILED: "Precondition failed",
	PAYLOAD_TOO_LARGE: "Payload too large",
	UNSUPPORTED_MEDIA_TYPE: "Unsupported media type",
	UNPROCESSABLE_CONTENT: "Unprocessable content",
	TOO_MANY_REQUESTS: "Too many requests",
	CLIENT_CLOSED_REQUEST: "Client closed request",
	INTERNAL_SERVER_ERROR: "An unexpected error occurred",
	NOT_IMPLEMENTED: "Not implemented",
	BAD_GATEWAY: "Bad gateway",
	SERVICE_UNAVAILABLE: "Service unavailable",
	GATEWAY_TIMEOUT: "Gateway timeout",
};

export type ApiErrorOptions = {
	code: ApiErrorCode;
	message?: string;
	/** Underlying error/value that caused this, kept for logging. */
	cause?: unknown;
	/** Extra machine-readable context surfaced to the client. */
	details?: unknown;
};

/**
 * Application error that carries {@link ApiErrorCode}.
 *
 * @example
 *   throw new ApiError({ code: "UNAUTHORIZED" });
 *   throw new ApiError({ code: "NOT_FOUND", message: "User does not exist" });
 */
export class ApiError extends Error {
	readonly code: ApiErrorCode;
	readonly statusCode: number;
	readonly details?: unknown;

	constructor({ code, message, cause, details }: ApiErrorOptions) {
		super(message ?? DEFAULT_MESSAGES[code], { cause });
		this.name = "ApiError";
		this.code = code;
		this.statusCode = ERROR_STATUS_CODES[code];
		this.details = details;

		// Keep the stack trace pointing at the throw site, not this constructor.
		Error.captureStackTrace?.(this, ApiError);
	}

	/** Serialize into the shared {@link ErrorResponse} shape. */
	toResponse(): ErrorResponse {
		return {
			error: this.code,
			message: this.message,
			...(this.details !== undefined ? { details: this.details } : {}),
		};
	}
}

/** Type guard for narrowing unknown errors to {@link ApiError}. */
export const isApiError = (err: unknown): err is ApiError =>
	err instanceof ApiError;

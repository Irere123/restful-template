import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { ApiError } from "@api/lib/errors";
import type { ErrorResponse } from "@api/types";
import { logger } from "../utils/logger";

/**
 * Central error handling middleware.
 *
 * Translates known error types into consistent, tRPC-style JSON responses.
 * Anything thrown from a route (via `asyncHandler`) ends up here.
 */
export function errorHandler(
	err: Error,
	req: Request,
	res: Response<ErrorResponse>,
	_next: NextFunction,
): void {
	logger.error("Request error", {
		method: req.method,
		path: req.path,
		error: err.message,
		stack: err.stack,
	});

	// Application errors carry their own code + status.
	if (err instanceof ApiError) {
		res.status(err.statusCode).json(err.toResponse());
		return;
	}

	// Zod validation errors -> BAD_REQUEST with the offending issues.
	if (err instanceof ZodError) {
		res.status(400).json({
			error: "BAD_REQUEST",
			message: "Invalid request parameters",
			details: err.issues,
		});
		return;
	}

	// Path traversal attempts -> BAD_REQUEST.
	if (err.message.includes("Path traversal detected")) {
		res.status(400).json({
			error: "BAD_REQUEST",
			message: "Invalid path: path traversal detected",
		});
		return;
	}

	// Anything else is an unexpected, unhandled failure.
	res.status(500).json({
		error: "INTERNAL_SERVER_ERROR",
		message: "An unexpected error occurred",
	});
}

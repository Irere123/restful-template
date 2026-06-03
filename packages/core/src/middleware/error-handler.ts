import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { ApiError } from "../errors";
import type { Logger } from "../logger";
import type { ErrorResponse } from "../types";

/**
 * Central error handling middleware factory. Translates known error types into
 * consistent JSON responses; anything thrown from a route (via `asyncHandler`)
 * ends up here. Bind the service logger once at startup:
 *
 *   app.use(createErrorHandler(logger));
 */
export const createErrorHandler =
	(logger: Logger) =>
	(
		err: Error,
		req: Request,
		res: Response<ErrorResponse>,
		_next: NextFunction,
	): void => {
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

		// Anything else is an unexpected, unhandled failure.
		res.status(500).json({
			error: "INTERNAL_SERVER_ERROR",
			message: "An unexpected error occurred",
		});
	};

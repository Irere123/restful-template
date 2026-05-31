import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import type { ErrorResponse } from "@api/types";
import { logger } from "../utils/logger";

/**
 * Error handling middleware
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

	// Handle Zod validation errors
	if (err instanceof ZodError) {
		res.status(400).json({
			error: "VALIDATION_ERROR",
			message: "Invalid request parameters",
			details: err.cause,
		});
		return;
	}

	// Handle path traversal errors
	if (err.message.includes("Path traversal detected")) {
		res.status(400).json({
			error: "SECURITY_ERROR",
			message: "Invalid path: path traversal detected",
		});
		return;
	}

	// Default error response
	const statusCode = (err as any).statusCode || 500;
	res.status(statusCode).json({
		error: "INTERNAL_ERROR",
		message: err.message || "An unexpected error occurred",
	});
}

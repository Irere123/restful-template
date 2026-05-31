import type { NextFunction, Request, Response } from "express";

import logger from "@api/utils/logger";

/**
 * Request logging middleware
 */
export function requestLogger(
	req: Request,
	res: Response,
	next: NextFunction,
): void {
	const start = Date.now();

	// Log request
	logger.info("Incoming request", {
		method: req.method,
		path: req.path,
		query: req.query,
		ip: req.ip,
	});

	// Log response
	res.on("finish", () => {
		const duration = Date.now() - start;
		logger.info("Request completed", {
			method: req.method,
			path: req.path,
			statusCode: res.statusCode,
			duration: `${duration}ms`,
		});
	});

	next();
}

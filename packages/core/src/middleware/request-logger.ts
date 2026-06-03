import type { NextFunction, Request, Response } from "express";

import type { Logger } from "../logger";

/** Log method, path, status and duration once the response is fully sent. */
export const createRequestLogger =
	(logger: Logger) => (req: Request, res: Response, next: NextFunction) => {
		const startTime = Date.now();

		res.on("finish", () => {
			const duration = Date.now() - startTime;
			logger.info("Request completed", {
				method: req.method,
				path: req.path,
				statusCode: res.statusCode,
				duration: `${duration}ms`,
			});
		});

		next();
	};

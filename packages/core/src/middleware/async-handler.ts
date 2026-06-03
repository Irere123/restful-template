import type { NextFunction, Request, Response } from "express";

/**
 * Wrap an async route handler so any rejected promise is forwarded to Express'
 * error handling instead of crashing the process with an unhandled rejection.
 */
export function asyncHandler(
	fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
	return (req: Request, res: Response, next: NextFunction): void => {
		Promise.resolve(fn(req, res, next)).catch(next);
	};
}

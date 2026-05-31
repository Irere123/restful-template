import type { NextFunction, Request, Response } from "express";

/**
 * Async route handler wrapper
 */
export function asyncHandler(
	fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
) {
	return (req: Request, res: Response, next: NextFunction) => {
		Promise.resolve(fn(req, res, next)).catch(next);
	};
}

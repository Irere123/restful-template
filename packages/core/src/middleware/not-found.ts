import type { Request, Response } from "express";

/** Terminal 404 handler mounted after all routes. */
export const notFoundHandler = (req: Request, res: Response): void => {
	res.status(404).json({
		error: "NOT_FOUND",
		message: `Route ${req.method} ${req.path} not found`,
	});
};

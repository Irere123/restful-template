import { Router } from "express";

import { asyncHandler } from "@api/middlewares";

export function createHealthRouter(): Router {
	const router = Router();

	/**
	 * GET /health
	 * Health check endpoint
	 */
	router.get(
		"/health",
		asyncHandler(async (_req, res) => {
			res.json({
				success: true,
				healthy: true,
				message: "API service is healthy",
				details: {
					uptime: process.uptime(),
					memory: process.memoryUsage(),
					pid: process.pid,
				},
			});
		}),
	);

	return router;
}

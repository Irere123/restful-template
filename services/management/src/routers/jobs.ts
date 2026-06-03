import config from "@management/config";
import { runExpiryScan, runInspectionReminders } from "@management/jobs";
import { asyncHandler, createRequireInternal } from "@repo/core";
import { Router } from "express";

/**
 * On-demand triggers for the scheduled compliance jobs. Internal-key guarded
 * (never exposed through the public gateway) — used for operational runs and
 * for verifying the jobs without waiting for the cron schedule.
 */
export const createJobsRouter = (): Router => {
	const router = Router();

	router.use(createRequireInternal(config.internalApiKey));

	router.post(
		"/expiry-scan",
		asyncHandler(async (_req, res) => {
			const summary = await runExpiryScan();
			res.json({ summary });
		}),
	);

	router.post(
		"/inspection-reminders",
		asyncHandler(async (_req, res) => {
			const summary = await runInspectionReminders();
			res.json({ summary });
		}),
	);

	return router;
};

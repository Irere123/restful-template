import config from "@management/config";
import { runExpiryScan, runInspectionReminders } from "@management/jobs";
import logger from "@management/logger";
import cron from "node-cron";

/**
 * Register the background jobs that drive automated compliance notifications.
 * Each scheduled run is fully self-contained and swallows its own errors so a
 * single failure (e.g. a notification outage) never tears down the scheduler.
 */
export const startCron = (): void => {
	if (!config.cronEnabled) {
		logger.info("Cron disabled (CRON_ENABLED=false) — jobs can still be run via /jobs");
		return;
	}

	const schedule = (
		name: string,
		expression: string,
		job: () => Promise<unknown>,
	): void => {
		if (!cron.validate(expression)) {
			logger.error(`Invalid cron expression for ${name}; job not scheduled`, {
				expression,
			});
			return;
		}
		cron.schedule(expression, () => {
			logger.info(`Cron: running ${name}`);
			job().catch((err) => {
				logger.error(`Cron job ${name} failed`, {
					error: err instanceof Error ? err.message : String(err),
				});
			});
		});
		logger.info(`Cron: scheduled ${name}`, { expression });
	};

	schedule("expiry-scan", config.expiryCron, runExpiryScan);
	schedule(
		"inspection-reminders",
		config.inspectionReminderCron,
		runInspectionReminders,
	);
};

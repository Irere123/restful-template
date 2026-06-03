import {
	createBaseApp,
	createDocsRouter,
	finalizeApp,
	startServer,
} from "@repo/core";

import config from "@management/config";
import { startCron } from "@management/cron";
import logger from "@management/logger";
import { openApiDocument } from "@management/openapi";
import { createExtinguishersRouter } from "@management/routers/extinguishers";
import { createInspectionsRouter } from "@management/routers/inspections";
import { createJobsRouter } from "@management/routers/jobs";
import { createMaintenanceRouter } from "@management/routers/maintenance";

const app = createBaseApp({
	serviceName: "management",
	logger,
	corsOrigin: config.corsOrigin,
	rateLimit: config.rateLimit,
	docsRouter: createDocsRouter(
		openApiDocument,
		"Fire Extinguisher Management API",
	),
});

app.use("/extinguishers", createExtinguishersRouter());
app.use("/inspections", createInspectionsRouter());
app.use("/maintenance", createMaintenanceRouter());
app.use("/jobs", createJobsRouter());

finalizeApp(app, logger);

startServer(app, {
	port: config.port,
	serviceName: "management",
	logger,
});

// Start the background scheduler (expiry scan + inspection reminders).
startCron();

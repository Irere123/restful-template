import {
	createBaseApp,
	createDocsRouter,
	finalizeApp,
	startServer,
} from "@repo/core";

import config from "@reporting/config";
import logger from "@reporting/logger";
import { openApiDocument } from "@reporting/openapi";
import { createReportsRouter } from "@reporting/routers/reports";

const app = createBaseApp({
	serviceName: "reporting",
	logger,
	corsOrigin: config.corsOrigin,
	rateLimit: config.rateLimit,
	docsRouter: createDocsRouter(openApiDocument, "Reporting Service API"),
});

app.use("/reports", createReportsRouter());

finalizeApp(app, logger);

startServer(app, {
	port: config.port,
	serviceName: "reporting",
	logger,
});

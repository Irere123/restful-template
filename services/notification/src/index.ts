import config from "@notification/config";
import logger from "@notification/logger";
import { openApiDocument } from "@notification/openapi";
import { createNotificationsRouter } from "@notification/routers/notifications";
import {
	createBaseApp,
	createDocsRouter,
	finalizeApp,
	startServer,
} from "@repo/core";

const app = createBaseApp({
	serviceName: "notification",
	logger,
	corsOrigin: config.corsOrigin,
	rateLimit: config.rateLimit,
	docsRouter: createDocsRouter(openApiDocument, "Notification Service API"),
});

app.use("/notifications", createNotificationsRouter());

finalizeApp(app, logger);

startServer(app, {
	port: config.port,
	serviceName: "notification",
	logger,
});

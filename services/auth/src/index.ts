import {
	createBaseApp,
	createDocsRouter,
	finalizeApp,
	startServer,
} from "@repo/core";

import config from "@auth/config";
import logger from "@auth/logger";
import { openApiDocument } from "@auth/openapi";
import { createAuthRouter } from "@auth/routers/auth";
import { createUsersRouter } from "@auth/routers/users";

const app = createBaseApp({
	serviceName: "auth",
	logger,
	corsOrigin: config.corsOrigin,
	rateLimit: config.rateLimit,
	docsRouter: createDocsRouter(openApiDocument, "Auth & User Management API"),
});

app.use("/auth", createAuthRouter());
app.use("/users", createUsersRouter());

finalizeApp(app, logger);

startServer(app, {
	port: config.port,
	serviceName: "auth",
	logger,
});

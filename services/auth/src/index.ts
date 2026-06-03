import config from "@auth/config";
import logger from "@auth/logger";
import { openApiDocument } from "@auth/openapi";
import { createAuthRouter } from "@auth/routers/auth";
import { createInternalRouter } from "@auth/routers/internal";
import { createUsersRouter } from "@auth/routers/users";
import {
	createBaseApp,
	createDocsRouter,
	finalizeApp,
	startServer,
} from "@repo/core";

const app = createBaseApp({
	serviceName: "auth",
	logger,
	corsOrigin: config.corsOrigin,
	rateLimit: config.rateLimit,
	docsRouter: createDocsRouter(openApiDocument, "Auth & User Management API"),
});

app.use("/auth", createAuthRouter());
app.use("/users", createUsersRouter());
app.use("/internal", createInternalRouter());

finalizeApp(app, logger);

startServer(app, {
	port: config.port,
	serviceName: "auth",
	logger,
});

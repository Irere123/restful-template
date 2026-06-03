import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express, type Router } from "express";
import helmet from "helmet";

import type { Logger } from "./logger";
import { createErrorHandler } from "./middleware/error-handler";
import { notFoundHandler } from "./middleware/not-found";
import { createGlobalRateLimiter } from "./middleware/rate-limit";
import { createRequestLogger } from "./middleware/request-logger";

export interface BaseAppOptions {
	serviceName: string;
	logger: Logger;
	corsOrigin: string;
	rateLimit: { windowMs: number; max: number };
	/**
	 * Router mounted BEFORE helmet — e.g. Swagger docs that need their own,
	 * looser CSP without weakening the policy for the rest of the service.
	 */
	docsRouter?: Router;
	/** Disable the built-in body parsers (gateway proxies raw streams). */
	parseBody?: boolean;
}

/**
 * Assemble the common Express middleware stack every service shares: security
 * headers, CORS, body parsing, cookies, compression, rate limiting, request
 * logging and a `/health` endpoint. Mount domain routers on the returned app,
 * then call {@link finalizeApp} to attach 404 + error handling.
 */
export const createBaseApp = (opts: BaseAppOptions): Express => {
	const { serviceName, logger, corsOrigin, rateLimit, docsRouter } = opts;
	const parseBody = opts.parseBody ?? true;

	const app = express();

	if (docsRouter) {
		app.use(docsRouter);
	}

	app.use(helmet());
	app.use(cors({ origin: corsOrigin, credentials: true }));

	// Trust the reverse proxy / gateway (needed for secure cookies and correct
	// client IPs behind a load balancer in production).
	app.set("trust proxy", 1);

	if (parseBody) {
		app.use(express.json({ limit: "10mb" }));
		app.use(express.urlencoded({ extended: true }));
	}
	app.use(cookieParser());
	app.use(compression());
	app.use(createGlobalRateLimiter(rateLimit));
	app.use(createRequestLogger(logger));

	app.get("/health", (_req, res) => {
		res.json({
			success: true,
			healthy: true,
			service: serviceName,
			uptime: process.uptime(),
			timestamp: new Date().toISOString(),
		});
	});

	return app;
};

/** Attach the terminal 404 + error handler. Call AFTER mounting all routers. */
export const finalizeApp = (app: Express, logger: Logger): void => {
	app.use(notFoundHandler);
	app.use(createErrorHandler(logger));
};

export interface StartServerOptions {
	port: number;
	serviceName: string;
	logger: Logger;
}

/** Start listening with graceful shutdown + crash-safety wiring. */
export const startServer = (app: Express, opts: StartServerOptions) => {
	const { port, serviceName, logger } = opts;

	const server = app.listen(port, () => {
		logger.info(`${serviceName} service started`, { port });
	});

	server.on("error", (err: Error) => {
		logger.error("Server startup error", { error: err.message, port });
		process.exit(1);
	});

	const shutdown = (signal: string) => {
		logger.info(`Received ${signal}, starting graceful shutdown...`);
		server.close(() => {
			logger.info("HTTP server closed");
			process.exit(0);
		});
		setTimeout(() => {
			logger.error("Forced shutdown after timeout");
			process.exit(1);
		}, 10_000).unref();
	};

	process.on("SIGTERM", () => shutdown("SIGTERM"));
	process.on("SIGINT", () => shutdown("SIGINT"));
	process.on("uncaughtException", (error) => {
		logger.error("Uncaught exception", { error });
		process.exit(1);
	});
	process.on("unhandledRejection", (reason) => {
		logger.error("Unhandled rejection", { reason });
		process.exit(1);
	});

	return server;
};

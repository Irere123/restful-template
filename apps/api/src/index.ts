import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import config from "@api/config";
import {
	errorHandler,
	globalRateLimiter,
	requestLogger,
} from "@api/middlewares";
import { createAuthRouter } from "@api/routers/auth";
import { createDocsRouter } from "@api/routers/docs";
import { createHealthRouter } from "@api/routers/health";
import { createUsersRouter } from "@api/routers/users";
import logger from "@api/utils/logger";

async function startServer() {
	try {
		logger.info("Starting server initialization...");

		const app = express();
		logger.info("Express app created successfully");

		// Mounted before the global helmet so Swagger UI can apply its own,
		// looser CSP without weakening the policy for the rest of the API.
		app.use(createDocsRouter());

		// Security middleware
		logger.info("Setting up security middleware...");
		app.use(helmet());
		app.use(
			cors({
				origin: config.corsOrigin,
				credentials: true,
			}),
		);

		// Trust the reverse proxy (needed for secure cookies and correct client
		// IPs behind a load balancer / proxy in production).
		app.set("trust proxy", 1);

		// Body parsing, cookies and compression
		logger.info("Setting up body parsing and compression...");
		app.use(express.json({ limit: "10mb" }));
		app.use(express.urlencoded({ extended: true }));
		app.use(cookieParser());
		app.use(compression());
		app.use(globalRateLimiter);

		logger.info("Setting up request logging...");
		app.use(requestLogger);

		logger.info("Setting up API routes...");

		try {
			app.use(createHealthRouter());
			app.use("/auth", createAuthRouter());
			app.use("/users", createUsersRouter());
			logger.info("All API routes configured");
		} catch (routerError) {
			logger.error("Router setup failed", {
				error:
					routerError instanceof Error
						? routerError.message
						: String(routerError),
				stack:
					routerError instanceof Error ? routerError.stack : "No stack trace",
			});
			throw routerError;
		}

		// 404 handler
		app.use((req, res) => {
			res.status(404).json({
				error: "NOT_FOUND",
				message: `Route ${req.method} ${req.path} not found`,
			});
		});

		// Error handling (must be last)
		app.use(errorHandler);

		// Start server with explicit error handling
		let server;
		try {
			server = app.listen(config.port, () => {
				logger.info("API service started", {
					port: config.port,
					environment: config.nodeEnv,
				});
			});

			// Handle server startup errors
			server.on("error", (err: Error) => {
				logger.error("Server startup error", {
					error: err.message,
					stack: err.stack,
					port: config.port,
				});
				process.exit(1);
			});
		} catch (error) {
			logger.error("Failed to start server", {
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : "No stack trace",
				port: config.port,
			});
			process.exit(1);
		}

		// Graceful shutdown
		const shutdown = async (signal: string) => {
			logger.info(`Received ${signal}, starting graceful shutdown...`);

			// Close server
			if (server) {
				server.close(() => {
					logger.info("HTTP server closed");
					process.exit(0);
				});
			} else {
				logger.warn("Server was not initialized, exiting immediately");
				process.exit(0);
			}

			// Force exit after 10 seconds
			setTimeout(() => {
				logger.error("Forced shutdown after timeout");
				process.exit(1);
			}, 10000);
		};

		process.on("SIGTERM", () => shutdown("SIGTERM"));
		process.on("SIGINT", () => shutdown("SIGINT"));

		// Handle uncaught errors
		process.on("uncaughtException", (error) => {
			logger.error("Uncaught exception", { error });
			process.exit(1);
		});

		process.on("unhandledRejection", (reason, promise) => {
			logger.error("Unhandled rejection", { reason, promise });
			process.exit(1);
		});

		return server;
	} catch (initError) {
		logger.error("Server initialization failed", {
			error: initError instanceof Error ? initError.message : String(initError),
			stack: initError instanceof Error ? initError.stack : "No stack trace",
		});
		throw initError;
	}
}

startServer().catch((error) => {
	logger.error("Failed to start server", { error });
	process.exit(1);
});

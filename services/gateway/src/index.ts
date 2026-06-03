import config from "@gateway/config";
import { createGatewayDocsRouter } from "@gateway/docs";
import logger from "@gateway/logger";
import {
	createErrorHandler,
	createGlobalRateLimiter,
	createRequestLogger,
	notFoundHandler,
	startServer,
} from "@repo/core";
import cors from "cors";
import express from "express";
import { createProxyMiddleware, type Options } from "http-proxy-middleware";

const app = express();

// Behind a load balancer in production (needed for correct client IPs).
app.set("trust proxy", 1);

// NOTE: no body parser here on purpose — the proxy must forward the raw request
// stream. Parsing the body would consume it and break proxied POST/PATCH calls.
app.use(createRequestLogger(logger));
app.use(createGlobalRateLimiter(config.rateLimit));
// The gateway owns CORS for the whole system; downstream CORS headers are
// stripped from proxied responses below to avoid duplicates.
app.use(cors({ origin: config.corsOrigin, credentials: true }));

// ── Gateway-owned routes ────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
	res.json({
		success: true,
		healthy: true,
		service: "gateway",
		uptime: process.uptime(),
		timestamp: new Date().toISOString(),
	});
});

app.get("/", (_req, res) => {
	res.json({
		service: "TZW Fire Safety — API Gateway",
		docs: "/docs",
		health: "/health",
		routes: {
			auth: ["/auth/*", "/users/*"],
			management: ["/extinguishers/*", "/inspections/*", "/maintenance/*"],
			reporting: ["/reports/*"],
		},
	});
});

app.use(createGatewayDocsRouter());

// ── Proxy plumbing ──────────────────────────────────────────────────────────

/** Respond with a clean 502 when a downstream service is unreachable. */
const onError = (err: Error, _req: unknown, res: unknown): void => {
	logger.error("Proxy error", { error: err.message });
	const r = res as {
		writeHead?: (status: number, headers: Record<string, string>) => void;
		end?: (body?: string) => void;
		headersSent?: boolean;
		destroy?: () => void;
	};
	if (typeof r.writeHead === "function" && !r.headersSent) {
		r.writeHead(502, { "content-type": "application/json" });
		r.end?.(
			JSON.stringify({
				error: "BAD_GATEWAY",
				message: "Upstream service is unavailable",
			}),
		);
	} else {
		r.destroy?.();
	}
};

/** Strip downstream CORS headers so only the gateway's CORS policy applies. */
const stripCors = (proxyRes: { headers: Record<string, unknown> }): void => {
	delete proxyRes.headers["access-control-allow-origin"];
	delete proxyRes.headers["access-control-allow-credentials"];
};

/** Match requests whose path equals or is nested under one of the prefixes. */
const prefixFilter =
	(...prefixes: string[]) =>
	(pathname: string): boolean =>
		prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));

const apiProxy = (target: string, prefixes: string[]) =>
	createProxyMiddleware({
		target,
		changeOrigin: true,
		pathFilter: prefixFilter(...prefixes),
		on: { error: onError, proxyRes: stripCors },
	} as Options);

/** Proxy that rewrites any path to a service's `/docs.json` (for aggregated docs). */
const specProxy = (target: string) =>
	createProxyMiddleware({
		target,
		changeOrigin: true,
		pathRewrite: () => "/docs.json",
		on: { error: onError },
	} as Options);

// Aggregated-docs spec proxies (same-origin so Swagger UI can fetch them).
app.use("/openapi/auth.json", specProxy(config.authUrl));
app.use("/openapi/management.json", specProxy(config.managementUrl));
app.use("/openapi/reporting.json", specProxy(config.reportingUrl));

// API reverse proxies.
app.use(apiProxy(config.authUrl, ["/auth", "/users"]));
app.use(
	apiProxy(config.managementUrl, [
		"/extinguishers",
		"/inspections",
		"/maintenance",
	]),
);
app.use(apiProxy(config.reportingUrl, ["/reports"]));

// ── Tail ────────────────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(createErrorHandler(logger));

startServer(app, {
	port: config.port,
	serviceName: "gateway",
	logger,
});

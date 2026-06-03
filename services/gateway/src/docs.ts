import { Router } from "express";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";

// Swagger UI ships inline scripts/styles, so it gets its own relaxed CSP.
const swaggerCsp = helmet({
	contentSecurityPolicy: {
		directives: {
			defaultSrc: ["'self'"],
			scriptSrc: ["'self'", "'unsafe-inline'"],
			styleSrc: ["'self'", "'unsafe-inline'"],
			imgSrc: ["'self'", "data:"],
		},
	},
});

/**
 * Aggregated Swagger UI at `/docs` with a service selector. Each spec is loaded
 * same-origin via the gateway's `/openapi/*.json` proxy routes, so "Try it out"
 * calls flow back through the gateway and hit the right downstream service.
 */
export const createGatewayDocsRouter = (): Router => {
	const router = Router();

	const urls = [
		{ url: "/openapi/auth.json", name: "Auth & User Management" },
		{ url: "/openapi/management.json", name: "Fire Extinguisher Management" },
		{ url: "/openapi/reporting.json", name: "Reporting" },
	];

	router.use(
		"/docs",
		swaggerCsp,
		swaggerUi.serve,
		swaggerUi.setup(null, {
			explorer: true,
			customSiteTitle: "TZW Fire Safety — API Gateway",
			swaggerOptions: { urls },
		}),
	);

	return router;
};

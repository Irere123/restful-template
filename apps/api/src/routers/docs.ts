import { Router } from "express";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";

import { openApiDocument } from "@api/openapi";

// Swagger UI ships inline scripts/styles that the API's strict default CSP
// blocks, so the docs get their own relaxed-but-scoped policy.
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
 * Serves the OpenAPI spec at `/docs.json` and interactive Swagger UI at `/docs`.
 */
export const createDocsRouter = (): Router => {
	const router = Router();

	router.get("/docs.json", swaggerCsp, (_req, res) => {
		res.json(openApiDocument);
	});

	router.use(
		"/docs",
		swaggerCsp,
		swaggerUi.serve,
		swaggerUi.setup(openApiDocument, { customSiteTitle: "API Docs" }),
	);

	return router;
};

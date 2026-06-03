import { Router } from "express";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";

// Swagger UI ships inline scripts/styles that the default strict CSP blocks, so
// the docs get their own relaxed-but-scoped policy.
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
 * Serve an OpenAPI document as raw JSON at `/docs.json` and interactive Swagger
 * UI at `/docs`. Mount this BEFORE the global helmet so the looser docs CSP
 * applies only here.
 */
export const createDocsRouter = (
	openApiDocument: object,
	title = "API Docs",
): Router => {
	const router = Router();

	router.get("/docs.json", swaggerCsp, (_req, res) => {
		res.json(openApiDocument);
	});

	router.use(
		"/docs",
		swaggerCsp,
		swaggerUi.serve,
		swaggerUi.setup(openApiDocument, { customSiteTitle: title }),
	);

	return router;
};

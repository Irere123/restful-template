import dotenv from "dotenv";
import { z } from "zod";

/** Load the nearest `.env` file into `process.env` (idempotent). */
export const loadEnv = (): void => {
	dotenv.config({ debug: false });
};

/**
 * Env fields shared by every service. Individual services extend this with
 * their own keys (DATABASE_URL, REFRESH_TOKEN_SECRET, downstream URLs, …).
 */
export const baseEnvSchema = z.object({
	NODE_ENV: z
		.enum(["development", "production", "test"])
		.default("development"),
	LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
	CORS_ORIGIN: z.string().default("*"),
	RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
	RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),

	// Every service verifies access tokens, so the access secret is universal.
	ACCESS_TOKEN_SECRET: z.string(),

	// Shared secret for trusted service-to-service calls (e.g. asking the
	// notification service to send an email). Defaulted for frictionless dev.
	INTERNAL_API_KEY: z.string().default("dev-internal-key"),
});

export type BaseEnv = z.infer<typeof baseEnvSchema>;

/**
 * Parse + validate `process.env` against a schema, exiting with a readable
 * report when validation fails (fail fast on misconfiguration at boot).
 */
export const parseEnv = <T extends z.ZodType>(schema: T): z.infer<T> => {
	loadEnv();
	const parsed = schema.safeParse(process.env);
	if (!parsed.success) {
		console.error(
			"Invalid environment variables:",
			z.treeifyError(parsed.error),
		);
		process.exit(1);
	}
	return parsed.data;
};

import { baseEnvSchema, parseEnv } from "@repo/core";
import { z } from "zod";

const envSchema = baseEnvSchema
	.extend({
		PORT: z.coerce.number().default(8080),
		// The gateway only proxies; downstream services verify access tokens.
		ACCESS_TOKEN_SECRET: z.string().optional(),
		AUTH_URL: z.string().default("http://localhost:8081"),
		MANAGEMENT_URL: z.string().default("http://localhost:8082"),
		REPORTING_URL: z.string().default("http://localhost:8083"),
	})
	.superRefine((env, ctx) => {
		if (env.NODE_ENV !== "production") return;
		if (env.CORS_ORIGIN === "*") {
			ctx.addIssue({
				code: "custom",
				path: ["CORS_ORIGIN"],
				message: "CORS_ORIGIN must be an explicit origin in production",
			});
		}
	});

const env = parseEnv(envSchema);

export const config = {
	port: env.PORT,
	nodeEnv: env.NODE_ENV,
	isProduction: env.NODE_ENV === "production",
	isDevelopment: env.NODE_ENV === "development",
	logLevel: env.LOG_LEVEL,
	corsOrigin: env.CORS_ORIGIN,
	rateLimit: {
		windowMs: env.RATE_LIMIT_WINDOW_MS,
		max: env.RATE_LIMIT_MAX_REQUESTS,
	},
	authUrl: env.AUTH_URL,
	managementUrl: env.MANAGEMENT_URL,
	reportingUrl: env.REPORTING_URL,
};

export default config;

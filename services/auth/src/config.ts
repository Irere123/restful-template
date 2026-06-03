import { baseEnvSchema, parseEnv } from "@repo/core";
import { z } from "zod";

const envSchema = baseEnvSchema
	.extend({
		PORT: z.coerce.number().default(8081),
		DATABASE_URL: z.string(),
		REFRESH_TOKEN_SECRET: z.string(),
		DOMAIN: z.string().optional(),
		APP_NAME: z.string().default("TZW Fire Safety"),
		NOTIFICATION_URL: z.string().default("http://localhost:8084"),
	})
	.superRefine((env, ctx) => {
		// Enforce production-grade settings only when actually running in prod, so
		// local development stays friction-free.
		if (env.NODE_ENV !== "production") return;

		for (const key of [
			"REFRESH_TOKEN_SECRET",
			"ACCESS_TOKEN_SECRET",
		] as const) {
			if (env[key].length < 32) {
				ctx.addIssue({
					code: "custom",
					path: [key],
					message: `${key} must be at least 32 characters in production`,
				});
			}
		}

		if (env.REFRESH_TOKEN_SECRET === env.ACCESS_TOKEN_SECRET) {
			ctx.addIssue({
				code: "custom",
				path: ["ACCESS_TOKEN_SECRET"],
				message: "ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET must differ",
			});
		}

		if (!env.DOMAIN) {
			ctx.addIssue({
				code: "custom",
				path: ["DOMAIN"],
				message:
					"DOMAIN is required in production (used to scope auth cookies)",
			});
		}

		if (env.CORS_ORIGIN === "*") {
			ctx.addIssue({
				code: "custom",
				path: ["CORS_ORIGIN"],
				message:
					"CORS_ORIGIN must be an explicit origin in production (credentials cannot be sent to '*')",
			});
		}
	});

const env = parseEnv(envSchema);

export const config = {
	port: env.PORT,
	databaseUrl: env.DATABASE_URL,
	nodeEnv: env.NODE_ENV,
	isProduction: env.NODE_ENV === "production",
	isDevelopment: env.NODE_ENV === "development",
	logLevel: env.LOG_LEVEL,
	corsOrigin: env.CORS_ORIGIN,
	rateLimit: {
		windowMs: env.RATE_LIMIT_WINDOW_MS,
		max: env.RATE_LIMIT_MAX_REQUESTS,
	},
	accessTokenSecret: env.ACCESS_TOKEN_SECRET,
	refreshTokenSecret: env.REFRESH_TOKEN_SECRET,
	internalApiKey: env.INTERNAL_API_KEY,
	domain: env.DOMAIN,
	appName: env.APP_NAME,
	notificationUrl: env.NOTIFICATION_URL,
};

export default config;

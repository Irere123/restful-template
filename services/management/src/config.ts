import { baseEnvSchema, parseEnv } from "@repo/core";
import { z } from "zod";

const envSchema = baseEnvSchema
	.extend({
		PORT: z.coerce.number().default(8082),
		DATABASE_URL: z.string(),
		NOTIFICATION_URL: z.string().default("http://localhost:8084"),
	})
	.superRefine((env, ctx) => {
		if (env.NODE_ENV !== "production") return;

		if (env.ACCESS_TOKEN_SECRET.length < 32) {
			ctx.addIssue({
				code: "custom",
				path: ["ACCESS_TOKEN_SECRET"],
				message: "ACCESS_TOKEN_SECRET must be at least 32 characters in production",
			});
		}
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
	internalApiKey: env.INTERNAL_API_KEY,
	notificationUrl: env.NOTIFICATION_URL,
};

export default config;

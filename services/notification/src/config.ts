import { baseEnvSchema, parseEnv } from "@repo/core";
import { z } from "zod";

const envSchema = baseEnvSchema
	.extend({
		PORT: z.coerce.number().default(8084),
		DATABASE_URL: z.string(),
		// This service never verifies JWTs (it is internal-key authenticated), so
		// the access secret is optional here.
		ACCESS_TOKEN_SECRET: z.string().optional(),
		RESEND_API_KEY: z.string().optional(),
		EMAIL_FROM: z.string().default("TZW Fire Safety <onboarding@resend.dev>"),
		APP_NAME: z.string().default("TZW Fire Safety"),
	})
	.superRefine((env, ctx) => {
		if (env.NODE_ENV !== "production") return;

		if (!env.RESEND_API_KEY) {
			ctx.addIssue({
				code: "custom",
				path: ["RESEND_API_KEY"],
				message:
					"RESEND_API_KEY is required in production (used to send all email)",
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
	internalApiKey: env.INTERNAL_API_KEY,
	resendApiKey: env.RESEND_API_KEY,
	emailFrom: env.EMAIL_FROM,
	appName: env.APP_NAME,
};

export default config;

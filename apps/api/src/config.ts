import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ debug: false });

const configSchema = z
	.object({
		PORT: z.coerce.number().default(8080),
		DATABASE_URL: z.string(),
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),
		DOMAIN: z.string().optional(),
		LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
		MAX_FILE_SIZE_MB: z.coerce.number().default(50),
		COMMAND_TIMEOUT_MS: z.coerce.number().default(30000),
		RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
		RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
		CORS_ORIGIN: z.string().default("*"),

		// authentication
		REFRESH_TOKEN_SECRET: z.string(),
		ACCESS_TOKEN_SECRET: z.string(),

		// email (Resend) — used for OTP verification emails
		RESEND_API_KEY: z.string().optional(),
		EMAIL_FROM: z.string().default("Acme <onboarding@resend.dev>"),
		APP_NAME: z.string().default("Acme"),
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

		if (!env.RESEND_API_KEY) {
			ctx.addIssue({
				code: "custom",
				path: ["RESEND_API_KEY"],
				message:
					"RESEND_API_KEY is required in production (used to send OTP verification emails)",
			});
		}
	});

const parsed = configSchema.safeParse(process.env);

if (!parsed.success) {
	console.error("Invalid environment variables:", z.treeifyError(parsed.error));
	process.exit(1);
}

export const config = {
	port: parsed.data.PORT,
	databaseUrl: parsed.data.DATABASE_URL,
	nodeEnv: parsed.data.NODE_ENV,
	logLevel: parsed.data.LOG_LEVEL,
	maxFileSizeMB: parsed.data.MAX_FILE_SIZE_MB,
	commandTimeoutMs: parsed.data.COMMAND_TIMEOUT_MS,
	rateLimitWindowMs: parsed.data.RATE_LIMIT_WINDOW_MS,
	rateLimitMaxRequests: parsed.data.RATE_LIMIT_MAX_REQUESTS,
	corsOrigin: parsed.data.CORS_ORIGIN,
	isDevelopment: parsed.data.NODE_ENV === "development",
	isProduction: parsed.data.NODE_ENV === "production",
	domain: parsed.data.DOMAIN,

	// authentication
	refreshTokenSecret: parsed.data.REFRESH_TOKEN_SECRET,
	accessTokenSecret: parsed.data.ACCESS_TOKEN_SECRET,

	// email
	resendApiKey: parsed.data.RESEND_API_KEY,
	emailFrom: parsed.data.EMAIL_FROM,
	appName: parsed.data.APP_NAME,
};

export default config;

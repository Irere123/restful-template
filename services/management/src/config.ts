import { baseEnvSchema, parseEnv } from "@repo/core";
import { z } from "zod";

const envSchema = baseEnvSchema
	.extend({
		PORT: z.coerce.number().default(8082),
		DATABASE_URL: z.string(),
		NOTIFICATION_URL: z.string().default("http://localhost:8084"),
		// Auth service — used to resolve alert recipients (admins/inspectors) for
		// the scheduled compliance jobs.
		AUTH_URL: z.string().default("http://localhost:8081"),
		APP_NAME: z.string().default("TZW Fire Safety"),
		// Background scheduler. Disable with CRON_ENABLED=false.
		CRON_ENABLED: z
			.string()
			.default("true")
			.transform((v) => v !== "false"),
		// How far ahead an extinguisher is flagged as "expiring soon" (days).
		EXPIRY_ALERT_WINDOW_DAYS: z.coerce.number().int().positive().default(30),
		// How far ahead a scheduled inspection triggers a reminder (days).
		INSPECTION_REMINDER_WINDOW_DAYS: z.coerce
			.number()
			.int()
			.positive()
			.default(3),
		// Roles that receive compliance alerts.
		ALERT_RECIPIENT_ROLES: z.string().default("admin,inspector"),
		// Cron expressions (standard 5-field). Defaults: 08:00 and 07:00 daily.
		EXPIRY_CRON: z.string().default("0 8 * * *"),
		INSPECTION_REMINDER_CRON: z.string().default("0 7 * * *"),
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
	authUrl: env.AUTH_URL,
	appName: env.APP_NAME,
	cronEnabled: env.CRON_ENABLED,
	expiryWindowDays: env.EXPIRY_ALERT_WINDOW_DAYS,
	inspectionReminderWindowDays: env.INSPECTION_REMINDER_WINDOW_DAYS,
	alertRecipientRoles: env.ALERT_RECIPIENT_ROLES.split(",")
		.map((r) => r.trim())
		.filter(Boolean),
	expiryCron: env.EXPIRY_CRON,
	inspectionReminderCron: env.INSPECTION_REMINDER_CRON,
};

export default config;

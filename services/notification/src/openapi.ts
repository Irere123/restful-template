import {
	accountDeletedSchema,
	expiryAlertSchema,
	expiryDigestSchema,
	genericEmailSchema,
	inspectionReminderSchema,
	inspectionScheduledSchema,
	loginAlertSchema,
	logoutAlertSchema,
	maintenanceLoggedSchema,
	otpNotificationSchema,
	passwordResetNotificationSchema,
	welcomeSchema,
} from "@notification/schemas";
import { z } from "zod";

type JsonSchema = Record<string, unknown>;

const toSchema = (schema: z.ZodType): JsonSchema =>
	z.toJSONSchema(schema, {
		target: "openapi-3.0",
		io: "input",
		unrepresentable: "any",
	}) as JsonSchema;

const components = {
	schemas: {
		OtpNotification: toSchema(otpNotificationSchema),
		PasswordResetNotification: toSchema(passwordResetNotificationSchema),
		GenericEmail: toSchema(genericEmailSchema),
		InspectionScheduled: toSchema(inspectionScheduledSchema),
		MaintenanceLogged: toSchema(maintenanceLoggedSchema),
		ExpiryAlert: toSchema(expiryAlertSchema),
		Welcome: toSchema(welcomeSchema),
		LoginAlert: toSchema(loginAlertSchema),
		LogoutAlert: toSchema(logoutAlertSchema),
		AccountDeleted: toSchema(accountDeletedSchema),
		ExpiryDigest: toSchema(expiryDigestSchema),
		InspectionReminder: toSchema(inspectionReminderSchema),
		Error: {
			type: "object",
			properties: {
				error: { type: "string", example: "UNAUTHORIZED" },
				message: { type: "string" },
				details: {},
			},
			required: ["error", "message"],
		},
	},
	securitySchemes: {
		internalKey: { type: "apiKey", in: "header", name: "x-internal-key" },
	},
} as const;

const ref = (name: keyof typeof components.schemas) => ({
	$ref: `#/components/schemas/${name}`,
});

const jsonBody = (schemaName: keyof typeof components.schemas) => ({
	required: true,
	content: { "application/json": { schema: ref(schemaName) } },
});

const sendResponse = {
	description: "Delivery attempt recorded",
	content: {
		"application/json": {
			schema: {
				type: "object",
				properties: {
					success: { type: "boolean" },
					status: {
						type: "string",
						enum: ["sent", "skipped", "failed"],
					},
				},
				required: ["success", "status"],
			},
		},
	},
};

const errorResponse = (description: string) => ({
	description,
	content: { "application/json": { schema: ref("Error") } },
});

const sendPath = (
	summary: string,
	schemaName: keyof typeof components.schemas,
) => ({
	post: {
		tags: ["Notifications"],
		summary,
		security: [{ internalKey: [] }],
		requestBody: jsonBody(schemaName),
		responses: {
			200: sendResponse,
			400: errorResponse("Validation failed"),
			401: errorResponse("Missing or invalid internal key"),
			502: errorResponse("Email provider rejected the send"),
		},
	},
});

const paths = {
	"/health": {
		get: {
			tags: ["Health"],
			summary: "Health check",
			security: [],
			responses: { 200: { description: "Service is healthy" } },
		},
	},
	"/notifications": {
		get: {
			tags: ["Notifications"],
			summary: "List recent notifications (internal)",
			security: [{ internalKey: [] }],
			responses: {
				200: { description: "Recent notification audit records" },
				401: errorResponse("Missing or invalid internal key"),
			},
		},
	},
	"/notifications/otp": sendPath(
		"Send an email-verification OTP",
		"OtpNotification",
	),
	"/notifications/password-reset": sendPath(
		"Send a password-reset OTP",
		"PasswordResetNotification",
	),
	"/notifications/inspection-scheduled": sendPath(
		"Notify personnel an inspection was scheduled",
		"InspectionScheduled",
	),
	"/notifications/maintenance-logged": sendPath(
		"Notify that maintenance was logged",
		"MaintenanceLogged",
	),
	"/notifications/expiry-alert": sendPath(
		"Send an extinguisher expiry alert",
		"ExpiryAlert",
	),
	"/notifications/welcome": sendPath(
		"Send a welcome email after registration",
		"Welcome",
	),
	"/notifications/login-alert": sendPath(
		"Send a new-sign-in security alert",
		"LoginAlert",
	),
	"/notifications/logout-alert": sendPath(
		"Send a sign-out confirmation",
		"LogoutAlert",
	),
	"/notifications/account-deleted": sendPath(
		"Send an account-deleted confirmation",
		"AccountDeleted",
	),
	"/notifications/expiry-digest": sendPath(
		"Send the daily expiry digest (cron)",
		"ExpiryDigest",
	),
	"/notifications/inspection-reminder": sendPath(
		"Send the daily inspection reminder digest (cron)",
		"InspectionReminder",
	),
	"/notifications/email": sendPath(
		"Send a generic transactional email",
		"GenericEmail",
	),
} as const;

export const openApiDocument = {
	openapi: "3.0.3",
	info: {
		title: "Notification Service",
		version: "1.0.0",
		description:
			"Internal service that renders and delivers all outbound email for the Fire Extinguisher Management System. Authenticated with a shared internal key.",
	},
	tags: [{ name: "Health" }, { name: "Notifications" }],
	components,
	security: [{ internalKey: [] }],
	paths,
};

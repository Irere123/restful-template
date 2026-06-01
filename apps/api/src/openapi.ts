import { z } from "zod";

import {
	changePasswordSchema,
	loginSchema,
	publicUserSchema,
	registerSchema,
	updateProfileSchema,
	verifyEmailSchema,
} from "@api/schemas/auth";

type JsonSchema = Record<string, unknown>;

/** Convert a Zod schema to an OpenAPI 3.0 schema object. */
const toSchema = (schema: z.ZodType): JsonSchema =>
	z.toJSONSchema(schema, {
		target: "openapi-3.0",
		io: "input",
		unrepresentable: "any",
	}) as JsonSchema;

const userSchema = z.toJSONSchema(publicUserSchema, {
	target: "openapi-3.0",
	unrepresentable: "any",
}) as JsonSchema;

const components = {
	schemas: {
		RegisterRequest: toSchema(registerSchema),
		LoginRequest: toSchema(loginSchema),
		UpdateProfileRequest: toSchema(updateProfileSchema),
		ChangePasswordRequest: toSchema(changePasswordSchema),
		VerifyEmailRequest: toSchema(verifyEmailSchema),
		User: userSchema,
		Error: {
			type: "object",
			properties: {
				error: { type: "string", example: "BAD_REQUEST" },
				message: { type: "string" },
				details: {},
			},
			required: ["error", "message"],
		},
	},
	// The API authenticates via httpOnly cookies set on login/register.
	securitySchemes: {
		cookieAuth: { type: "apiKey", in: "cookie", name: "id" },
	},
} as const;

const ref = (name: keyof typeof components.schemas) => ({
	$ref: `#/components/schemas/${name}`,
});

const jsonBody = (schemaName: keyof typeof components.schemas) => ({
	required: true,
	content: { "application/json": { schema: ref(schemaName) } },
});

const userResponse = (description: string) => ({
	description,
	content: {
		"application/json": {
			schema: {
				type: "object",
				properties: { user: ref("User") },
				required: ["user"],
			},
		},
	},
});

const errorResponse = (description: string) => ({
	description,
	content: { "application/json": { schema: ref("Error") } },
});

const successResponse = {
	description: "Success",
	content: {
		"application/json": {
			schema: {
				type: "object",
				properties: { success: { type: "boolean" } },
				required: ["success"],
			},
		},
	},
};

const paths = {
	"/health": {
		get: {
			tags: ["Health"],
			summary: "Health check",
			security: [],
			responses: { 200: { description: "Service is healthy" } },
		},
	},
	"/auth/register": {
		post: {
			tags: ["Auth"],
			summary: "Register a new account and start a session",
			security: [],
			requestBody: jsonBody("RegisterRequest"),
			responses: {
				201: userResponse("Account created; auth cookies set"),
				400: errorResponse("Validation failed"),
				409: errorResponse("Email or username already in use"),
			},
		},
	},
	"/auth/verify-email": {
		post: {
			tags: ["Auth"],
			summary: "Confirm the email address using an OTP code",
			security: [{ cookieAuth: [] }],
			requestBody: jsonBody("VerifyEmailRequest"),
			responses: {
				200: userResponse("Email verified; updated user returned"),
				400: errorResponse("Invalid, expired or missing code"),
				401: errorResponse("Not authenticated"),
				429: errorResponse("Too many incorrect attempts"),
			},
		},
	},
	"/auth/verify-email/resend": {
		post: {
			tags: ["Auth"],
			summary: "Send a fresh email verification code",
			security: [{ cookieAuth: [] }],
			responses: {
				200: successResponse,
				401: errorResponse("Not authenticated"),
				409: errorResponse("Email already verified"),
			},
		},
	},
	"/auth/login": {
		post: {
			tags: ["Auth"],
			summary: "Authenticate and start a session",
			security: [],
			requestBody: jsonBody("LoginRequest"),
			responses: {
				200: userResponse("Logged in; auth cookies set"),
				400: errorResponse("Validation failed"),
				401: errorResponse("Invalid email or password"),
			},
		},
	},
	"/auth/refresh": {
		post: {
			tags: ["Auth"],
			summary: "Rotate tokens using the refresh cookie",
			security: [{ cookieAuth: [] }],
			responses: {
				200: userResponse("New token pair issued"),
				401: errorResponse("Missing or invalid refresh token"),
			},
		},
	},
	"/auth/me": {
		get: {
			tags: ["Auth"],
			summary: "Get the currently authenticated user",
			security: [{ cookieAuth: [] }],
			responses: {
				200: userResponse("The current user"),
				401: errorResponse("Not authenticated"),
			},
		},
		patch: {
			tags: ["Auth"],
			summary: "Update the current user's profile",
			security: [{ cookieAuth: [] }],
			requestBody: jsonBody("UpdateProfileRequest"),
			responses: {
				200: userResponse("Updated user"),
				400: errorResponse("Validation failed"),
				401: errorResponse("Not authenticated"),
				409: errorResponse("Username already taken"),
			},
		},
	},
	"/auth/change-password": {
		post: {
			tags: ["Auth"],
			summary: "Change password and revoke other sessions",
			security: [{ cookieAuth: [] }],
			requestBody: jsonBody("ChangePasswordRequest"),
			responses: {
				200: successResponse,
				400: errorResponse("Validation failed"),
				401: errorResponse("Not authenticated or wrong current password"),
			},
		},
	},
	"/auth/logout": {
		post: {
			tags: ["Auth"],
			summary: "Clear this client's session cookies",
			security: [],
			responses: { 200: successResponse },
		},
	},
	"/auth/logout-all": {
		post: {
			tags: ["Auth"],
			summary: "Revoke every session for the current user",
			security: [{ cookieAuth: [] }],
			responses: {
				200: successResponse,
				401: errorResponse("Not authenticated"),
			},
		},
	},
	"/users": {
		get: {
			tags: ["Users"],
			summary: "List all users (admin only)",
			security: [{ cookieAuth: [] }],
			responses: {
				200: {
					description: "All users",
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									users: { type: "array", items: ref("User") },
								},
								required: ["users"],
							},
						},
					},
				},
				401: errorResponse("Not authenticated"),
				403: errorResponse("Not an admin"),
			},
		},
	},
	"/users/{id}": {
		get: {
			tags: ["Users"],
			summary: "Get a single user by id (admin only)",
			security: [{ cookieAuth: [] }],
			parameters: [
				{
					name: "id",
					in: "path",
					required: true,
					schema: { type: "string" },
				},
			],
			responses: {
				200: userResponse("The requested user"),
				401: errorResponse("Not authenticated"),
				403: errorResponse("Not an admin"),
				404: errorResponse("User not found"),
			},
		},
	},
} as const;

/** The assembled OpenAPI 3.0 document served to Swagger UI. */
export const openApiDocument = {
	openapi: "3.0.3",
	info: {
		title: "API",
		version: "1.0.0",
		description: "RESTful API with cookie-based authentication and RBAC.",
	},
	tags: [{ name: "Health" }, { name: "Auth" }, { name: "Users" }],
	components,
	security: [{ cookieAuth: [] }],
	paths,
};

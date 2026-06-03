import { z } from "zod";

import {
	completeInspectionSchema,
	createExtinguisherSchema,
	createMaintenanceSchema,
	scheduleInspectionSchema,
	updateExtinguisherSchema,
	updateInspectionSchema,
} from "@management/schemas";

type JsonSchema = Record<string, unknown>;

const toSchema = (schema: z.ZodType): JsonSchema =>
	z.toJSONSchema(schema, {
		target: "openapi-3.0",
		io: "input",
		unrepresentable: "any",
	}) as JsonSchema;

const extinguisherSchema: JsonSchema = {
	type: "object",
	properties: {
		id: { type: "string" },
		serialNumber: { type: "string" },
		location: { type: "string" },
		type: { type: "string", enum: ["water", "co2", "foam", "dry_chemical"] },
		size: { type: "string", enum: ["2.5lb", "5lb", "9lb", "12lb"] },
		installationDate: { type: "string", format: "date" },
		expiryDate: { type: "string", format: "date" },
		status: {
			type: "string",
			enum: ["active", "maintenance", "expired", "decommissioned"],
		},
		createdBy: { type: "string", nullable: true },
		createdAt: { type: "string", format: "date-time" },
		updatedAt: { type: "string", format: "date-time" },
	},
};

const inspectionSchema: JsonSchema = {
	type: "object",
	properties: {
		id: { type: "string" },
		extinguisherId: { type: "string" },
		scheduledDate: { type: "string", format: "date" },
		scheduledTime: { type: "string", nullable: true },
		status: {
			type: "string",
			enum: ["scheduled", "completed", "cancelled"],
		},
		result: {
			type: "string",
			enum: ["pass", "fail", "needs_maintenance"],
			nullable: true,
		},
		notes: { type: "string", nullable: true },
		scheduledBy: { type: "string", nullable: true },
		inspectorId: { type: "string", nullable: true },
		completedAt: { type: "string", format: "date-time", nullable: true },
		createdAt: { type: "string", format: "date-time" },
		updatedAt: { type: "string", format: "date-time" },
	},
};

const maintenanceSchema: JsonSchema = {
	type: "object",
	properties: {
		id: { type: "string" },
		extinguisherId: { type: "string" },
		inspectionId: { type: "string", nullable: true },
		actionTaken: { type: "string" },
		maintenanceDate: { type: "string", format: "date" },
		issuesIdentified: { type: "string", nullable: true },
		notes: { type: "string", nullable: true },
		inspectorId: { type: "string", nullable: true },
		createdAt: { type: "string", format: "date-time" },
	},
};

const components = {
	schemas: {
		CreateExtinguisherRequest: toSchema(createExtinguisherSchema),
		UpdateExtinguisherRequest: toSchema(updateExtinguisherSchema),
		ScheduleInspectionRequest: toSchema(scheduleInspectionSchema),
		UpdateInspectionRequest: toSchema(updateInspectionSchema),
		CompleteInspectionRequest: toSchema(completeInspectionSchema),
		CreateMaintenanceRequest: toSchema(createMaintenanceSchema),
		Extinguisher: extinguisherSchema,
		Inspection: inspectionSchema,
		MaintenanceLog: maintenanceSchema,
		Error: {
			type: "object",
			properties: {
				error: { type: "string", example: "NOT_FOUND" },
				message: { type: "string" },
				details: {},
			},
			required: ["error", "message"],
		},
	},
	securitySchemes: {
		cookieAuth: { type: "apiKey", in: "cookie", name: "id" },
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

const entityResponse = (
	key: string,
	schemaName: keyof typeof components.schemas,
	description: string,
) => ({
	description,
	content: {
		"application/json": {
			schema: {
				type: "object",
				properties: { [key]: ref(schemaName) },
				required: [key],
			},
		},
	},
});

const listResponse = (
	key: string,
	schemaName: keyof typeof components.schemas,
	description: string,
) => ({
	description,
	content: {
		"application/json": {
			schema: {
				type: "object",
				properties: { [key]: { type: "array", items: ref(schemaName) } },
				required: [key],
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

const idParam = [
	{ name: "id", in: "path", required: true, schema: { type: "string" } },
];

const paths = {
	"/health": {
		get: {
			tags: ["Health"],
			summary: "Health check",
			security: [],
			responses: { 200: { description: "Service is healthy" } },
		},
	},
	"/extinguishers": {
		get: {
			tags: ["Extinguishers"],
			summary: "List all fire extinguishers",
			parameters: [
				{
					name: "status",
					in: "query",
					schema: {
						type: "string",
						enum: ["active", "maintenance", "expired", "decommissioned"],
					},
				},
				{
					name: "type",
					in: "query",
					schema: {
						type: "string",
						enum: ["water", "co2", "foam", "dry_chemical"],
					},
				},
			],
			responses: {
				200: listResponse("extinguishers", "Extinguisher", "All extinguishers"),
				401: errorResponse("Not authenticated"),
			},
		},
		post: {
			tags: ["Extinguishers"],
			summary: "Register a new fire extinguisher (admin/inspector)",
			requestBody: jsonBody("CreateExtinguisherRequest"),
			responses: {
				201: entityResponse(
					"extinguisher",
					"Extinguisher",
					"Extinguisher created",
				),
				400: errorResponse("Validation failed"),
				403: errorResponse("Insufficient role"),
				409: errorResponse("Serial number already exists"),
			},
		},
	},
	"/extinguishers/{id}": {
		get: {
			tags: ["Extinguishers"],
			summary: "Get a fire extinguisher by id",
			parameters: idParam,
			responses: {
				200: entityResponse(
					"extinguisher",
					"Extinguisher",
					"The extinguisher",
				),
				404: errorResponse("Not found"),
			},
		},
		patch: {
			tags: ["Extinguishers"],
			summary: "Update a fire extinguisher (admin/inspector)",
			parameters: idParam,
			requestBody: jsonBody("UpdateExtinguisherRequest"),
			responses: {
				200: entityResponse(
					"extinguisher",
					"Extinguisher",
					"Updated extinguisher",
				),
				400: errorResponse("Validation failed"),
				403: errorResponse("Insufficient role"),
				404: errorResponse("Not found"),
				409: errorResponse("Serial number already in use"),
			},
		},
		delete: {
			tags: ["Extinguishers"],
			summary: "Delete a fire extinguisher (admin)",
			parameters: idParam,
			responses: {
				200: successResponse,
				403: errorResponse("Insufficient role"),
				404: errorResponse("Not found"),
			},
		},
	},
	"/inspections": {
		get: {
			tags: ["Inspections"],
			summary: "List inspections",
			parameters: [
				{
					name: "status",
					in: "query",
					schema: {
						type: "string",
						enum: ["scheduled", "completed", "cancelled"],
					},
				},
				{ name: "extinguisherId", in: "query", schema: { type: "string" } },
			],
			responses: {
				200: listResponse("inspections", "Inspection", "All inspections"),
				401: errorResponse("Not authenticated"),
			},
		},
		post: {
			tags: ["Inspections"],
			summary: "Schedule an inspection and notify personnel",
			requestBody: jsonBody("ScheduleInspectionRequest"),
			responses: {
				201: entityResponse("inspection", "Inspection", "Inspection scheduled"),
				400: errorResponse("Validation failed"),
				404: errorResponse("Extinguisher not found"),
			},
		},
	},
	"/inspections/{id}": {
		get: {
			tags: ["Inspections"],
			summary: "Get an inspection by id",
			parameters: idParam,
			responses: {
				200: entityResponse("inspection", "Inspection", "The inspection"),
				404: errorResponse("Not found"),
			},
		},
		patch: {
			tags: ["Inspections"],
			summary: "Reschedule or cancel an inspection (admin/inspector)",
			parameters: idParam,
			requestBody: jsonBody("UpdateInspectionRequest"),
			responses: {
				200: entityResponse("inspection", "Inspection", "Updated inspection"),
				400: errorResponse("Validation failed"),
				403: errorResponse("Insufficient role"),
				404: errorResponse("Not found"),
			},
		},
		delete: {
			tags: ["Inspections"],
			summary: "Delete an inspection (admin)",
			parameters: idParam,
			responses: {
				200: successResponse,
				403: errorResponse("Insufficient role"),
				404: errorResponse("Not found"),
			},
		},
	},
	"/inspections/{id}/complete": {
		post: {
			tags: ["Inspections"],
			summary: "Complete an inspection with a result (admin/inspector)",
			parameters: idParam,
			requestBody: jsonBody("CompleteInspectionRequest"),
			responses: {
				200: entityResponse("inspection", "Inspection", "Inspection completed"),
				400: errorResponse("Validation failed"),
				403: errorResponse("Insufficient role"),
				404: errorResponse("Not found"),
				409: errorResponse("Already completed"),
			},
		},
	},
	"/maintenance": {
		get: {
			tags: ["Maintenance"],
			summary: "List maintenance records",
			parameters: [
				{ name: "extinguisherId", in: "query", schema: { type: "string" } },
			],
			responses: {
				200: listResponse(
					"maintenance",
					"MaintenanceLog",
					"All maintenance records",
				),
				401: errorResponse("Not authenticated"),
			},
		},
		post: {
			tags: ["Maintenance"],
			summary: "Log a maintenance activity (admin/inspector)",
			requestBody: jsonBody("CreateMaintenanceRequest"),
			responses: {
				201: entityResponse(
					"maintenance",
					"MaintenanceLog",
					"Maintenance logged",
				),
				400: errorResponse("Validation failed"),
				403: errorResponse("Insufficient role"),
				404: errorResponse("Extinguisher not found"),
			},
		},
	},
	"/maintenance/{id}": {
		get: {
			tags: ["Maintenance"],
			summary: "Get a maintenance record by id",
			parameters: idParam,
			responses: {
				200: entityResponse(
					"maintenance",
					"MaintenanceLog",
					"The maintenance record",
				),
				404: errorResponse("Not found"),
			},
		},
	},
	"/jobs/expiry-scan": {
		post: {
			tags: ["Jobs"],
			summary:
				"Run the expiry scan now (internal): mark expired units and email the digest",
			security: [{ internalKey: [] }],
			responses: {
				200: {
					description: "Scan summary",
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									summary: {
										type: "object",
										properties: {
											expiringSoon: { type: "integer" },
											expired: { type: "integer" },
											recipients: { type: "integer" },
										},
									},
								},
							},
						},
					},
				},
				401: errorResponse("Missing or invalid internal key"),
			},
		},
	},
	"/jobs/inspection-reminders": {
		post: {
			tags: ["Jobs"],
			summary:
				"Run inspection reminders now (internal): email overdue + upcoming digest",
			security: [{ internalKey: [] }],
			responses: {
				200: {
					description: "Reminder summary",
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									summary: {
										type: "object",
										properties: {
											upcoming: { type: "integer" },
											overdue: { type: "integer" },
											recipients: { type: "integer" },
										},
									},
								},
							},
						},
					},
				},
				401: errorResponse("Missing or invalid internal key"),
			},
		},
	},
} as const;

export const openApiDocument = {
	openapi: "3.0.3",
	info: {
		title: "Fire Extinguisher Management Service",
		version: "1.0.0",
		description:
			"Extinguisher registry, inspection scheduling and maintenance logging for the Fire Extinguisher Management System.",
	},
	tags: [
		{ name: "Health" },
		{ name: "Extinguishers" },
		{ name: "Inspections" },
		{ name: "Maintenance" },
		{ name: "Jobs" },
	],
	components,
	security: [{ cookieAuth: [] }],
	paths,
};

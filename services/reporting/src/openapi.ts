const errorSchema = {
	type: "object",
	properties: {
		error: { type: "string", example: "BAD_GATEWAY" },
		message: { type: "string" },
		details: {},
	},
	required: ["error", "message"],
};

const components = {
	schemas: { Error: errorSchema },
	securitySchemes: {
		cookieAuth: { type: "apiKey", in: "cookie", name: "id" },
	},
} as const;

const reportResponse = (description: string) => ({
	description,
	content: {
		"application/json": {
			schema: {
				type: "object",
				properties: { report: { type: "object" } },
				required: ["report"],
			},
		},
	},
});

const errorResponse = (description: string) => ({
	description,
	content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
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
	"/reports/inventory": {
		get: {
			tags: ["Reports"],
			summary:
				"Inventory report — totals by type/size/status and daily/monthly/yearly summaries",
			responses: {
				200: reportResponse("Inventory report"),
				401: errorResponse("Not authenticated"),
				502: errorResponse("Management service unavailable"),
			},
		},
	},
	"/reports/inspections": {
		get: {
			tags: ["Reports"],
			summary: "Inspection report — pending, completed and overdue inspections",
			responses: {
				200: reportResponse("Inspection report"),
				401: errorResponse("Not authenticated"),
				502: errorResponse("Management service unavailable"),
			},
		},
	},
	"/reports/compliance": {
		get: {
			tags: ["Reports"],
			summary:
				"Compliance report — expired units, upcoming expirations and compliance rate",
			parameters: [
				{
					name: "windowDays",
					in: "query",
					schema: { type: "integer", default: 30 },
					description: "Look-ahead window for upcoming expirations",
				},
			],
			responses: {
				200: reportResponse("Compliance report"),
				401: errorResponse("Not authenticated"),
				502: errorResponse("Management service unavailable"),
			},
		},
	},
	"/reports/maintenance": {
		get: {
			tags: ["Reports"],
			summary:
				"Maintenance report — history, frequency and recent maintenance activity",
			parameters: [
				{
					name: "recentDays",
					in: "query",
					schema: { type: "integer", default: 30 },
					description: "Window that counts as 'recent' maintenance",
				},
			],
			responses: {
				200: reportResponse("Maintenance report"),
				401: errorResponse("Not authenticated"),
				502: errorResponse("Management service unavailable"),
			},
		},
	},
	"/reports/{type}/export": {
		get: {
			tags: ["Reports"],
			summary: "Export a report as PDF or CSV",
			parameters: [
				{
					name: "type",
					in: "path",
					required: true,
					schema: {
						type: "string",
						enum: ["inventory", "inspections", "compliance", "maintenance"],
					},
				},
				{
					name: "format",
					in: "query",
					schema: { type: "string", enum: ["pdf", "csv"], default: "pdf" },
				},
			],
			responses: {
				200: {
					description: "The exported report file",
					content: {
						"application/pdf": {
							schema: { type: "string", format: "binary" },
						},
						"text/csv": { schema: { type: "string" } },
					},
				},
				401: errorResponse("Not authenticated"),
				404: errorResponse("Unknown report type"),
				502: errorResponse("Management service unavailable"),
			},
		},
	},
} as const;

export const openApiDocument = {
	openapi: "3.0.3",
	info: {
		title: "Reporting Service",
		version: "1.0.0",
		description:
			"Real-time inventory, inspection, compliance and maintenance reports (with PDF/CSV export) for the Fire Extinguisher Management System. Aggregates live data from the management service.",
	},
	tags: [{ name: "Health" }, { name: "Reports" }],
	components,
	security: [{ cookieAuth: [] }],
	paths,
};

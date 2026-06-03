import type { z } from "zod";

import { ApiError } from "./errors";

/**
 * Parse data with a zod schema, throwing a BAD_REQUEST {@link ApiError} (with
 * the offending issues attached) on failure. Used to validate request bodies,
 * query params and route params consistently across services.
 */
export const parse = <T>(schema: z.ZodType<T>, data: unknown): T => {
	const result = schema.safeParse(data);
	if (!result.success) {
		throw new ApiError({
			code: "BAD_REQUEST",
			message: "Invalid request data",
			details: result.error.issues,
		});
	}
	return result.data;
};

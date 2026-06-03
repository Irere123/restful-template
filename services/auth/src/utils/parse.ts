import { ApiError } from "@repo/core";
import type { z } from "zod";

/** Parse a request payload with a zod schema, throwing a BAD_REQUEST ApiError. */
export const parse = <T>(schema: z.ZodType<T>, body: unknown): T => {
	const result = schema.safeParse(body);
	if (!result.success) {
		throw new ApiError({
			code: "BAD_REQUEST",
			message: "Invalid request body",
			details: result.error.issues,
		});
	}
	return result.data;
};

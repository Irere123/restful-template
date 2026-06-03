import { ApiError } from "@repo/core";

/** Validate and narrow an Express route param to a non-empty string. */
export const getIdParam = (raw: unknown): string => {
	if (typeof raw !== "string" || raw.length === 0) {
		throw new ApiError({ code: "BAD_REQUEST", message: "Invalid id parameter" });
	}
	return raw;
};

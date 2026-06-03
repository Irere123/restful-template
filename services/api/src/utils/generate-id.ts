import KSUID from "ksuid";

/**
 * Generate a sortable, collision-resistant unique id (KSUID).
 * `.string` yields the 27-char base62 representation used as the primary key.
 */
export const generateId = async (): Promise<string> => {
	const id = await KSUID.random();
	return id.string;
};

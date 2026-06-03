import type { UserRole } from "./types";

// Augment Express' Request with the authenticated principal populated by the
// shared auth middleware. All fields are optional because they are only set on
// requests that have passed through authentication.
declare global {
	namespace Express {
		interface Request {
			userId?: string;
			userRole?: UserRole;
			userEmail?: string;
		}
	}
}

export {};

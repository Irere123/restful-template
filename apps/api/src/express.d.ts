import type { User, UserRole } from "@api/db/schema";

// Augment Express' Request with the authenticated principal populated by the
// `requireAuth` middleware. All fields are optional because they are only set
// on requests that have passed through authentication.
declare global {
	namespace Express {
		interface Request {
			userId?: string;
			userRole?: UserRole;
			user?: User;
		}
	}
}

export {};

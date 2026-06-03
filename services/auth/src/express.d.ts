import type { User } from "@auth/db/schema";
import type { UserRole } from "@repo/core";

// The auth service owns the user table, so its own protected routes can attach
// the full `User` record (populated by the DB-aware requireAuth middleware on
// token refresh). Other services only ever see the JWT claims.
declare global {
	namespace Express {
		interface Request {
			userId?: string;
			userRole?: UserRole;
			userEmail?: string;
			user?: User;
		}
	}
}

export {};

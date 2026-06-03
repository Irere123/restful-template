import type { UserRole } from "@repo/core";

// Mirrors the shared Express Request augmentation so the auth-middleware types
// imported from @repo/core resolve within this service's program.
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

/** Consistent error body returned by every service (tRPC-style). */
export interface ErrorResponse {
	error: string;
	message: string;
	details?: unknown;
}

/**
 * Application roles, ordered from least to most privileged. Shared across every
 * service so RBAC checks stay consistent.
 *
 * - `user`      — schedules inspections, views status & history.
 * - `inspector` — conducts inspections, logs results & maintenance.
 * - `admin`     — manages users, settings and data integrity.
 */
export const USER_ROLES = ["user", "inspector", "admin"] as const;

export type UserRole = (typeof USER_ROLES)[number];

/** Claims carried in the short-lived access token (verified by every service). */
export interface AccessTokenPayload {
	userId: string;
	role: UserRole;
	email: string;
}

/** Claims carried in the long-lived refresh token (only the auth service reads). */
export interface RefreshTokenPayload {
	userId: string;
	refreshTokenVersion: number;
}

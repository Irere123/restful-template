import { eq, sql } from "drizzle-orm";

import { db } from "@api/db";
import { type User, type UserRole, users } from "@api/db/schema";
import { ApiError } from "@api/lib/errors";

/** Fields accepted when creating a user. Optional fields fall back to defaults. */
export type CreateUserInput = {
	id: string;
	email: string;
	password: string;
	displayName: string;
	username?: string | null;
	role?: UserRole;
};

/** Fields that may be updated on an existing user. */
export type UpdateUserInput = {
	email?: string;
	password?: string;
	displayName?: string;
	username?: string | null;
	role?: UserRole;
};

export const getUserById = async (id: string): Promise<User | undefined> => {
	return db.query.users.findFirst({ where: eq(users.id, id) });
};

export const getUserByEmail = async (
	email: string,
): Promise<User | undefined> => {
	return db.query.users.findFirst({ where: eq(users.email, email) });
};

export const getUserByUsername = async (
	username: string,
): Promise<User | undefined> => {
	return db.query.users.findFirst({ where: eq(users.username, username) });
};

export const createUser = async (input: CreateUserInput): Promise<User> => {
	const [user] = await db.insert(users).values(input).returning();
	if (!user) {
		throw new ApiError({
			code: "INTERNAL_SERVER_ERROR",
			message: "Failed to create user",
		});
	}
	return user;
};

export const updateUser = async (
	id: string,
	values: UpdateUserInput,
): Promise<User | undefined> => {
	const [user] = await db
		.update(users)
		// Cast works around a drizzle + exactOptionalPropertyTypes friction where a
		// variable of an all-optional type isn't accepted by `.set()`; only the
		// provided keys are written.
		.set({ ...values, updatedAt: new Date() } as typeof users.$inferInsert)
		.where(eq(users.id, id))
		.returning();
	return user;
};

/**
 * Bump the refresh token version, invalidating every previously issued refresh
 * token for this user (used by logout-all and password changes).
 */
export const revokeRefreshTokens = async (id: string): Promise<void> => {
	await db
		.update(users)
		.set({ refreshTokenVersion: sql`${users.refreshTokenVersion} + 1` })
		.where(eq(users.id, id));
};

export const listUsers = async (): Promise<User[]> => {
	return db.query.users.findMany({
		orderBy: (u, { desc }) => desc(u.createdAt),
	});
};

/** Mark a user's email as verified (idempotent), stamping the current time. */
export const setEmailVerified = async (
	id: string,
): Promise<User | undefined> => {
	const [user] = await db
		.update(users)
		.set({ emailVerified: new Date(), updatedAt: new Date() })
		.where(eq(users.id, id))
		.returning();
	return user;
};

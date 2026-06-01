import { integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/** Application roles, ordered from least to most privileged. */
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);

export const users = pgTable("users", {
	id: text("id").primaryKey(),
	username: text("username").unique(),
	displayName: text("displayName").notNull(),
	email: text("email").notNull().unique(),
	password: text("password").notNull(),
	role: userRoleEnum("role").notNull().default("user"),
	// Null until the user confirms their email via an OTP. Stores the moment of
	// verification (doubles as a boolean: verified === emailVerified !== null).
	emailVerified: timestamp("email_verified"),
	refreshTokenVersion: integer("refresh_token_version").notNull().default(1),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Short-lived, single-use OTP codes for email verification. Codes are stored
 * hashed (never in plaintext); at most one active row per user — issuing a new
 * code replaces the previous one.
 */
export const emailVerificationCodes = pgTable("email_verification_codes", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	codeHash: text("code_hash").notNull(),
	// Number of failed verification attempts; the code is burned once this hits
	// the configured max, to slow brute forcing of the 6-digit space.
	attempts: integer("attempts").notNull().default(0),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserRole = (typeof userRoleEnum.enumValues)[number];

export type EmailVerificationCode = typeof emailVerificationCodes.$inferSelect;
export type NewEmailVerificationCode =
	typeof emailVerificationCodes.$inferInsert;

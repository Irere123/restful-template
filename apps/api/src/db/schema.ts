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
	refreshTokenVersion: integer("refresh_token_version").notNull().default(1),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserRole = (typeof userRoleEnum.enumValues)[number];

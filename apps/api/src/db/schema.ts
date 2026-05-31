import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
	id: text("id").primaryKey(),
	username: text("username").unique(),
	displayName: text("displayName"),
	email: text("email").unique(),
	password: text("password"),
	refreshTokenVersion: integer("refresh_token_version").default(1),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

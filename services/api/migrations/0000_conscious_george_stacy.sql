CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text,
	"displayName" text,
	"email" text,
	"password" text,
	"refresh_token_version" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "displayName" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "password" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "refresh_token_version" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" "user_role" DEFAULT 'user' NOT NULL;
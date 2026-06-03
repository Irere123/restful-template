CREATE TYPE "public"."extinguisher_size" AS ENUM('2.5lb', '5lb', '9lb', '12lb');--> statement-breakpoint
CREATE TYPE "public"."extinguisher_status" AS ENUM('active', 'maintenance', 'expired', 'decommissioned');--> statement-breakpoint
CREATE TYPE "public"."extinguisher_type" AS ENUM('water', 'co2', 'foam', 'dry_chemical');--> statement-breakpoint
CREATE TYPE "public"."inspection_result" AS ENUM('pass', 'fail', 'needs_maintenance');--> statement-breakpoint
CREATE TYPE "public"."inspection_status" AS ENUM('scheduled', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "extinguishers" (
	"id" text PRIMARY KEY NOT NULL,
	"serial_number" text NOT NULL,
	"location" text NOT NULL,
	"type" "extinguisher_type" NOT NULL,
	"size" "extinguisher_size" NOT NULL,
	"installation_date" date NOT NULL,
	"expiry_date" date NOT NULL,
	"status" "extinguisher_status" DEFAULT 'active' NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "extinguishers_serial_number_unique" UNIQUE("serial_number")
);
--> statement-breakpoint
CREATE TABLE "inspections" (
	"id" text PRIMARY KEY NOT NULL,
	"extinguisher_id" text NOT NULL,
	"scheduled_date" date NOT NULL,
	"scheduled_time" text,
	"status" "inspection_status" DEFAULT 'scheduled' NOT NULL,
	"result" "inspection_result",
	"notes" text,
	"scheduled_by" text,
	"inspector_id" text,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"extinguisher_id" text NOT NULL,
	"inspection_id" text,
	"action_taken" text NOT NULL,
	"maintenance_date" date NOT NULL,
	"issues_identified" text,
	"notes" text,
	"inspector_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_extinguisher_id_extinguishers_id_fk" FOREIGN KEY ("extinguisher_id") REFERENCES "public"."extinguishers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_extinguisher_id_extinguishers_id_fk" FOREIGN KEY ("extinguisher_id") REFERENCES "public"."extinguishers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_inspection_id_inspections_id_fk" FOREIGN KEY ("inspection_id") REFERENCES "public"."inspections"("id") ON DELETE set null ON UPDATE no action;
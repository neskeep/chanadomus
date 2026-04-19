CREATE TYPE "public"."incident_priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."incident_status" AS ENUM('open', 'in_progress', 'resolved', 'closed');--> statement-breakpoint
CREATE TABLE "incident_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"incident_id" uuid NOT NULL,
	"file_path" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incident_updates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"incident_id" uuid NOT NULL,
	"old_status" "incident_status" NOT NULL,
	"new_status" "incident_status" NOT NULL,
	"note" text,
	"updated_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"priority" "incident_priority" DEFAULT 'medium' NOT NULL,
	"status" "incident_status" DEFAULT 'open' NOT NULL,
	"reported_by_id" text NOT NULL,
	"unit_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "incident_photos" ADD CONSTRAINT "incident_photos_incident_id_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."incidents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_updates" ADD CONSTRAINT "incident_updates_incident_id_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."incidents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_updates" ADD CONSTRAINT "incident_updates_updated_by_id_user_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_reported_by_id_user_id_fk" FOREIGN KEY ("reported_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "incident_photo_incident_idx" ON "incident_photos" USING btree ("incident_id");--> statement-breakpoint
CREATE INDEX "incident_update_incident_idx" ON "incident_updates" USING btree ("incident_id");--> statement-breakpoint
CREATE INDEX "incident_tenant_idx" ON "incidents" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "incident_reported_by_idx" ON "incidents" USING btree ("reported_by_id");--> statement-breakpoint
CREATE INDEX "incident_status_idx" ON "incidents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "incident_unit_idx" ON "incidents" USING btree ("unit_id");
CREATE TYPE "public"."device_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TABLE "devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"device_key_hash" text NOT NULL,
	"tenant_id" uuid NOT NULL,
	"location" text,
	"status" "device_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "access_logs" ADD COLUMN "visitor_name" text;--> statement-breakpoint
ALTER TABLE "access_logs" ADD COLUMN "visitor_document" text;--> statement-breakpoint
ALTER TABLE "access_logs" ADD COLUMN "unit_id" uuid;--> statement-breakpoint
ALTER TABLE "access_logs" ADD COLUMN "device_id" uuid;--> statement-breakpoint
ALTER TABLE "devices" ADD CONSTRAINT "devices_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "device_tenant_idx" ON "devices" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "device_key_hash_idx" ON "devices" USING btree ("device_key_hash");--> statement-breakpoint
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "access_log_device_idx" ON "access_logs" USING btree ("device_id");
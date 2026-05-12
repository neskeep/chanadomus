CREATE TYPE "public"."service_staff_role" AS ENUM('jardinero', 'domestica', 'ninera', 'chofer', 'otro');--> statement-breakpoint
CREATE TABLE "unit_service_staff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unit_id" uuid NOT NULL,
	"name" text NOT NULL,
	"role" "service_staff_role" NOT NULL,
	"id_document" text,
	"phone" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "unit_service_staff" ADD CONSTRAINT "unit_service_staff_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_service_staff" ADD CONSTRAINT "unit_service_staff_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "unit_service_staff_tenant_idx" ON "unit_service_staff" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "unit_service_staff_unit_idx" ON "unit_service_staff" USING btree ("unit_id");
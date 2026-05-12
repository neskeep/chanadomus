CREATE TYPE "public"."vehicle_pass_type" AS ENUM('resident', 'guest');--> statement-breakpoint
CREATE TABLE "vehicle_passes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"token" text NOT NULL,
	"pass_type" "vehicle_pass_type" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"issued_by" text NOT NULL,
	"occupant_limit" integer,
	"expires_at" timestamp,
	"notes" text,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deactivated_at" timestamp,
	CONSTRAINT "vehicle_passes_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "access_logs" ADD COLUMN "vehicle_pass_id" uuid;--> statement-breakpoint
ALTER TABLE "access_logs" ADD COLUMN "occupant_count" integer;--> statement-breakpoint
ALTER TABLE "vehicle_passes" ADD CONSTRAINT "vehicle_passes_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_passes" ADD CONSTRAINT "vehicle_passes_issued_by_user_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_passes" ADD CONSTRAINT "vehicle_passes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "vehicle_pass_token_idx" ON "vehicle_passes" USING btree ("token");--> statement-breakpoint
CREATE INDEX "vehicle_pass_vehicle_idx" ON "vehicle_passes" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "vehicle_pass_tenant_idx" ON "vehicle_passes" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "vehicle_pass_tenant_vehicle_idx" ON "vehicle_passes" USING btree ("tenant_id","vehicle_id");--> statement-breakpoint
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_vehicle_pass_id_vehicle_passes_id_fk" FOREIGN KEY ("vehicle_pass_id") REFERENCES "public"."vehicle_passes"("id") ON DELETE no action ON UPDATE no action;
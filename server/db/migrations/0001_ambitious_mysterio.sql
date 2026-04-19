CREATE TYPE "public"."access_result" AS ENUM('allowed', 'denied', 'expired', 'already_used');--> statement-breakpoint
CREATE TYPE "public"."entry_type" AS ENUM('qr', 'manual', 'webhook');--> statement-breakpoint
CREATE TYPE "public"."visitor_type" AS ENUM('invitado', 'proveedor');--> statement-breakpoint
CREATE TABLE "access_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"qr_code_id" uuid,
	"entry_type" "entry_type" NOT NULL,
	"authorized_by" text,
	"result" "access_result" NOT NULL,
	"tenant_id" uuid NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qr_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"owner_id" text NOT NULL,
	"visitor_name" text NOT NULL,
	"visitor_document" text,
	"visitor_type" "visitor_type" DEFAULT 'invitado' NOT NULL,
	"unit_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "qr_codes_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" text NOT NULL,
	"label" text,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_qr_code_id_qr_codes_id_fk" FOREIGN KEY ("qr_code_id") REFERENCES "public"."qr_codes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_authorized_by_user_id_fk" FOREIGN KEY ("authorized_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "access_log_tenant_idx" ON "access_logs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "access_log_qr_idx" ON "access_logs" USING btree ("qr_code_id");--> statement-breakpoint
CREATE INDEX "access_log_created_idx" ON "access_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "qr_token_idx" ON "qr_codes" USING btree ("token");--> statement-breakpoint
CREATE INDEX "qr_owner_idx" ON "qr_codes" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "qr_tenant_idx" ON "qr_codes" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "qr_tenant_unit_idx" ON "qr_codes" USING btree ("tenant_id","unit_id");--> statement-breakpoint
CREATE INDEX "unit_tenant_idx" ON "units" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unit_tenant_number_idx" ON "units" USING btree ("tenant_id","number");
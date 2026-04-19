CREATE TYPE "public"."record_type" AS ENUM('cargo', 'abono');--> statement-breakpoint
CREATE TABLE "financial_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unit_id" uuid NOT NULL,
	"type" "record_type" NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"description" text NOT NULL,
	"date" timestamp NOT NULL,
	"created_by_id" text NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "financial_records" ADD CONSTRAINT "financial_records_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_records" ADD CONSTRAINT "financial_records_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_records" ADD CONSTRAINT "financial_records_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "financial_tenant_idx" ON "financial_records" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "financial_unit_idx" ON "financial_records" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "financial_tenant_unit_idx" ON "financial_records" USING btree ("tenant_id","unit_id");--> statement-breakpoint
CREATE INDEX "financial_date_idx" ON "financial_records" USING btree ("date");
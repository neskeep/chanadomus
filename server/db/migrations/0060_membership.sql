CREATE TABLE "membership_closing_units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"closing_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"unit_id" uuid NOT NULL,
	"unit_number" text NOT NULL,
	"unit_label" text,
	"unit_kind" text DEFAULT 'otra' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"tier" text NOT NULL,
	"rate" numeric(10, 2) NOT NULL,
	"reasons" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "membership_closings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"period" text NOT NULL,
	"full_rate" numeric(10, 2) NOT NULL,
	"reduced_rate" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"units_full" integer DEFAULT 0 NOT NULL,
	"units_reduced" integer DEFAULT 0 NOT NULL,
	"total" numeric(12, 2) DEFAULT '0' NOT NULL,
	"closed_at" timestamp DEFAULT now() NOT NULL,
	"closed_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "membership_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"full_rate" numeric(10, 2) NOT NULL,
	"reduced_rate" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"effective_from" date NOT NULL,
	"notes" text,
	"created_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "membership_closing_units" ADD CONSTRAINT "membership_closing_units_closing_id_membership_closings_id_fk" FOREIGN KEY ("closing_id") REFERENCES "public"."membership_closings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_closing_units" ADD CONSTRAINT "membership_closing_units_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_closing_units" ADD CONSTRAINT "membership_closing_units_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_closings" ADD CONSTRAINT "membership_closings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_closings" ADD CONSTRAINT "membership_closings_closed_by_id_user_id_fk" FOREIGN KEY ("closed_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_rates" ADD CONSTRAINT "membership_rates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_rates" ADD CONSTRAINT "membership_rates_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "membership_closing_unit_tenant_idx" ON "membership_closing_units" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "membership_closing_unit_closing_unit_idx" ON "membership_closing_units" USING btree ("closing_id","unit_id");--> statement-breakpoint
CREATE INDEX "membership_closing_tenant_idx" ON "membership_closings" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "membership_closing_tenant_period_idx" ON "membership_closings" USING btree ("tenant_id","period");--> statement-breakpoint
CREATE INDEX "membership_rate_tenant_idx" ON "membership_rates" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "membership_rate_tenant_from_idx" ON "membership_rates" USING btree ("tenant_id","effective_from");--> statement-breakpoint
-- Semilla: tarifa inicial (4,50 / 2,00 USD desde 2026-10-01) para cada tenant. Idempotente.
INSERT INTO "membership_rates" ("tenant_id", "full_rate", "reduced_rate", "currency", "effective_from", "notes")
SELECT t."id", 4.50, 2.00, 'USD', DATE '2026-10-01', 'Tarifa inicial'
FROM "tenants" t
WHERE NOT EXISTS (
	SELECT 1 FROM "membership_rates" r
	WHERE r."tenant_id" = t."id" AND r."effective_from" = DATE '2026-10-01'
);

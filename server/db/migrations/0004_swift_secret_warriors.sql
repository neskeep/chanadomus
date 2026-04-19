CREATE TABLE "panic_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"unit_id" uuid,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "panic_events" ADD CONSTRAINT "panic_events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panic_events" ADD CONSTRAINT "panic_events_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panic_events" ADD CONSTRAINT "panic_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "panic_user_idx" ON "panic_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "panic_tenant_idx" ON "panic_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "panic_created_idx" ON "panic_events" USING btree ("created_at");
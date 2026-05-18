CREATE TABLE "frequent_visitors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"unit_id" uuid NOT NULL,
	"visitor_name" text NOT NULL,
	"visitor_document" text,
	"visitor_type" "visitor_type" DEFAULT 'invitado' NOT NULL,
	"vehicle_plate" text,
	"last_visit_at" timestamp,
	"visit_count" integer DEFAULT 0 NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resident_passes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"unit_id" uuid NOT NULL,
	"token" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "resident_passes_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "frequent_visitors" ADD CONSTRAINT "frequent_visitors_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "frequent_visitors" ADD CONSTRAINT "frequent_visitors_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "frequent_visitors" ADD CONSTRAINT "frequent_visitors_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resident_passes" ADD CONSTRAINT "resident_passes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resident_passes" ADD CONSTRAINT "resident_passes_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resident_passes" ADD CONSTRAINT "resident_passes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "freq_visitor_owner_idx" ON "frequent_visitors" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "freq_visitor_tenant_idx" ON "frequent_visitors" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "freq_visitor_unit_idx" ON "frequent_visitors" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "resident_pass_token_idx" ON "resident_passes" USING btree ("token");--> statement-breakpoint
CREATE INDEX "resident_pass_user_idx" ON "resident_passes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "resident_pass_tenant_idx" ON "resident_passes" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "resident_pass_tenant_user_idx" ON "resident_passes" USING btree ("tenant_id","user_id");
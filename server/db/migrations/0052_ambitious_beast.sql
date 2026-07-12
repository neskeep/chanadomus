CREATE TYPE "public"."support_ticket_priority" AS ENUM('baja', 'media', 'alta', 'critica');--> statement-breakpoint
CREATE TYPE "public"."support_ticket_status" AS ENUM('nuevo', 'en_revision', 'en_desarrollo', 'resuelto', 'cerrado');--> statement-breakpoint
CREATE TYPE "public"."support_ticket_type" AS ENUM('bug', 'sugerencia', 'pregunta');--> statement-breakpoint
CREATE TABLE "changelog_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version" text NOT NULL,
	"title" text NOT NULL,
	"changes" jsonb NOT NULL,
	"published_at" timestamp NOT NULL,
	"created_by_id" text NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_ticket_screenshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"file_path" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_ticket_updates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"old_status" "support_ticket_status" NOT NULL,
	"new_status" "support_ticket_status" NOT NULL,
	"note" text,
	"updated_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"type" "support_ticket_type" DEFAULT 'bug' NOT NULL,
	"priority" "support_ticket_priority" DEFAULT 'media' NOT NULL,
	"status" "support_ticket_status" DEFAULT 'nuevo' NOT NULL,
	"page_url" text,
	"user_agent" text,
	"resolved_in_version" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"reported_by_id" text NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "changelog_entries" ADD CONSTRAINT "changelog_entries_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "changelog_entries" ADD CONSTRAINT "changelog_entries_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket_screenshots" ADD CONSTRAINT "support_ticket_screenshots_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket_updates" ADD CONSTRAINT "support_ticket_updates_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket_updates" ADD CONSTRAINT "support_ticket_updates_updated_by_id_user_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_reported_by_id_user_id_fk" FOREIGN KEY ("reported_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "changelog_tenant_idx" ON "changelog_entries" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "changelog_version_idx" ON "changelog_entries" USING btree ("version");--> statement-breakpoint
CREATE INDEX "support_screenshot_ticket_idx" ON "support_ticket_screenshots" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "support_update_ticket_idx" ON "support_ticket_updates" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "support_ticket_tenant_idx" ON "support_tickets" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "support_ticket_reported_by_idx" ON "support_tickets" USING btree ("reported_by_id");--> statement-breakpoint
CREATE INDEX "support_ticket_status_idx" ON "support_tickets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "support_ticket_type_idx" ON "support_tickets" USING btree ("type");
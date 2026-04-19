CREATE TYPE "public"."announcement_category" AS ENUM('general', 'mantenimiento', 'seguridad', 'financiero', 'evento', 'urgente');--> statement-breakpoint
CREATE TYPE "public"."announcement_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"category" "announcement_category" DEFAULT 'general' NOT NULL,
	"status" "announcement_status" DEFAULT 'draft' NOT NULL,
	"attachment_path" text,
	"author_id" text NOT NULL,
	"tenant_id" uuid NOT NULL,
	"published_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "announcement_tenant_idx" ON "announcements" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "announcement_status_idx" ON "announcements" USING btree ("status");--> statement-breakpoint
CREATE INDEX "announcement_author_idx" ON "announcements" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "announcement_published_at_idx" ON "announcements" USING btree ("published_at");
CREATE TYPE "public"."meeting_status" AS ENUM('programada', 'en_curso', 'completada', 'cancelada');--> statement-breakpoint
CREATE TYPE "public"."meeting_type" AS ENUM('ordinaria', 'extraordinaria', 'comite', 'informativa');--> statement-breakpoint
CREATE TABLE "meetings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"date" timestamp NOT NULL,
	"end_date" timestamp,
	"location" text,
	"meeting_link" text,
	"type" "meeting_type" NOT NULL,
	"status" "meeting_status" DEFAULT 'programada' NOT NULL,
	"agenda" text,
	"minutes" text,
	"created_by_id" text NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "meeting_tenant_idx" ON "meetings" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "meeting_type_idx" ON "meetings" USING btree ("type");--> statement-breakpoint
CREATE INDEX "meeting_status_idx" ON "meetings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "meeting_date_idx" ON "meetings" USING btree ("date");--> statement-breakpoint
CREATE INDEX "meeting_created_by_idx" ON "meetings" USING btree ("created_by_id");
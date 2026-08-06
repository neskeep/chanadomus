-- Módulo de Eventos: enums
CREATE TYPE "public"."event_status" AS ENUM('pendiente', 'activo', 'completado', 'cancelado');--> statement-breakpoint
CREATE TYPE "public"."guest_status" AS ENUM('pendiente', 'dentro', 'salio');--> statement-breakpoint

-- Agregar 'evento' al enum entry_type existente
ALTER TYPE "public"."entry_type" ADD VALUE 'evento';--> statement-breakpoint

-- Tabla de eventos
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"unit_id" uuid NOT NULL,
	"created_by_id" text NOT NULL,
	"approved_by_id" text,
	"tenant_id" uuid NOT NULL,
	"status" "event_status" DEFAULT 'pendiente' NOT NULL,
	"starts_at" timestamp NOT NULL,
	"ends_at" timestamp NOT NULL,
	"guest_limit" integer,
	"notes" text,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Tabla de invitados de eventos
CREATE TABLE "event_guests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"document" text,
	"vehicle_plate" text,
	"status" "guest_status" DEFAULT 'pendiente' NOT NULL,
	"checked_in_at" timestamp,
	"checked_out_at" timestamp,
	"checked_in_by" text,
	"checked_out_by" text,
	"access_log_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Columna event_id en access_logs (nullable, no rompe nada existente)
ALTER TABLE "access_logs" ADD COLUMN "event_id" uuid;--> statement-breakpoint

-- Foreign keys para events
ALTER TABLE "events" ADD CONSTRAINT "events_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_approved_by_id_user_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

-- Foreign keys para event_guests
ALTER TABLE "event_guests" ADD CONSTRAINT "event_guests_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_guests" ADD CONSTRAINT "event_guests_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_guests" ADD CONSTRAINT "event_guests_checked_in_by_user_id_fk" FOREIGN KEY ("checked_in_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_guests" ADD CONSTRAINT "event_guests_checked_out_by_user_id_fk" FOREIGN KEY ("checked_out_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_guests" ADD CONSTRAINT "event_guests_access_log_id_access_logs_id_fk" FOREIGN KEY ("access_log_id") REFERENCES "public"."access_logs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

-- Índices para events
CREATE INDEX "event_tenant_idx" ON "events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "event_unit_idx" ON "events" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "event_status_idx" ON "events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "event_starts_at_idx" ON "events" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "event_created_by_idx" ON "events" USING btree ("created_by_id");--> statement-breakpoint

-- Índices para event_guests
CREATE INDEX "event_guest_event_idx" ON "event_guests" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_guest_tenant_idx" ON "event_guests" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "event_guest_name_idx" ON "event_guests" USING btree ("name");--> statement-breakpoint
CREATE INDEX "event_guest_status_idx" ON "event_guests" USING btree ("event_id","status");

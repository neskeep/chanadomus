-- Tabla catálogo de roles de personal de servicio
CREATE TABLE "service_staff_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "service_staff_roles" ADD CONSTRAINT "service_staff_roles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "service_staff_roles_tenant_idx" ON "service_staff_roles" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "service_staff_roles_name_tenant_idx" ON "service_staff_roles" USING btree ("tenant_id", "name");--> statement-breakpoint

-- Migrar unit_service_staff: reemplazar columna role (enum) con role_id (uuid FK)
ALTER TABLE "unit_service_staff" DROP COLUMN IF EXISTS "role";--> statement-breakpoint
ALTER TABLE "unit_service_staff" ADD COLUMN "role_id" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';--> statement-breakpoint
ALTER TABLE "unit_service_staff" ALTER COLUMN "role_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "unit_service_staff" ADD CONSTRAINT "unit_service_staff_role_id_service_staff_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."service_staff_roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

-- Limpiar enum viejo
DROP TYPE IF EXISTS "service_staff_role";

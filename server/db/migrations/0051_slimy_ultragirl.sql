ALTER TABLE "user" ADD COLUMN "cedula" text;--> statement-breakpoint
ALTER TABLE "service_staff_roles" ADD COLUMN "applies_to_staff" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "service_staff_roles" ADD COLUMN "applies_to_providers" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "user_tenant_cedula_idx" ON "user" USING btree ("tenant_id","cedula") WHERE "user"."cedula" IS NOT NULL;
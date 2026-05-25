ALTER TABLE "providers" ADD COLUMN "service_role_id" uuid;--> statement-breakpoint
ALTER TABLE "providers" ADD CONSTRAINT "providers_service_role_id_service_staff_roles_id_fk" FOREIGN KEY ("service_role_id") REFERENCES "public"."service_staff_roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "provider_service_role_idx" ON "providers" USING btree ("service_role_id");

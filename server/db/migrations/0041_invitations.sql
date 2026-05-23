CREATE TABLE "invitations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "token" text NOT NULL,
  "unit_id" uuid NOT NULL,
  "tenant_id" uuid NOT NULL,
  "role" text NOT NULL,
  "created_by_id" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "used_at" timestamp,
  "revoked_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "invitations_token_unique" UNIQUE("token")
);--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_unit_id_units_id_fk"
  FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_tenant_id_tenants_id_fk"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_created_by_id_user_id_fk"
  FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invitation_token_idx" ON "invitations" USING btree ("token");--> statement-breakpoint
CREATE INDEX "invitation_unit_idx" ON "invitations" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "invitation_tenant_idx" ON "invitations" USING btree ("tenant_id");

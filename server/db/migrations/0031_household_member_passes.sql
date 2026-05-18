CREATE TABLE IF NOT EXISTS "household_member_passes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "member_id" uuid NOT NULL REFERENCES "household_members"("id"),
  "unit_id" uuid NOT NULL REFERENCES "units"("id"),
  "token" text NOT NULL UNIQUE,
  "is_active" boolean NOT NULL DEFAULT true,
  "expires_at" timestamp,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id"),
  "created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "household_member_pass_token_idx" ON "household_member_passes" USING btree ("token");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "household_member_pass_member_idx" ON "household_member_passes" USING btree ("member_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "household_member_pass_tenant_idx" ON "household_member_passes" USING btree ("tenant_id");

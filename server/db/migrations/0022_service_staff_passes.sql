CREATE TABLE IF NOT EXISTS "service_staff_passes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "staff_id" uuid NOT NULL REFERENCES "unit_service_staff"("id"),
  "unit_id" uuid NOT NULL REFERENCES "units"("id"),
  "token" text NOT NULL UNIQUE,
  "is_active" boolean NOT NULL DEFAULT true,
  "expires_at" timestamp,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "service_staff_pass_token_idx" ON "service_staff_passes" USING btree ("token");
CREATE INDEX IF NOT EXISTS "service_staff_pass_staff_idx" ON "service_staff_passes" USING btree ("staff_id");
CREATE INDEX IF NOT EXISTS "service_staff_pass_tenant_idx" ON "service_staff_passes" USING btree ("tenant_id");

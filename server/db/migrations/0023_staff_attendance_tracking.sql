ALTER TABLE "access_logs" ADD COLUMN IF NOT EXISTS "staff_pass_id" uuid REFERENCES "service_staff_passes"("id");
CREATE INDEX IF NOT EXISTS "access_log_staff_pass_idx" ON "access_logs" ("staff_pass_id");

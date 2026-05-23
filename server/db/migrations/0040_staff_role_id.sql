-- Add roleId FK to staff table (nullable for backward compat)
ALTER TABLE "staff" ADD COLUMN "role_id" uuid;
ALTER TABLE "staff" ADD CONSTRAINT "staff_role_id_service_staff_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "service_staff_roles"("id") ON DELETE no action ON UPDATE no action;
CREATE INDEX IF NOT EXISTS "staff_role_id_idx" ON "staff" USING btree ("role_id");

-- Seed hardcoded roles into service_staff_roles catalog for each tenant that has staff
-- Only inserts if role name doesn't already exist for that tenant
INSERT INTO "service_staff_roles" ("id", "name", "tenant_id", "display_order")
SELECT gen_random_uuid(), role_name, t.tenant_id, role_order
FROM (
  SELECT DISTINCT "tenant_id" FROM "staff" WHERE "is_active" = true
) t
CROSS JOIN (
  VALUES ('Conserje', 1), ('Vigilancia', 2), ('Mantenimiento', 3), ('Otro', 4)
) AS roles(role_name, role_order)
WHERE NOT EXISTS (
  SELECT 1 FROM "service_staff_roles" sr
  WHERE sr."tenant_id" = t.tenant_id AND lower(sr."name") = lower(role_name)
);

-- Backfill staff.role_id from matching catalog entries (case-insensitive match)
UPDATE "staff" s
SET "role_id" = sr."id"
FROM "service_staff_roles" sr
WHERE s."tenant_id" = sr."tenant_id"
  AND lower(sr."name") = lower(
    CASE s."role"
      WHEN 'conserje' THEN 'Conserje'
      WHEN 'vigilancia' THEN 'Vigilancia'
      WHEN 'mantenimiento' THEN 'Mantenimiento'
      WHEN 'otro' THEN 'Otro'
    END
  )
  AND s."role_id" IS NULL;

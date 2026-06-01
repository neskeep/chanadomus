ALTER TABLE "service_staff_roles" ADD COLUMN IF NOT EXISTS "applies_to_staff" boolean DEFAULT true NOT NULL;
ALTER TABLE "service_staff_roles" ADD COLUMN IF NOT EXISTS "applies_to_providers" boolean DEFAULT false NOT NULL;

-- Classify existing provider-category roles
UPDATE "service_staff_roles" SET "applies_to_staff" = false, "applies_to_providers" = true WHERE "name" IN ('Gas recarga', 'Test', 'Tumba cocos');

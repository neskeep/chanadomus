-- Add is_active column to units (default true, all existing units remain active)
ALTER TABLE "units" ADD COLUMN "is_active" boolean NOT NULL DEFAULT true;

-- Insert excluded units that don't exist yet
INSERT INTO "units" ("number", "label", "is_active", "tenant_id")
SELECT val.number, val.label, false, t.id
FROM (VALUES
  ('R-033', 'Paraulata'),
  ('R-037', 'Pavita'),
  ('R-041', 'Rancho Fino'),
  ('R-060', 'Catalufa'),
  ('P-001', 'Parcela S14-C8')
) AS val(number, label)
CROSS JOIN (SELECT id FROM "tenants" LIMIT 1) AS t
WHERE NOT EXISTS (
  SELECT 1 FROM "units" u WHERE u."number" = val.number AND u."tenant_id" = t.id
);

-- Mark as inactive + update labels for units that already existed
UPDATE "units" SET "is_active" = false, "label" = 'Paraulata' WHERE "number" = 'R-033';
UPDATE "units" SET "is_active" = false, "label" = 'Pavita' WHERE "number" = 'R-037';
UPDATE "units" SET "is_active" = false, "label" = 'Rancho Fino' WHERE "number" = 'R-041';
UPDATE "units" SET "is_active" = false, "label" = 'Catalufa' WHERE "number" = 'R-060';
UPDATE "units" SET "is_active" = false WHERE "number" = 'P-001';

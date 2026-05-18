ALTER TYPE "public"."chat_room_type" ADD VALUE 'propietarios';

-- Seed propietarios room for existing tenants
INSERT INTO "chat_rooms" ("id", "name", "type", "tenant_id", "created_at")
SELECT gen_random_uuid(), 'Propietarios', 'propietarios', t.id, now()
FROM "tenants" t
WHERE NOT EXISTS (
  SELECT 1 FROM "chat_rooms" cr
  WHERE cr.tenant_id = t.id AND cr.type = 'propietarios'
);

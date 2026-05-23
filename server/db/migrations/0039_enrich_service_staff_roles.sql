-- Enrich service_staff_roles with description, isActive, displayOrder
ALTER TABLE "service_staff_roles" ADD COLUMN "description" text;
ALTER TABLE "service_staff_roles" ADD COLUMN "is_active" boolean NOT NULL DEFAULT true;
ALTER TABLE "service_staff_roles" ADD COLUMN "display_order" integer NOT NULL DEFAULT 0;

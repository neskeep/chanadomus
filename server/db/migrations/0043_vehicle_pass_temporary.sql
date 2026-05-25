-- Add 'temporary' to vehicle_pass_type enum
ALTER TYPE "vehicle_pass_type" ADD VALUE IF NOT EXISTS 'temporary';

-- Make vehicle_id nullable (temporary passes don't require a vehicle)
ALTER TABLE "vehicle_passes" ALTER COLUMN "vehicle_id" DROP NOT NULL;

-- Add unit_id for direct unit assignment (temporary passes assigned to a unit without vehicle)
ALTER TABLE "vehicle_passes" ADD COLUMN "unit_id" uuid REFERENCES "units"("id");

-- Add description field for temporary passes
ALTER TABLE "vehicle_passes" ADD COLUMN "description" text;

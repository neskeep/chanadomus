ALTER TABLE "regulations" DROP COLUMN IF EXISTS "category";--> statement-breakpoint
DROP INDEX IF EXISTS "regulation_category_idx";--> statement-breakpoint
DROP TYPE IF EXISTS "public"."regulation_category";

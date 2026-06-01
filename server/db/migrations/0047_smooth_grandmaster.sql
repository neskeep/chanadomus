ALTER TABLE "announcements" ADD COLUMN "display_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "display_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "polls" ADD COLUMN "display_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "regulations" ADD COLUMN "display_order" integer DEFAULT 0 NOT NULL;
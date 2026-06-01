ALTER TABLE "meetings" ADD COLUMN "agenda_items" jsonb;--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "minutes_attendees_data" jsonb;--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "minutes_agreements_list" jsonb;
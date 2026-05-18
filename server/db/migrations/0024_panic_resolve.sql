-- Migration: Add resolution fields to panic_events
-- Additive-only: 3 new nullable columns, no existing data affected

ALTER TABLE "panic_events" ADD COLUMN IF NOT EXISTS "resolved_at" timestamp;
ALTER TABLE "panic_events" ADD COLUMN IF NOT EXISTS "resolved_by" text;
ALTER TABLE "panic_events" ADD COLUMN IF NOT EXISTS "resolved_note" text;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'panic_events_resolved_by_user_id_fk'
  ) THEN
    ALTER TABLE "panic_events"
      ADD CONSTRAINT "panic_events_resolved_by_user_id_fk"
      FOREIGN KEY ("resolved_by") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END $$;

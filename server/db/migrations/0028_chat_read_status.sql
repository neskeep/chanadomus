CREATE TABLE IF NOT EXISTS "chat_read_status" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "room_id" uuid NOT NULL REFERENCES "chat_rooms"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "last_read_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "chat_read_status_room_user_idx" ON "chat_read_status" USING btree ("room_id", "user_id");
CREATE INDEX IF NOT EXISTS "chat_read_status_user_idx" ON "chat_read_status" USING btree ("user_id");

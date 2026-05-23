-- Add 'direct' type to chat_room_type enum
ALTER TYPE "public"."chat_room_type" ADD VALUE IF NOT EXISTS 'direct';

-- Members table for direct-message rooms (1-on-1 conversations)
CREATE TABLE IF NOT EXISTS "chat_room_members" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "room_id" uuid NOT NULL REFERENCES "chat_rooms"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "joined_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "chat_room_members_room_user_idx"
  ON "chat_room_members" USING btree ("room_id", "user_id");

CREATE INDEX IF NOT EXISTS "chat_room_members_user_idx"
  ON "chat_room_members" USING btree ("user_id");

CREATE INDEX IF NOT EXISTS "chat_room_members_room_idx"
  ON "chat_room_members" USING btree ("room_id");

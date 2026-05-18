-- Add 'conserjeria' value to chat_room_type enum
ALTER TYPE "public"."chat_room_type" ADD VALUE IF NOT EXISTS 'conserjeria';

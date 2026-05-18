-- Add pass_token to access_logs for entry/exit matching across all QR types
ALTER TABLE "access_logs" ADD COLUMN "pass_token" text;

-- Add expired_open flag for entries that exceeded 24h without exit (for investigation)
ALTER TABLE "access_logs" ADD COLUMN "expired_open" boolean DEFAULT false NOT NULL;

-- Index for efficient open-entry lookup by token
CREATE INDEX "access_log_pass_token_idx" ON "access_logs" ("pass_token") WHERE "exit_at" IS NULL AND "result" = 'allowed';

ALTER TABLE "staff" ADD COLUMN "avatar" text;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "qr_token" text;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_qr_token_unique" UNIQUE("qr_token");--> statement-breakpoint
CREATE INDEX "staff_qr_token_idx" ON "staff" USING btree ("qr_token");

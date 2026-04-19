ALTER TABLE "user" ADD COLUMN "unit_id" uuid;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_unit_idx" ON "user" USING btree ("unit_id");
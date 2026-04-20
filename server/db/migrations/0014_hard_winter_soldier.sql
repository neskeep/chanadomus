CREATE TYPE "public"."provider_category" AS ENUM('plomeria', 'electricidad', 'jardineria', 'cerrajeria', 'limpieza', 'pintura', 'albanileria', 'seguridad', 'fumigacion', 'otro');--> statement-breakpoint
CREATE TYPE "public"."provider_status" AS ENUM('active', 'inactive', 'pending');--> statement-breakpoint
CREATE TABLE "provider_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"reviewer_id" text NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"photo" text,
	"schedule" text,
	"address" text,
	"services" text[],
	"costs" text,
	"notes" text,
	"category" "provider_category" NOT NULL,
	"status" "provider_status" DEFAULT 'active' NOT NULL,
	"created_by_id" text NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "provider_reviews" ADD CONSTRAINT "provider_reviews_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_reviews" ADD CONSTRAINT "provider_reviews_reviewer_id_user_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_reviews" ADD CONSTRAINT "provider_reviews_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "providers" ADD CONSTRAINT "providers_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "providers" ADD CONSTRAINT "providers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "provider_review_provider_idx" ON "provider_reviews" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "provider_review_reviewer_idx" ON "provider_reviews" USING btree ("reviewer_id");--> statement-breakpoint
CREATE INDEX "provider_review_tenant_idx" ON "provider_reviews" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "provider_tenant_idx" ON "providers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "provider_category_idx" ON "providers" USING btree ("category");--> statement-breakpoint
CREATE INDEX "provider_status_idx" ON "providers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "provider_created_by_idx" ON "providers" USING btree ("created_by_id");
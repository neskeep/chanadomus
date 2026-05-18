-- Regulations table for permanent condominium documents (norms, schedules, architectural rules)
CREATE TYPE "public"."regulation_category" AS ENUM('normas', 'horarios', 'arquitectura');

CREATE TABLE "regulations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "category" "regulation_category" NOT NULL,
  "attachment_path" text NOT NULL,
  "author_id" text NOT NULL,
  "tenant_id" uuid NOT NULL,
  "published_at" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "regulations" ADD CONSTRAINT "regulations_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "regulations" ADD CONSTRAINT "regulations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;

CREATE INDEX "regulation_tenant_idx" ON "regulations" USING btree ("tenant_id");
CREATE INDEX "regulation_category_idx" ON "regulations" USING btree ("category");
CREATE INDEX "regulation_published_at_idx" ON "regulations" USING btree ("published_at");

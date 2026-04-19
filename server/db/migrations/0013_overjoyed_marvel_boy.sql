CREATE TABLE "push_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"tenant_id" uuid NOT NULL,
	"acceso" boolean DEFAULT true NOT NULL,
	"anuncio" boolean DEFAULT true NOT NULL,
	"incidencia" boolean DEFAULT true NOT NULL,
	"votacion" boolean DEFAULT true NOT NULL,
	"panico" boolean DEFAULT true NOT NULL,
	"finanzas" boolean DEFAULT true NOT NULL,
	"chat" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "push_preferences" ADD CONSTRAINT "push_preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_preferences" ADD CONSTRAINT "push_preferences_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "push_pref_user_tenant_idx" ON "push_preferences" USING btree ("user_id","tenant_id");
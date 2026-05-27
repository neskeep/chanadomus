CREATE TYPE "public"."record_category" AS ENUM('ordinaria', 'extraordinaria');--> statement-breakpoint
ALTER TYPE "public"."chat_room_type" ADD VALUE 'conserjeria';--> statement-breakpoint
ALTER TYPE "public"."chat_room_type" ADD VALUE 'incidencias';--> statement-breakpoint
ALTER TYPE "public"."chat_room_type" ADD VALUE 'propietarios';--> statement-breakpoint
ALTER TYPE "public"."chat_room_type" ADD VALUE 'direct';--> statement-breakpoint
ALTER TYPE "public"."vehicle_pass_type" ADD VALUE 'temporary';--> statement-breakpoint
CREATE TABLE "chat_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"file_path" text NOT NULL,
	"width" integer,
	"height" integer,
	"file_size" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_read_status" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"last_read_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_room_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "household_member_passes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"unit_id" uuid NOT NULL,
	"token" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "household_member_passes_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"unit_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"role" text NOT NULL,
	"created_by_id" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "regulations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"attachment_path" text NOT NULL,
	"author_id" text NOT NULL,
	"tenant_id" uuid NOT NULL,
	"published_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_staff_passes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"staff_id" uuid NOT NULL,
	"unit_id" uuid NOT NULL,
	"token" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "service_staff_passes_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "service_staff_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "incidents" ALTER COLUMN "unit_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "resident_passes" ALTER COLUMN "unit_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicle_passes" ALTER COLUMN "vehicle_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "access_logs" ADD COLUMN "staff_pass_id" uuid;--> statement-breakpoint
ALTER TABLE "access_logs" ADD COLUMN "pass_token" text;--> statement-breakpoint
ALTER TABLE "access_logs" ADD COLUMN "expired_open" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "financial_records" ADD COLUMN "category" "record_category" NOT NULL;--> statement-breakpoint
ALTER TABLE "incidents" ADD COLUMN "is_anonymous" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "panic_events" ADD COLUMN "resolved_at" timestamp;--> statement-breakpoint
ALTER TABLE "panic_events" ADD COLUMN "resolved_by" text;--> statement-breakpoint
ALTER TABLE "panic_events" ADD COLUMN "resolved_note" text;--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "service_role_id" uuid;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "role_id" uuid;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "avatar" text;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "qr_token" text;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "unit_id" uuid;--> statement-breakpoint
ALTER TABLE "unit_service_staff" ADD COLUMN "role_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "units" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicle_passes" ADD COLUMN "unit_id" uuid;--> statement-breakpoint
ALTER TABLE "vehicle_passes" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "chat_attachments" ADD CONSTRAINT "chat_attachments_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_read_status" ADD CONSTRAINT "chat_read_status_room_id_chat_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."chat_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_read_status" ADD CONSTRAINT "chat_read_status_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_room_members" ADD CONSTRAINT "chat_room_members_room_id_chat_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."chat_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_room_members" ADD CONSTRAINT "chat_room_members_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_member_passes" ADD CONSTRAINT "household_member_passes_member_id_household_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."household_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_member_passes" ADD CONSTRAINT "household_member_passes_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_member_passes" ADD CONSTRAINT "household_member_passes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulations" ADD CONSTRAINT "regulations_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulations" ADD CONSTRAINT "regulations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_staff_passes" ADD CONSTRAINT "service_staff_passes_staff_id_unit_service_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."unit_service_staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_staff_passes" ADD CONSTRAINT "service_staff_passes_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_staff_passes" ADD CONSTRAINT "service_staff_passes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_staff_roles" ADD CONSTRAINT "service_staff_roles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_attachment_message_idx" ON "chat_attachments" USING btree ("message_id");--> statement-breakpoint
CREATE UNIQUE INDEX "chat_read_status_room_user_idx" ON "chat_read_status" USING btree ("room_id","user_id");--> statement-breakpoint
CREATE INDEX "chat_read_status_user_idx" ON "chat_read_status" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "chat_room_members_room_user_idx" ON "chat_room_members" USING btree ("room_id","user_id");--> statement-breakpoint
CREATE INDEX "chat_room_members_user_idx" ON "chat_room_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "chat_room_members_room_idx" ON "chat_room_members" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "household_member_pass_token_idx" ON "household_member_passes" USING btree ("token");--> statement-breakpoint
CREATE INDEX "household_member_pass_member_idx" ON "household_member_passes" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "household_member_pass_tenant_idx" ON "household_member_passes" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "invitation_token_idx" ON "invitations" USING btree ("token");--> statement-breakpoint
CREATE INDEX "invitation_unit_idx" ON "invitations" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "invitation_tenant_idx" ON "invitations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "regulation_tenant_idx" ON "regulations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "regulation_published_at_idx" ON "regulations" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "service_staff_pass_token_idx" ON "service_staff_passes" USING btree ("token");--> statement-breakpoint
CREATE INDEX "service_staff_pass_staff_idx" ON "service_staff_passes" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX "service_staff_pass_tenant_idx" ON "service_staff_passes" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "service_staff_roles_tenant_idx" ON "service_staff_roles" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "service_staff_roles_name_tenant_idx" ON "service_staff_roles" USING btree ("tenant_id","name");--> statement-breakpoint
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_staff_pass_id_service_staff_passes_id_fk" FOREIGN KEY ("staff_pass_id") REFERENCES "public"."service_staff_passes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panic_events" ADD CONSTRAINT "panic_events_resolved_by_user_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "providers" ADD CONSTRAINT "providers_service_role_id_service_staff_roles_id_fk" FOREIGN KEY ("service_role_id") REFERENCES "public"."service_staff_roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_role_id_service_staff_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."service_staff_roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_service_staff" ADD CONSTRAINT "unit_service_staff_role_id_service_staff_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."service_staff_roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_passes" ADD CONSTRAINT "vehicle_passes_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "access_log_staff_pass_idx" ON "access_logs" USING btree ("staff_pass_id");--> statement-breakpoint
CREATE INDEX "access_log_pass_token_idx" ON "access_logs" USING btree ("pass_token");--> statement-breakpoint
CREATE INDEX "provider_service_role_idx" ON "providers" USING btree ("service_role_id");--> statement-breakpoint
CREATE INDEX "staff_role_id_idx" ON "staff" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "staff_qr_token_idx" ON "staff" USING btree ("qr_token");--> statement-breakpoint
CREATE INDEX "staff_unit_idx" ON "staff" USING btree ("unit_id");--> statement-breakpoint
ALTER TABLE "unit_service_staff" DROP COLUMN "role";--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_qr_token_unique" UNIQUE("qr_token");--> statement-breakpoint
DROP TYPE "public"."service_staff_role";
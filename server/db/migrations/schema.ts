import { pgTable, foreignKey, text, timestamp, unique, index, uuid, boolean, jsonb, numeric, uniqueIndex, integer, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const accessResult = pgEnum("access_result", ['allowed', 'denied', 'expired', 'already_used'])
export const announcementCategory = pgEnum("announcement_category", ['general', 'mantenimiento', 'seguridad', 'financiero', 'evento', 'urgente'])
export const announcementStatus = pgEnum("announcement_status", ['draft', 'published', 'archived'])
export const chatRoomType = pgEnum("chat_room_type", ['general', 'unit', 'vigilancia', 'admin', 'conserjeria'])
export const deviceStatus = pgEnum("device_status", ['active', 'inactive'])
export const entryType = pgEnum("entry_type", ['qr', 'manual', 'webhook'])
export const householdRelationship = pgEnum("household_relationship", ['owner', 'spouse', 'child', 'tenant', 'other'])
export const incidentPriority = pgEnum("incident_priority", ['low', 'medium', 'high'])
export const incidentStatus = pgEnum("incident_status", ['open', 'in_progress', 'resolved', 'closed'])
export const meetingStatus = pgEnum("meeting_status", ['programada', 'en_curso', 'completada', 'cancelada'])
export const meetingType = pgEnum("meeting_type", ['ordinaria', 'extraordinaria', 'comite', 'informativa'])
export const pollStatus = pgEnum("poll_status", ['draft', 'active', 'closed'])
export const pollType = pgEnum("poll_type", ['single', 'multiple'])
export const providerCategory = pgEnum("provider_category", ['plomeria', 'electricidad', 'jardineria', 'cerrajeria', 'limpieza', 'pintura', 'albanileria', 'seguridad', 'fumigacion', 'otro'])
export const providerStatus = pgEnum("provider_status", ['active', 'inactive', 'pending'])
export const recordType = pgEnum("record_type", ['cargo', 'abono'])
export const regulationCategory = pgEnum("regulation_category", ['normas', 'horarios', 'arquitectura'])
export const staffRole = pgEnum("staff_role", ['conserje', 'vigilancia', 'mantenimiento', 'otro'])
export const vehiclePassType = pgEnum("vehicle_pass_type", ['resident', 'guest'])
export const visitorType = pgEnum("visitor_type", ['invitado', 'proveedor'])


export const account = pgTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: 'string' }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_user_id_user_id_fk"
		}),
]);

export const session = pgTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull(),
	impersonatedBy: text("impersonated_by"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_user_id_user_id_fk"
		}),
	unique("session_token_unique").on(table.token),
]);

export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const incidents = pgTable("incidents", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	description: text().notNull(),
	priority: incidentPriority().default('medium').notNull(),
	status: incidentStatus().default('open').notNull(),
	reportedById: text("reported_by_id").notNull(),
	unitId: uuid("unit_id").notNull(),
	tenantId: uuid("tenant_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	resolvedAt: timestamp("resolved_at", { mode: 'string' }),
	isAnonymous: boolean("is_anonymous").default(false).notNull(),
}, (table) => [
	index("incident_reported_by_idx").using("btree", table.reportedById.asc().nullsLast().op("text_ops")),
	index("incident_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("incident_tenant_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	index("incident_unit_idx").using("btree", table.unitId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.reportedById],
			foreignColumns: [user.id],
			name: "incidents_reported_by_id_user_id_fk"
		}),
	foreignKey({
			columns: [table.unitId],
			foreignColumns: [units.id],
			name: "incidents_unit_id_units_id_fk"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "incidents_tenant_id_tenants_id_fk"
		}),
]);

export const incidentUpdates = pgTable("incident_updates", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	incidentId: uuid("incident_id").notNull(),
	oldStatus: incidentStatus("old_status").notNull(),
	newStatus: incidentStatus("new_status").notNull(),
	note: text(),
	updatedById: text("updated_by_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("incident_update_incident_idx").using("btree", table.incidentId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.incidentId],
			foreignColumns: [incidents.id],
			name: "incident_updates_incident_id_incidents_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.updatedById],
			foreignColumns: [user.id],
			name: "incident_updates_updated_by_id_user_id_fk"
		}),
]);

export const incidentPhotos = pgTable("incident_photos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	incidentId: uuid("incident_id").notNull(),
	filePath: text("file_path").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("incident_photo_incident_idx").using("btree", table.incidentId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.incidentId],
			foreignColumns: [incidents.id],
			name: "incident_photos_incident_id_incidents_id_fk"
		}).onDelete("cascade"),
]);

export const tenants = pgTable("tenants", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	config: jsonb().default({}),
	status: text().default('active').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("tenants_slug_unique").on(table.slug),
]);

export const financialRecords = pgTable("financial_records", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	unitId: uuid("unit_id").notNull(),
	type: recordType().notNull(),
	amount: numeric({ precision: 12, scale:  2 }).notNull(),
	description: text().notNull(),
	date: timestamp({ mode: 'string' }).notNull(),
	createdById: text("created_by_id").notNull(),
	tenantId: uuid("tenant_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("financial_date_idx").using("btree", table.date.asc().nullsLast().op("timestamp_ops")),
	index("financial_tenant_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	index("financial_tenant_unit_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops"), table.unitId.asc().nullsLast().op("uuid_ops")),
	index("financial_unit_idx").using("btree", table.unitId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.unitId],
			foreignColumns: [units.id],
			name: "financial_records_unit_id_units_id_fk"
		}),
	foreignKey({
			columns: [table.createdById],
			foreignColumns: [user.id],
			name: "financial_records_created_by_id_user_id_fk"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "financial_records_tenant_id_tenants_id_fk"
		}),
]);

export const qrCodes = pgTable("qr_codes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	token: text().notNull(),
	ownerId: text("owner_id").notNull(),
	visitorName: text("visitor_name").notNull(),
	visitorDocument: text("visitor_document"),
	visitorType: visitorType("visitor_type").default('invitado').notNull(),
	unitId: uuid("unit_id").notNull(),
	tenantId: uuid("tenant_id").notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	usedAt: timestamp("used_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("qr_owner_idx").using("btree", table.ownerId.asc().nullsLast().op("text_ops")),
	index("qr_tenant_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	index("qr_tenant_unit_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops"), table.unitId.asc().nullsLast().op("uuid_ops")),
	index("qr_token_idx").using("btree", table.token.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [user.id],
			name: "qr_codes_owner_id_user_id_fk"
		}),
	foreignKey({
			columns: [table.unitId],
			foreignColumns: [units.id],
			name: "qr_codes_unit_id_units_id_fk"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "qr_codes_tenant_id_tenants_id_fk"
		}),
	unique("qr_codes_token_unique").on(table.token),
]);

export const units = pgTable("units", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	number: text().notNull(),
	label: text(),
	tenantId: uuid("tenant_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("unit_tenant_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("unit_tenant_number_idx").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.number.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "units_tenant_id_tenants_id_fk"
		}),
]);

export const accessLogs = pgTable("access_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	qrCodeId: uuid("qr_code_id"),
	entryType: entryType("entry_type").notNull(),
	authorizedBy: text("authorized_by"),
	result: accessResult().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	visitorName: text("visitor_name"),
	visitorDocument: text("visitor_document"),
	unitId: uuid("unit_id"),
	deviceId: uuid("device_id"),
	exitAt: timestamp("exit_at", { mode: 'string' }),
	vehiclePassId: uuid("vehicle_pass_id"),
	occupantCount: integer("occupant_count"),
	staffPassId: uuid("staff_pass_id"),
}, (table) => [
	index("access_log_created_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("access_log_device_idx").using("btree", table.deviceId.asc().nullsLast().op("uuid_ops")),
	index("access_log_qr_idx").using("btree", table.qrCodeId.asc().nullsLast().op("uuid_ops")),
	index("access_log_staff_pass_idx").using("btree", table.staffPassId.asc().nullsLast().op("uuid_ops")),
	index("access_log_tenant_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.qrCodeId],
			foreignColumns: [qrCodes.id],
			name: "access_logs_qr_code_id_qr_codes_id_fk"
		}),
	foreignKey({
			columns: [table.authorizedBy],
			foreignColumns: [user.id],
			name: "access_logs_authorized_by_user_id_fk"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "access_logs_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.unitId],
			foreignColumns: [units.id],
			name: "access_logs_unit_id_units_id_fk"
		}),
	foreignKey({
			columns: [table.deviceId],
			foreignColumns: [devices.id],
			name: "access_logs_device_id_devices_id_fk"
		}),
	foreignKey({
			columns: [table.vehiclePassId],
			foreignColumns: [vehiclePasses.id],
			name: "access_logs_vehicle_pass_id_vehicle_passes_id_fk"
		}),
	foreignKey({
			columns: [table.staffPassId],
			foreignColumns: [serviceStaffPasses.id],
			name: "access_logs_staff_pass_id_fkey"
		}),
]);

export const householdMembers = pgTable("household_members", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	unitId: uuid("unit_id").notNull(),
	name: text().notNull(),
	relationship: householdRelationship().notNull(),
	idDocument: text("id_document"),
	phone: text(),
	isActive: boolean("is_active").default(true).notNull(),
	tenantId: uuid("tenant_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("household_tenant_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	index("household_unit_idx").using("btree", table.unitId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.unitId],
			foreignColumns: [units.id],
			name: "household_members_unit_id_units_id_fk"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "household_members_tenant_id_tenants_id_fk"
		}),
]);

export const devices = pgTable("devices", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	deviceKeyHash: text("device_key_hash").notNull(),
	tenantId: uuid("tenant_id").notNull(),
	location: text(),
	status: deviceStatus().default('active').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("device_key_hash_idx").using("btree", table.deviceKeyHash.asc().nullsLast().op("text_ops")),
	index("device_tenant_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "devices_tenant_id_tenants_id_fk"
		}),
]);

export const vehicles = pgTable("vehicles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	unitId: uuid("unit_id").notNull(),
	ownerMemberId: uuid("owner_member_id"),
	plate: text().notNull(),
	brand: text().notNull(),
	model: text().notNull(),
	color: text().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("vehicle_tenant_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("vehicle_tenant_plate_idx").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.plate.asc().nullsLast().op("text_ops")),
	index("vehicle_unit_idx").using("btree", table.unitId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.unitId],
			foreignColumns: [units.id],
			name: "vehicles_unit_id_units_id_fk"
		}),
	foreignKey({
			columns: [table.ownerMemberId],
			foreignColumns: [householdMembers.id],
			name: "vehicles_owner_member_id_household_members_id_fk"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "vehicles_tenant_id_tenants_id_fk"
		}),
]);

export const messages = pgTable("messages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	roomId: uuid("room_id").notNull(),
	userId: text("user_id").notNull(),
	content: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("message_room_created_idx").using("btree", table.roomId.asc().nullsLast().op("timestamp_ops"), table.createdAt.asc().nullsLast().op("timestamp_ops")),
	foreignKey({
			columns: [table.roomId],
			foreignColumns: [chatRooms.id],
			name: "messages_room_id_chat_rooms_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "messages_user_id_user_id_fk"
		}),
]);

export const announcements = pgTable("announcements", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	body: text().notNull(),
	category: announcementCategory().default('general').notNull(),
	status: announcementStatus().default('draft').notNull(),
	attachmentPath: text("attachment_path"),
	authorId: text("author_id").notNull(),
	tenantId: uuid("tenant_id").notNull(),
	publishedAt: timestamp("published_at", { mode: 'string' }),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("announcement_author_idx").using("btree", table.authorId.asc().nullsLast().op("text_ops")),
	index("announcement_published_at_idx").using("btree", table.publishedAt.asc().nullsLast().op("timestamp_ops")),
	index("announcement_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("announcement_tenant_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [user.id],
			name: "announcements_author_id_user_id_fk"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "announcements_tenant_id_tenants_id_fk"
		}),
]);

export const pushSubscriptions = pgTable("push_subscriptions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	endpoint: text().notNull(),
	p256Dh: text().notNull(),
	auth: text().notNull(),
	role: text().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("push_sub_endpoint_idx").using("btree", table.endpoint.asc().nullsLast().op("text_ops")),
	index("push_sub_role_idx").using("btree", table.role.asc().nullsLast().op("text_ops")),
	index("push_sub_tenant_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	index("push_sub_user_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "push_subscriptions_user_id_user_id_fk"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "push_subscriptions_tenant_id_tenants_id_fk"
		}),
]);

export const financialReports = pgTable("financial_reports", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	filePath: text("file_path").notNull(),
	month: integer().notNull(),
	year: integer().notNull(),
	uploadedById: text("uploaded_by_id").notNull(),
	tenantId: uuid("tenant_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("report_tenant_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	index("report_year_month_idx").using("btree", table.year.asc().nullsLast().op("int4_ops"), table.month.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.uploadedById],
			foreignColumns: [user.id],
			name: "financial_reports_uploaded_by_id_user_id_fk"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "financial_reports_tenant_id_tenants_id_fk"
		}),
]);

export const chatRooms = pgTable("chat_rooms", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	type: chatRoomType().notNull(),
	unitId: uuid("unit_id"),
	tenantId: uuid("tenant_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("chat_room_tenant_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("chat_room_tenant_type_unit_idx").using("btree", table.tenantId.asc().nullsLast().op("enum_ops"), table.type.asc().nullsLast().op("enum_ops"), table.unitId.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.unitId],
			foreignColumns: [units.id],
			name: "chat_rooms_unit_id_units_id_fk"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "chat_rooms_tenant_id_tenants_id_fk"
		}),
]);

export const polls = pgTable("polls", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	description: text(),
	type: pollType().default('single').notNull(),
	status: pollStatus().default('draft').notNull(),
	createdById: text("created_by_id").notNull(),
	tenantId: uuid("tenant_id").notNull(),
	deadline: timestamp({ mode: 'string' }),
	publishedAt: timestamp("published_at", { mode: 'string' }),
	closedAt: timestamp("closed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("poll_created_by_idx").using("btree", table.createdById.asc().nullsLast().op("text_ops")),
	index("poll_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("poll_tenant_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.createdById],
			foreignColumns: [user.id],
			name: "polls_created_by_id_user_id_fk"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "polls_tenant_id_tenants_id_fk"
		}),
]);

export const pollOptions = pgTable("poll_options", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	pollId: uuid("poll_id").notNull(),
	text: text().notNull(),
	sortOrder: integer("sort_order").default(0).notNull(),
	tenantId: uuid("tenant_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("poll_option_poll_idx").using("btree", table.pollId.asc().nullsLast().op("uuid_ops")),
	index("poll_option_tenant_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.pollId],
			foreignColumns: [polls.id],
			name: "poll_options_poll_id_polls_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "poll_options_tenant_id_tenants_id_fk"
		}),
]);

export const pollVotes = pgTable("poll_votes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	pollId: uuid("poll_id").notNull(),
	optionId: uuid("option_id").notNull(),
	unitId: uuid("unit_id").notNull(),
	votedById: text("voted_by_id").notNull(),
	tenantId: uuid("tenant_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("poll_vote_poll_idx").using("btree", table.pollId.asc().nullsLast().op("uuid_ops")),
	index("poll_vote_tenant_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("poll_vote_unit_poll_idx").using("btree", table.pollId.asc().nullsLast().op("uuid_ops"), table.unitId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.pollId],
			foreignColumns: [polls.id],
			name: "poll_votes_poll_id_polls_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.optionId],
			foreignColumns: [pollOptions.id],
			name: "poll_votes_option_id_poll_options_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.unitId],
			foreignColumns: [units.id],
			name: "poll_votes_unit_id_units_id_fk"
		}),
	foreignKey({
			columns: [table.votedById],
			foreignColumns: [user.id],
			name: "poll_votes_voted_by_id_user_id_fk"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "poll_votes_tenant_id_tenants_id_fk"
		}),
]);

export const pushPreferences = pgTable("push_preferences", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	tenantId: uuid("tenant_id").notNull(),
	acceso: boolean().default(true).notNull(),
	anuncio: boolean().default(true).notNull(),
	incidencia: boolean().default(true).notNull(),
	votacion: boolean().default(true).notNull(),
	panico: boolean().default(true).notNull(),
	finanzas: boolean().default(true).notNull(),
	chat: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("push_pref_user_tenant_idx").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.tenantId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "push_preferences_user_id_user_id_fk"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "push_preferences_tenant_id_tenants_id_fk"
		}),
]);

export const providers = pgTable("providers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	phone: text(),
	photo: text(),
	schedule: text(),
	address: text(),
	services: text().array(),
	costs: text(),
	notes: text(),
	category: providerCategory().notNull(),
	status: providerStatus().default('active').notNull(),
	createdById: text("created_by_id").notNull(),
	tenantId: uuid("tenant_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("provider_category_idx").using("btree", table.category.asc().nullsLast().op("enum_ops")),
	index("provider_created_by_idx").using("btree", table.createdById.asc().nullsLast().op("text_ops")),
	index("provider_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("provider_tenant_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.createdById],
			foreignColumns: [user.id],
			name: "providers_created_by_id_user_id_fk"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "providers_tenant_id_tenants_id_fk"
		}),
]);

export const providerReviews = pgTable("provider_reviews", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	providerId: uuid("provider_id").notNull(),
	rating: integer().notNull(),
	comment: text(),
	reviewerId: text("reviewer_id").notNull(),
	tenantId: uuid("tenant_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("provider_review_provider_idx").using("btree", table.providerId.asc().nullsLast().op("uuid_ops")),
	index("provider_review_reviewer_idx").using("btree", table.reviewerId.asc().nullsLast().op("text_ops")),
	index("provider_review_tenant_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.providerId],
			foreignColumns: [providers.id],
			name: "provider_reviews_provider_id_providers_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.reviewerId],
			foreignColumns: [user.id],
			name: "provider_reviews_reviewer_id_user_id_fk"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "provider_reviews_tenant_id_tenants_id_fk"
		}),
]);

export const meetings = pgTable("meetings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	description: text(),
	date: timestamp({ mode: 'string' }).notNull(),
	endDate: timestamp("end_date", { mode: 'string' }),
	location: text(),
	meetingLink: text("meeting_link"),
	type: meetingType().notNull(),
	status: meetingStatus().default('programada').notNull(),
	agenda: text(),
	minutes: text(),
	createdById: text("created_by_id").notNull(),
	tenantId: uuid("tenant_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("meeting_created_by_idx").using("btree", table.createdById.asc().nullsLast().op("text_ops")),
	index("meeting_date_idx").using("btree", table.date.asc().nullsLast().op("timestamp_ops")),
	index("meeting_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("meeting_tenant_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	index("meeting_type_idx").using("btree", table.type.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.createdById],
			foreignColumns: [user.id],
			name: "meetings_created_by_id_user_id_fk"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "meetings_tenant_id_tenants_id_fk"
		}),
]);

export const frequentVisitors = pgTable("frequent_visitors", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	ownerId: text("owner_id").notNull(),
	unitId: uuid("unit_id").notNull(),
	visitorName: text("visitor_name").notNull(),
	visitorDocument: text("visitor_document"),
	visitorType: visitorType("visitor_type").default('invitado').notNull(),
	vehiclePlate: text("vehicle_plate"),
	lastVisitAt: timestamp("last_visit_at", { mode: 'string' }),
	visitCount: integer("visit_count").default(0).notNull(),
	tenantId: uuid("tenant_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("freq_visitor_owner_idx").using("btree", table.ownerId.asc().nullsLast().op("text_ops")),
	index("freq_visitor_tenant_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	index("freq_visitor_unit_idx").using("btree", table.unitId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [user.id],
			name: "frequent_visitors_owner_id_user_id_fk"
		}),
	foreignKey({
			columns: [table.unitId],
			foreignColumns: [units.id],
			name: "frequent_visitors_unit_id_units_id_fk"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "frequent_visitors_tenant_id_tenants_id_fk"
		}),
]);

export const residentPasses = pgTable("resident_passes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	unitId: uuid("unit_id").notNull(),
	token: text().notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	tenantId: uuid("tenant_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("resident_pass_tenant_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	index("resident_pass_tenant_user_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops"), table.userId.asc().nullsLast().op("uuid_ops")),
	index("resident_pass_token_idx").using("btree", table.token.asc().nullsLast().op("text_ops")),
	index("resident_pass_user_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "resident_passes_user_id_user_id_fk"
		}),
	foreignKey({
			columns: [table.unitId],
			foreignColumns: [units.id],
			name: "resident_passes_unit_id_units_id_fk"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "resident_passes_tenant_id_tenants_id_fk"
		}),
	unique("resident_passes_token_unique").on(table.token),
]);

export const vehiclePasses = pgTable("vehicle_passes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	vehicleId: uuid("vehicle_id").notNull(),
	token: text().notNull(),
	passType: vehiclePassType("pass_type").notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	issuedBy: text("issued_by").notNull(),
	occupantLimit: integer("occupant_limit"),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	notes: text(),
	tenantId: uuid("tenant_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	deactivatedAt: timestamp("deactivated_at", { mode: 'string' }),
}, (table) => [
	index("vehicle_pass_tenant_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	index("vehicle_pass_tenant_vehicle_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops"), table.vehicleId.asc().nullsLast().op("uuid_ops")),
	index("vehicle_pass_token_idx").using("btree", table.token.asc().nullsLast().op("text_ops")),
	index("vehicle_pass_vehicle_idx").using("btree", table.vehicleId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.vehicleId],
			foreignColumns: [vehicles.id],
			name: "vehicle_passes_vehicle_id_vehicles_id_fk"
		}),
	foreignKey({
			columns: [table.issuedBy],
			foreignColumns: [user.id],
			name: "vehicle_passes_issued_by_user_id_fk"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "vehicle_passes_tenant_id_tenants_id_fk"
		}),
	unique("vehicle_passes_token_unique").on(table.token),
]);

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	image: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	role: text().default('propietario'),
	banned: boolean().default(false),
	banReason: text("ban_reason"),
	banExpires: timestamp("ban_expires", { mode: 'string' }),
	tenantId: uuid("tenant_id").notNull(),
	unitId: uuid("unit_id"),
	phone: text(),
}, (table) => [
	index("user_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("user_tenant_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	index("user_unit_idx").using("btree", table.unitId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "user_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.unitId],
			foreignColumns: [units.id],
			name: "user_unit_id_units_id_fk"
		}),
	unique("user_email_unique").on(table.email),
]);

export const serviceStaffRoles = pgTable("service_staff_roles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("service_staff_roles_name_tenant_idx").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.name.asc().nullsLast().op("text_ops")),
	index("service_staff_roles_tenant_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "service_staff_roles_tenant_id_fkey"
		}),
]);

export const unitServiceStaff = pgTable("unit_service_staff", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	unitId: uuid("unit_id").notNull(),
	name: text().notNull(),
	idDocument: text("id_document"),
	phone: text(),
	isActive: boolean("is_active").default(true).notNull(),
	tenantId: uuid("tenant_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	roleId: uuid("role_id").notNull(),
}, (table) => [
	index("unit_service_staff_tenant_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	index("unit_service_staff_unit_idx").using("btree", table.unitId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.unitId],
			foreignColumns: [units.id],
			name: "unit_service_staff_unit_id_fkey"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "unit_service_staff_tenant_id_fkey"
		}),
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [serviceStaffRoles.id],
			name: "unit_service_staff_role_id_service_staff_roles_id_fk"
		}),
]);

export const serviceStaffPasses = pgTable("service_staff_passes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	staffId: uuid("staff_id").notNull(),
	unitId: uuid("unit_id").notNull(),
	token: text().notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	tenantId: uuid("tenant_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("service_staff_pass_staff_idx").using("btree", table.staffId.asc().nullsLast().op("uuid_ops")),
	index("service_staff_pass_tenant_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	index("service_staff_pass_token_idx").using("btree", table.token.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.staffId],
			foreignColumns: [unitServiceStaff.id],
			name: "service_staff_passes_staff_id_fkey"
		}),
	foreignKey({
			columns: [table.unitId],
			foreignColumns: [units.id],
			name: "service_staff_passes_unit_id_fkey"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "service_staff_passes_tenant_id_fkey"
		}),
	unique("service_staff_passes_token_key").on(table.token),
]);

export const panicEvents = pgTable("panic_events", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	unitId: uuid("unit_id"),
	tenantId: uuid("tenant_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	resolvedAt: timestamp("resolved_at", { mode: 'string' }),
	resolvedBy: text("resolved_by"),
	resolvedNote: text("resolved_note"),
}, (table) => [
	index("panic_created_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("panic_tenant_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	index("panic_user_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "panic_events_user_id_user_id_fk"
		}),
	foreignKey({
			columns: [table.unitId],
			foreignColumns: [units.id],
			name: "panic_events_unit_id_units_id_fk"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "panic_events_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.resolvedBy],
			foreignColumns: [user.id],
			name: "panic_events_resolved_by_fkey"
		}),
]);

export const regulations = pgTable("regulations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	category: regulationCategory().notNull(),
	attachmentPath: text("attachment_path").notNull(),
	authorId: text("author_id").notNull(),
	tenantId: uuid("tenant_id").notNull(),
	publishedAt: timestamp("published_at", { mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("regulation_category_idx").using("btree", table.category.asc().nullsLast().op("enum_ops")),
	index("regulation_published_at_idx").using("btree", table.publishedAt.asc().nullsLast().op("timestamp_ops")),
	index("regulation_tenant_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [user.id],
			name: "regulations_author_id_user_id_fk"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "regulations_tenant_id_tenants_id_fk"
		}),
]);

export const chatAttachments = pgTable("chat_attachments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	messageId: uuid("message_id").notNull(),
	filePath: text("file_path").notNull(),
	width: integer(),
	height: integer(),
	fileSize: integer("file_size").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("chat_attachment_message_idx").using("btree", table.messageId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.messageId],
			foreignColumns: [messages.id],
			name: "chat_attachments_message_id_messages_id_fk"
		}).onDelete("cascade"),
]);

export const chatReadStatus = pgTable("chat_read_status", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	roomId: uuid("room_id").notNull(),
	userId: text("user_id").notNull(),
	lastReadAt: timestamp("last_read_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("chat_read_status_room_user_idx").using("btree", table.roomId.asc().nullsLast().op("text_ops"), table.userId.asc().nullsLast().op("text_ops")),
	index("chat_read_status_user_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.roomId],
			foreignColumns: [chatRooms.id],
			name: "chat_read_status_room_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "chat_read_status_user_id_fkey"
		}).onDelete("cascade"),
]);

export const staff = pgTable("staff", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	role: staffRole().notNull(),
	idDocument: text("id_document"),
	phone: text(),
	email: text(),
	shift: text(),
	isActive: boolean("is_active").default(true).notNull(),
	userId: text("user_id"),
	tenantId: uuid("tenant_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	avatar: text(),
	qrToken: text("qr_token"),
}, (table) => [
	index("staff_qr_token_idx").using("btree", table.qrToken.asc().nullsLast().op("text_ops")),
	index("staff_role_idx").using("btree", table.role.asc().nullsLast().op("enum_ops")),
	index("staff_tenant_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "staff_user_id_user_id_fk"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "staff_tenant_id_tenants_id_fk"
		}),
	unique("staff_qr_token_unique").on(table.qrToken),
]);

export const householdMemberPasses = pgTable("household_member_passes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	memberId: uuid("member_id").notNull(),
	unitId: uuid("unit_id").notNull(),
	token: text().notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	tenantId: uuid("tenant_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("household_member_pass_member_idx").using("btree", table.memberId.asc().nullsLast().op("uuid_ops")),
	index("household_member_pass_tenant_idx").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	index("household_member_pass_token_idx").using("btree", table.token.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.memberId],
			foreignColumns: [householdMembers.id],
			name: "household_member_passes_member_id_fkey"
		}),
	foreignKey({
			columns: [table.unitId],
			foreignColumns: [units.id],
			name: "household_member_passes_unit_id_fkey"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "household_member_passes_tenant_id_fkey"
		}),
	unique("household_member_passes_token_key").on(table.token),
]);

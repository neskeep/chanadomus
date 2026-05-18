import { relations } from "drizzle-orm/relations";
import { user, account, session, incidents, units, tenants, incidentUpdates, incidentPhotos, financialRecords, qrCodes, accessLogs, devices, vehiclePasses, serviceStaffPasses, householdMembers, vehicles, chatRooms, messages, announcements, pushSubscriptions, financialReports, polls, pollOptions, pollVotes, pushPreferences, providers, providerReviews, meetings, frequentVisitors, residentPasses, serviceStaffRoles, unitServiceStaff, panicEvents, regulations, chatAttachments, chatReadStatus, staff, householdMemberPasses } from "./schema";

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({one, many}) => ({
	accounts: many(account),
	sessions: many(session),
	incidents: many(incidents),
	incidentUpdates: many(incidentUpdates),
	financialRecords: many(financialRecords),
	qrCodes: many(qrCodes),
	accessLogs: many(accessLogs),
	messages: many(messages),
	announcements: many(announcements),
	pushSubscriptions: many(pushSubscriptions),
	financialReports: many(financialReports),
	polls: many(polls),
	pollVotes: many(pollVotes),
	pushPreferences: many(pushPreferences),
	providers: many(providers),
	providerReviews: many(providerReviews),
	meetings: many(meetings),
	frequentVisitors: many(frequentVisitors),
	residentPasses: many(residentPasses),
	vehiclePasses: many(vehiclePasses),
	tenant: one(tenants, {
		fields: [user.tenantId],
		references: [tenants.id]
	}),
	unit: one(units, {
		fields: [user.unitId],
		references: [units.id]
	}),
	panicEvents_userId: many(panicEvents, {
		relationName: "panicEvents_userId_user_id"
	}),
	panicEvents_resolvedBy: many(panicEvents, {
		relationName: "panicEvents_resolvedBy_user_id"
	}),
	regulations: many(regulations),
	chatReadStatuses: many(chatReadStatus),
	staff: many(staff),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const incidentsRelations = relations(incidents, ({one, many}) => ({
	user: one(user, {
		fields: [incidents.reportedById],
		references: [user.id]
	}),
	unit: one(units, {
		fields: [incidents.unitId],
		references: [units.id]
	}),
	tenant: one(tenants, {
		fields: [incidents.tenantId],
		references: [tenants.id]
	}),
	incidentUpdates: many(incidentUpdates),
	incidentPhotos: many(incidentPhotos),
}));

export const unitsRelations = relations(units, ({one, many}) => ({
	incidents: many(incidents),
	financialRecords: many(financialRecords),
	qrCodes: many(qrCodes),
	tenant: one(tenants, {
		fields: [units.tenantId],
		references: [tenants.id]
	}),
	accessLogs: many(accessLogs),
	householdMembers: many(householdMembers),
	vehicles: many(vehicles),
	chatRooms: many(chatRooms),
	pollVotes: many(pollVotes),
	frequentVisitors: many(frequentVisitors),
	residentPasses: many(residentPasses),
	users: many(user),
	unitServiceStaffs: many(unitServiceStaff),
	serviceStaffPasses: many(serviceStaffPasses),
	panicEvents: many(panicEvents),
	householdMemberPasses: many(householdMemberPasses),
}));

export const tenantsRelations = relations(tenants, ({many}) => ({
	incidents: many(incidents),
	financialRecords: many(financialRecords),
	qrCodes: many(qrCodes),
	units: many(units),
	accessLogs: many(accessLogs),
	householdMembers: many(householdMembers),
	devices: many(devices),
	vehicles: many(vehicles),
	announcements: many(announcements),
	pushSubscriptions: many(pushSubscriptions),
	financialReports: many(financialReports),
	chatRooms: many(chatRooms),
	polls: many(polls),
	pollOptions: many(pollOptions),
	pollVotes: many(pollVotes),
	pushPreferences: many(pushPreferences),
	providers: many(providers),
	providerReviews: many(providerReviews),
	meetings: many(meetings),
	frequentVisitors: many(frequentVisitors),
	residentPasses: many(residentPasses),
	vehiclePasses: many(vehiclePasses),
	users: many(user),
	serviceStaffRoles: many(serviceStaffRoles),
	unitServiceStaffs: many(unitServiceStaff),
	serviceStaffPasses: many(serviceStaffPasses),
	panicEvents: many(panicEvents),
	regulations: many(regulations),
	staff: many(staff),
	householdMemberPasses: many(householdMemberPasses),
}));

export const incidentUpdatesRelations = relations(incidentUpdates, ({one}) => ({
	incident: one(incidents, {
		fields: [incidentUpdates.incidentId],
		references: [incidents.id]
	}),
	user: one(user, {
		fields: [incidentUpdates.updatedById],
		references: [user.id]
	}),
}));

export const incidentPhotosRelations = relations(incidentPhotos, ({one}) => ({
	incident: one(incidents, {
		fields: [incidentPhotos.incidentId],
		references: [incidents.id]
	}),
}));

export const financialRecordsRelations = relations(financialRecords, ({one}) => ({
	unit: one(units, {
		fields: [financialRecords.unitId],
		references: [units.id]
	}),
	user: one(user, {
		fields: [financialRecords.createdById],
		references: [user.id]
	}),
	tenant: one(tenants, {
		fields: [financialRecords.tenantId],
		references: [tenants.id]
	}),
}));

export const qrCodesRelations = relations(qrCodes, ({one, many}) => ({
	user: one(user, {
		fields: [qrCodes.ownerId],
		references: [user.id]
	}),
	unit: one(units, {
		fields: [qrCodes.unitId],
		references: [units.id]
	}),
	tenant: one(tenants, {
		fields: [qrCodes.tenantId],
		references: [tenants.id]
	}),
	accessLogs: many(accessLogs),
}));

export const accessLogsRelations = relations(accessLogs, ({one}) => ({
	qrCode: one(qrCodes, {
		fields: [accessLogs.qrCodeId],
		references: [qrCodes.id]
	}),
	user: one(user, {
		fields: [accessLogs.authorizedBy],
		references: [user.id]
	}),
	tenant: one(tenants, {
		fields: [accessLogs.tenantId],
		references: [tenants.id]
	}),
	unit: one(units, {
		fields: [accessLogs.unitId],
		references: [units.id]
	}),
	device: one(devices, {
		fields: [accessLogs.deviceId],
		references: [devices.id]
	}),
	vehiclePass: one(vehiclePasses, {
		fields: [accessLogs.vehiclePassId],
		references: [vehiclePasses.id]
	}),
	serviceStaffPass: one(serviceStaffPasses, {
		fields: [accessLogs.staffPassId],
		references: [serviceStaffPasses.id]
	}),
}));

export const devicesRelations = relations(devices, ({one, many}) => ({
	accessLogs: many(accessLogs),
	tenant: one(tenants, {
		fields: [devices.tenantId],
		references: [tenants.id]
	}),
}));

export const vehiclePassesRelations = relations(vehiclePasses, ({one, many}) => ({
	accessLogs: many(accessLogs),
	vehicle: one(vehicles, {
		fields: [vehiclePasses.vehicleId],
		references: [vehicles.id]
	}),
	user: one(user, {
		fields: [vehiclePasses.issuedBy],
		references: [user.id]
	}),
	tenant: one(tenants, {
		fields: [vehiclePasses.tenantId],
		references: [tenants.id]
	}),
}));

export const serviceStaffPassesRelations = relations(serviceStaffPasses, ({one, many}) => ({
	accessLogs: many(accessLogs),
	unitServiceStaff: one(unitServiceStaff, {
		fields: [serviceStaffPasses.staffId],
		references: [unitServiceStaff.id]
	}),
	unit: one(units, {
		fields: [serviceStaffPasses.unitId],
		references: [units.id]
	}),
	tenant: one(tenants, {
		fields: [serviceStaffPasses.tenantId],
		references: [tenants.id]
	}),
}));

export const householdMembersRelations = relations(householdMembers, ({one, many}) => ({
	unit: one(units, {
		fields: [householdMembers.unitId],
		references: [units.id]
	}),
	tenant: one(tenants, {
		fields: [householdMembers.tenantId],
		references: [tenants.id]
	}),
	vehicles: many(vehicles),
	householdMemberPasses: many(householdMemberPasses),
}));

export const vehiclesRelations = relations(vehicles, ({one, many}) => ({
	unit: one(units, {
		fields: [vehicles.unitId],
		references: [units.id]
	}),
	householdMember: one(householdMembers, {
		fields: [vehicles.ownerMemberId],
		references: [householdMembers.id]
	}),
	tenant: one(tenants, {
		fields: [vehicles.tenantId],
		references: [tenants.id]
	}),
	vehiclePasses: many(vehiclePasses),
}));

export const messagesRelations = relations(messages, ({one, many}) => ({
	chatRoom: one(chatRooms, {
		fields: [messages.roomId],
		references: [chatRooms.id]
	}),
	user: one(user, {
		fields: [messages.userId],
		references: [user.id]
	}),
	chatAttachments: many(chatAttachments),
}));

export const chatRoomsRelations = relations(chatRooms, ({one, many}) => ({
	messages: many(messages),
	unit: one(units, {
		fields: [chatRooms.unitId],
		references: [units.id]
	}),
	tenant: one(tenants, {
		fields: [chatRooms.tenantId],
		references: [tenants.id]
	}),
	chatReadStatuses: many(chatReadStatus),
}));

export const announcementsRelations = relations(announcements, ({one}) => ({
	user: one(user, {
		fields: [announcements.authorId],
		references: [user.id]
	}),
	tenant: one(tenants, {
		fields: [announcements.tenantId],
		references: [tenants.id]
	}),
}));

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({one}) => ({
	user: one(user, {
		fields: [pushSubscriptions.userId],
		references: [user.id]
	}),
	tenant: one(tenants, {
		fields: [pushSubscriptions.tenantId],
		references: [tenants.id]
	}),
}));

export const financialReportsRelations = relations(financialReports, ({one}) => ({
	user: one(user, {
		fields: [financialReports.uploadedById],
		references: [user.id]
	}),
	tenant: one(tenants, {
		fields: [financialReports.tenantId],
		references: [tenants.id]
	}),
}));

export const pollsRelations = relations(polls, ({one, many}) => ({
	user: one(user, {
		fields: [polls.createdById],
		references: [user.id]
	}),
	tenant: one(tenants, {
		fields: [polls.tenantId],
		references: [tenants.id]
	}),
	pollOptions: many(pollOptions),
	pollVotes: many(pollVotes),
}));

export const pollOptionsRelations = relations(pollOptions, ({one, many}) => ({
	poll: one(polls, {
		fields: [pollOptions.pollId],
		references: [polls.id]
	}),
	tenant: one(tenants, {
		fields: [pollOptions.tenantId],
		references: [tenants.id]
	}),
	pollVotes: many(pollVotes),
}));

export const pollVotesRelations = relations(pollVotes, ({one}) => ({
	poll: one(polls, {
		fields: [pollVotes.pollId],
		references: [polls.id]
	}),
	pollOption: one(pollOptions, {
		fields: [pollVotes.optionId],
		references: [pollOptions.id]
	}),
	unit: one(units, {
		fields: [pollVotes.unitId],
		references: [units.id]
	}),
	user: one(user, {
		fields: [pollVotes.votedById],
		references: [user.id]
	}),
	tenant: one(tenants, {
		fields: [pollVotes.tenantId],
		references: [tenants.id]
	}),
}));

export const pushPreferencesRelations = relations(pushPreferences, ({one}) => ({
	user: one(user, {
		fields: [pushPreferences.userId],
		references: [user.id]
	}),
	tenant: one(tenants, {
		fields: [pushPreferences.tenantId],
		references: [tenants.id]
	}),
}));

export const providersRelations = relations(providers, ({one, many}) => ({
	user: one(user, {
		fields: [providers.createdById],
		references: [user.id]
	}),
	tenant: one(tenants, {
		fields: [providers.tenantId],
		references: [tenants.id]
	}),
	providerReviews: many(providerReviews),
}));

export const providerReviewsRelations = relations(providerReviews, ({one}) => ({
	provider: one(providers, {
		fields: [providerReviews.providerId],
		references: [providers.id]
	}),
	user: one(user, {
		fields: [providerReviews.reviewerId],
		references: [user.id]
	}),
	tenant: one(tenants, {
		fields: [providerReviews.tenantId],
		references: [tenants.id]
	}),
}));

export const meetingsRelations = relations(meetings, ({one}) => ({
	user: one(user, {
		fields: [meetings.createdById],
		references: [user.id]
	}),
	tenant: one(tenants, {
		fields: [meetings.tenantId],
		references: [tenants.id]
	}),
}));

export const frequentVisitorsRelations = relations(frequentVisitors, ({one}) => ({
	user: one(user, {
		fields: [frequentVisitors.ownerId],
		references: [user.id]
	}),
	unit: one(units, {
		fields: [frequentVisitors.unitId],
		references: [units.id]
	}),
	tenant: one(tenants, {
		fields: [frequentVisitors.tenantId],
		references: [tenants.id]
	}),
}));

export const residentPassesRelations = relations(residentPasses, ({one}) => ({
	user: one(user, {
		fields: [residentPasses.userId],
		references: [user.id]
	}),
	unit: one(units, {
		fields: [residentPasses.unitId],
		references: [units.id]
	}),
	tenant: one(tenants, {
		fields: [residentPasses.tenantId],
		references: [tenants.id]
	}),
}));

export const serviceStaffRolesRelations = relations(serviceStaffRoles, ({one, many}) => ({
	tenant: one(tenants, {
		fields: [serviceStaffRoles.tenantId],
		references: [tenants.id]
	}),
	unitServiceStaffs: many(unitServiceStaff),
}));

export const unitServiceStaffRelations = relations(unitServiceStaff, ({one, many}) => ({
	unit: one(units, {
		fields: [unitServiceStaff.unitId],
		references: [units.id]
	}),
	tenant: one(tenants, {
		fields: [unitServiceStaff.tenantId],
		references: [tenants.id]
	}),
	serviceStaffRole: one(serviceStaffRoles, {
		fields: [unitServiceStaff.roleId],
		references: [serviceStaffRoles.id]
	}),
	serviceStaffPasses: many(serviceStaffPasses),
}));

export const panicEventsRelations = relations(panicEvents, ({one}) => ({
	user_userId: one(user, {
		fields: [panicEvents.userId],
		references: [user.id],
		relationName: "panicEvents_userId_user_id"
	}),
	unit: one(units, {
		fields: [panicEvents.unitId],
		references: [units.id]
	}),
	tenant: one(tenants, {
		fields: [panicEvents.tenantId],
		references: [tenants.id]
	}),
	user_resolvedBy: one(user, {
		fields: [panicEvents.resolvedBy],
		references: [user.id],
		relationName: "panicEvents_resolvedBy_user_id"
	}),
}));

export const regulationsRelations = relations(regulations, ({one}) => ({
	user: one(user, {
		fields: [regulations.authorId],
		references: [user.id]
	}),
	tenant: one(tenants, {
		fields: [regulations.tenantId],
		references: [tenants.id]
	}),
}));

export const chatAttachmentsRelations = relations(chatAttachments, ({one}) => ({
	message: one(messages, {
		fields: [chatAttachments.messageId],
		references: [messages.id]
	}),
}));

export const chatReadStatusRelations = relations(chatReadStatus, ({one}) => ({
	chatRoom: one(chatRooms, {
		fields: [chatReadStatus.roomId],
		references: [chatRooms.id]
	}),
	user: one(user, {
		fields: [chatReadStatus.userId],
		references: [user.id]
	}),
}));

export const staffRelations = relations(staff, ({one}) => ({
	user: one(user, {
		fields: [staff.userId],
		references: [user.id]
	}),
	tenant: one(tenants, {
		fields: [staff.tenantId],
		references: [tenants.id]
	}),
}));

export const householdMemberPassesRelations = relations(householdMemberPasses, ({one}) => ({
	householdMember: one(householdMembers, {
		fields: [householdMemberPasses.memberId],
		references: [householdMembers.id]
	}),
	unit: one(units, {
		fields: [householdMemberPasses.unitId],
		references: [units.id]
	}),
	tenant: one(tenants, {
		fields: [householdMemberPasses.tenantId],
		references: [tenants.id]
	}),
}));
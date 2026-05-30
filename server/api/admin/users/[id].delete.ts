import { db } from '~~/server/db'
import { user, session, account } from '~~/server/db/schema/auth'
import { staff } from '~~/server/db/schema/staff'
import { pushSubscriptions } from '~~/server/db/schema/push'
import { pushPreferences } from '~~/server/db/schema/push-preferences'
import { chatRoomMembers, chatReadStatus, messages, chatAttachments } from '~~/server/db/schema/chat'
import { frequentVisitors } from '~~/server/db/schema/frequent-visitor'
import { incidents, incidentUpdates } from '~~/server/db/schema/incident'
import { financialRecords } from '~~/server/db/schema/financial'
import { financialReports } from '~~/server/db/schema/financial-report'
import { qrCodes, accessLogs } from '~~/server/db/schema/access'
import { providers, providerReviews } from '~~/server/db/schema/provider'
import { regulations } from '~~/server/db/schema/regulation'
import { vehiclePasses } from '~~/server/db/schema/vehicle-pass'
import { residentPasses } from '~~/server/db/schema/resident-pass'
import { invitations } from '~~/server/db/schema/invitation'
import { meetings } from '~~/server/db/schema/meeting'
import { announcements } from '~~/server/db/schema/announcement'
import { polls, pollVotes } from '~~/server/db/schema/poll'
import { panicEvents } from '~~/server/db/schema/panic'
import { eq, and, inArray } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const authSession = await requireRole(event, ['admin'])
  const { tenantId } = await requireTenant(event)
  const id = getRouterParam(event, 'id')

  if (!id) throw createError({ statusCode: 400, message: 'ID requerido' })

  if (id === authSession.user.id) {
    throw createError({ statusCode: 400, message: 'No puedes eliminarte a ti mismo' })
  }

  const [target] = await db
    .select({ id: user.id, name: user.name, tenantId: user.tenantId })
    .from(user)
    .where(and(eq(user.id, id), eq(user.tenantId, tenantId)))

  if (!target) throw createError({ statusCode: 404, message: 'Usuario no encontrado' })

  await db.transaction(async (tx) => {
    // 1. Auth (no cascade)
    await tx.delete(session).where(eq(session.userId, id))
    await tx.delete(account).where(eq(account.userId, id))

    // 2. Chat: attachments -> messages, readStatus, members
    const userMsgRows = await tx
      .select({ id: messages.id })
      .from(messages)
      .where(eq(messages.userId, id))
    if (userMsgRows.length > 0) {
      // chatAttachments has cascade on messageId, but delete explicitly for safety
      await tx.delete(chatAttachments).where(
        inArray(chatAttachments.messageId, userMsgRows.map(m => m.id)),
      )
    }
    await tx.delete(messages).where(eq(messages.userId, id))
    await tx.delete(chatReadStatus).where(eq(chatReadStatus.userId, id))
    await tx.delete(chatRoomMembers).where(eq(chatRoomMembers.userId, id))

    // 3. Push
    await tx.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, id))
    await tx.delete(pushPreferences).where(eq(pushPreferences.userId, id))

    // 4. Frequent visitors
    await tx.delete(frequentVisitors).where(eq(frequentVisitors.ownerId, id))

    // 5. Resident pass
    await tx.delete(residentPasses).where(eq(residentPasses.userId, id))

    // 6. Access: nullify accessLogs.authorizedBy, nullify accessLogs.qrCodeId for user's QR codes, then delete QR codes
    await tx.update(accessLogs).set({ authorizedBy: null }).where(eq(accessLogs.authorizedBy, id))
    const userQrCodes = await tx
      .select({ id: qrCodes.id })
      .from(qrCodes)
      .where(eq(qrCodes.ownerId, id))
    if (userQrCodes.length > 0) {
      await tx.update(accessLogs).set({ qrCodeId: null }).where(
        inArray(accessLogs.qrCodeId, userQrCodes.map(q => q.id)),
      )
    }
    await tx.delete(qrCodes).where(eq(qrCodes.ownerId, id))

    // 7. Vehicle passes: nullify accessLogs.vehiclePassId first
    const userVehiclePasses = await tx
      .select({ id: vehiclePasses.id })
      .from(vehiclePasses)
      .where(eq(vehiclePasses.issuedBy, id))
    if (userVehiclePasses.length > 0) {
      await tx.update(accessLogs).set({ vehiclePassId: null }).where(
        inArray(accessLogs.vehiclePassId, userVehiclePasses.map(v => v.id)),
      )
    }
    await tx.delete(vehiclePasses).where(eq(vehiclePasses.issuedBy, id))

    // 8. Incidents: delete updates by this user on OTHER incidents, then delete user's incidents (cascade handles their updates/photos)
    await tx.delete(incidentUpdates).where(eq(incidentUpdates.updatedById, id))
    await tx.delete(incidents).where(eq(incidents.reportedById, id))

    // 9. Financial
    await tx.delete(financialRecords).where(eq(financialRecords.createdById, id))
    await tx.delete(financialReports).where(eq(financialReports.uploadedById, id))

    // 10. Providers: delete user's reviews first, then user's providers (their reviews cascade)
    await tx.delete(providerReviews).where(eq(providerReviews.reviewerId, id))
    await tx.delete(providers).where(eq(providers.createdById, id))

    // 11. Regulations, announcements, meetings, invitations
    await tx.delete(regulations).where(eq(regulations.authorId, id))
    await tx.delete(announcements).where(eq(announcements.authorId, id))
    await tx.delete(meetings).where(eq(meetings.createdById, id))
    await tx.delete(invitations).where(eq(invitations.createdById, id))

    // 12. Polls (pollVotes + pollOptions cascade from polls)
    await tx.delete(pollVotes).where(eq(pollVotes.votedById, id))
    await tx.delete(polls).where(eq(polls.createdById, id))

    // 13. Panic: delete user's events, nullify resolvedBy on others
    await tx.delete(panicEvents).where(eq(panicEvents.userId, id))
    await tx.update(panicEvents).set({ resolvedBy: null }).where(eq(panicEvents.resolvedBy, id))

    // 14. Staff: unlink (nullable FK)
    await tx.update(staff).set({ userId: null }).where(eq(staff.userId, id))

    // 15. Delete user
    await tx.delete(user).where(eq(user.id, id))
  })

  return { data: { id, deleted: true } }
})

import { eq, and, isNull, desc } from 'drizzle-orm'
import { db } from '~~/server/db'
import { accessLogs } from '~~/server/db/schema/access'
import { broadcastAccessMessage } from '~~/server/utils/ws-access'

const OPEN_ENTRY_WINDOW_MS = 24 * 60 * 60 * 1000 // 24 hours

export interface OpenEntryResult {
  /** 'exit' = found open entry within window → marked exit. 'expired' = found but >24h → flagged. null = no open entry. */
  action: 'exit' | 'expired' | null
  /** The access log that was closed (exit) or flagged (expired) */
  logId?: string
  exitAt?: string
  entryAt?: string
}

/**
 * Check if there's an open access log for this token and handle accordingly:
 * - Within 24h window → mark exit, broadcast, return 'exit'
 * - Beyond 24h → mark expired_open, return 'expired' (new entry will be created)
 * - No open entry → return null (new entry will be created)
 */
export async function checkOpenEntry(passToken: string, tenantId: string): Promise<OpenEntryResult> {
  const [openLog] = await db
    .select({
      id: accessLogs.id,
      createdAt: accessLogs.createdAt,
    })
    .from(accessLogs)
    .where(
      and(
        eq(accessLogs.passToken, passToken),
        eq(accessLogs.tenantId, tenantId),
        eq(accessLogs.result, 'allowed'),
        isNull(accessLogs.exitAt),
        eq(accessLogs.expiredOpen, false),
      ),
    )
    .orderBy(desc(accessLogs.createdAt))
    .limit(1)

  if (!openLog) {
    return { action: null }
  }

  const now = new Date()
  const elapsed = now.getTime() - openLog.createdAt.getTime()

  if (elapsed > OPEN_ENTRY_WINDOW_MS) {
    // Beyond 24h — flag as expired_open for investigation, don't close
    await db
      .update(accessLogs)
      .set({ expiredOpen: true })
      .where(eq(accessLogs.id, openLog.id))

    return { action: 'expired', logId: openLog.id, entryAt: openLog.createdAt.toISOString() }
  }

  // Within window — mark exit
  const exitAt = now

  await db
    .update(accessLogs)
    .set({ exitAt })
    .where(
      and(
        eq(accessLogs.id, openLog.id),
        isNull(accessLogs.exitAt),
      ),
    )

  // Broadcast exit event via WebSocket
  broadcastAccessMessage('access-exit', { id: openLog.id, exitAt: exitAt.toISOString() })

  return {
    action: 'exit',
    logId: openLog.id,
    exitAt: exitAt.toISOString(),
    entryAt: openLog.createdAt.toISOString(),
  }
}

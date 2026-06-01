import { eq, and, gte, lt, desc, sql, ilike, or, count } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '~~/server/db'
import { accessLogs, qrCodes } from '~~/server/db/schema/access'
import { units } from '~~/server/db/schema/unit'
import type { AccessEvent } from '~~/shared/types/access'

const dateRegex = /^\d{4}-\d{2}-\d{2}$/

const querySchema = z.object({
  from: z.string().regex(dateRegex, 'Invalid date format, expected YYYY-MM-DD'),
  to: z.string().regex(dateRegex, 'Invalid date format, expected YYYY-MM-DD'),
  result: z.enum(['allowed', 'denied', 'expired', 'already_used']).optional(),
  entryType: z.enum(['qr', 'manual', 'webhook']).optional(),
  search: z.string().optional(),
  unitId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin', 'vigilancia'])
  const { tenantId } = await requireTenant(event)

  const rawQuery = getQuery(event)
  const parsed = querySchema.safeParse(rawQuery)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid query parameters',
      data: parsed.error.issues,
    })
  }

  const { from, to, result, entryType, search, unitId, page, limit } = parsed.data

  // Validate from <= to
  if (from > to) {
    throw createError({
      statusCode: 400,
      message: '"from" must be before or equal to "to"',
    })
  }

  // Validate max range of 90 days
  const fromDate = new Date(`${from}T00:00:00.000Z`)
  const toDate = new Date(`${to}T00:00:00.000Z`)
  const diffMs = toDate.getTime() - fromDate.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  if (diffDays > 90) {
    throw createError({
      statusCode: 400,
      message: 'Date range must not exceed 90 days',
    })
  }

  // toDate + 1 day for inclusive end
  const toDatePlusOne = new Date(toDate)
  toDatePlusOne.setUTCDate(toDatePlusOne.getUTCDate() + 1)

  // Build conditions
  const conditions = [
    eq(accessLogs.tenantId, tenantId),
    gte(accessLogs.createdAt, fromDate),
    lt(accessLogs.createdAt, toDatePlusOne),
  ]

  if (result) {
    conditions.push(eq(accessLogs.result, result))
  }

  if (entryType) {
    conditions.push(eq(accessLogs.entryType, entryType))
  }

  // Determine if we need JOINs for filtering
  const needsQrJoin = !!search || !!unitId
  const searchPattern = search ? `%${search}%` : null

  if (searchPattern) {
    conditions.push(
      or(
        ilike(accessLogs.visitorName, searchPattern),
        ilike(accessLogs.visitorDocument, searchPattern),
        ilike(qrCodes.visitorName, searchPattern),
      )!,
    )
  }

  if (unitId) {
    conditions.push(
      or(
        eq(accessLogs.unitId, unitId),
        eq(qrCodes.unitId, unitId),
      )!,
    )
  }

  const whereClause = and(...conditions)

  // Count query — needs JOINs when filtering by search or unitId
  const countQuery = needsQrJoin
    ? db
        .select({ total: count() })
        .from(accessLogs)
        .leftJoin(qrCodes, eq(qrCodes.id, accessLogs.qrCodeId))
        .where(whereClause)
    : db
        .select({ total: count() })
        .from(accessLogs)
        .where(whereClause)

  const [countResult] = await countQuery
  const total = countResult?.total ?? 0
  const totalPages = Math.ceil(total / limit)
  const offset = (page - 1) * limit

  // Data query with LEFT JOINs
  const rows = await db
    .select({
      id: accessLogs.id,
      entryType: accessLogs.entryType,
      result: accessLogs.result,
      logVisitorName: accessLogs.visitorName,
      qrVisitorName: qrCodes.visitorName,
      visitorDocument: accessLogs.visitorDocument,
      unitNumber: units.number,
      unitLabel: units.label,
      notes: accessLogs.notes,
      exitAt: accessLogs.exitAt,
      createdAt: accessLogs.createdAt,
    })
    .from(accessLogs)
    .leftJoin(qrCodes, eq(qrCodes.id, accessLogs.qrCodeId))
    .leftJoin(units, eq(units.id, sql`COALESCE(${accessLogs.unitId}, ${qrCodes.unitId})`))
    .where(whereClause)
    .orderBy(desc(accessLogs.createdAt))
    .limit(limit)
    .offset(offset)

  const data: AccessEvent[] = rows.map((row) => ({
    id: row.id,
    entryType: row.entryType,
    result: row.result,
    visitorName: row.logVisitorName ?? row.qrVisitorName ?? null,
    visitorDocument: row.visitorDocument,
    unitNumber: row.unitNumber,
    unitLabel: row.unitLabel,
    notes: row.notes,
    exitAt: row.exitAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  }))

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  }
})

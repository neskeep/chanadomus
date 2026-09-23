import { db } from '~~/server/db'
import { providers, providerReviews } from '~~/server/db/schema/provider'
import { user } from '~~/server/db/schema/auth'
import { serviceStaffRoles } from '~~/server/db/schema/service-staff-role'
import { eq, and, or, asc, count, avg, inArray, sql } from 'drizzle-orm'
import { buildSearchPattern, searchContains } from '~~/server/utils/search'
import { isProviderCategory, type Provider, type ProviderStatus } from '~~/shared/types/provider'

const VALID_STATUSES: ProviderStatus[] = ['active', 'inactive', 'pending']

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)

  const query = getQuery(event)
  const category = query.category as string | undefined
  const serviceRoleId = query.serviceRoleId as string | undefined
  const status = query.status as string | undefined
  const search = query.search as string | undefined
  const page = Math.max(1, parseInt(query.page as string, 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string, 10) || 20))
  const offset = (page - 1) * limit

  // Validate filters
  if (category && !isProviderCategory(category)) {
    throw createError({ statusCode: 400, message: 'Categoría inválida' })
  }
  if (serviceRoleId && !isUuid(serviceRoleId)) {
    throw createError({ statusCode: 400, message: 'Categoría inválida' })
  }
  if (status && !VALID_STATUSES.includes(status as ProviderStatus)) {
    throw createError({ statusCode: 400, message: 'Estado invalido' })
  }

  // Build conditions
  const conditions = [eq(providers.tenantId, session.tenantId)]

  const userRole = session.user.role ?? ''
  const isPrivileged = userRole === 'admin' || userRole === 'conserje'

  // Non-privileged users only see active providers
  if (!isPrivileged) {
    conditions.push(eq(providers.status, 'active'))
  } else if (status) {
    conditions.push(eq(providers.status, status as ProviderStatus))
  }

  if (serviceRoleId) {
    conditions.push(eq(providers.serviceRoleId, serviceRoleId))
  } else if (category && isProviderCategory(category)) {
    conditions.push(eq(providers.category, category))
  }

  // Search by provider name, category (service role) name, or any listed service.
  // Case- and accent-insensitive ("víveres" == "viveres"); LIKE wildcards escaped.
  const term = search?.trim()
  if (term) {
    const pattern = buildSearchPattern(term)
    const searchCondition = or(
      searchContains(providers.name, pattern),
      searchContains(serviceStaffRoles.name, pattern),
      searchContains(sql`array_to_string(${providers.services}, ' ')`, pattern),
    )
    if (searchCondition) conditions.push(searchCondition)
  }

  const whereClause = and(...conditions)

  // Get total count (same join as the page query, since search can match the role name)
  const [totalRow] = await db
    .select({ total: count() })
    .from(providers)
    .leftJoin(serviceStaffRoles, eq(providers.serviceRoleId, serviceStaffRoles.id))
    .where(whereClause)

  const total = totalRow?.total ?? 0

  // Get paginated results with creator name
  const rows = await db
    .select({
      id: providers.id,
      name: providers.name,
      phone: providers.phone,
      photo: providers.photo,
      schedule: providers.schedule,
      address: providers.address,
      services: providers.services,
      costs: providers.costs,
      notes: providers.notes,
      category: providers.category,
      serviceRoleId: providers.serviceRoleId,
      serviceRoleName: serviceStaffRoles.name,
      status: providers.status,
      createdById: providers.createdById,
      tenantId: providers.tenantId,
      createdAt: providers.createdAt,
      updatedAt: providers.updatedAt,
      createdByName: user.name,
    })
    .from(providers)
    .leftJoin(user, eq(providers.createdById, user.id))
    .leftJoin(serviceStaffRoles, eq(providers.serviceRoleId, serviceStaffRoles.id))
    .where(whereClause)
    .orderBy(asc(serviceStaffRoles.displayOrder), asc(serviceStaffRoles.name), asc(providers.name))
    .limit(limit)
    .offset(offset)

  // Get average ratings and review counts for these providers
  const providerIds = rows.map(r => r.id)
  const ratingsMap = new Map<string, { avg: number; count: number }>()

  if (providerIds.length > 0) {
    const ratingRows = await db
      .select({
        providerId: providerReviews.providerId,
        avgRating: avg(providerReviews.rating),
        reviewCount: count(),
      })
      .from(providerReviews)
      .where(inArray(providerReviews.providerId, providerIds))
      .groupBy(providerReviews.providerId)

    for (const r of ratingRows) {
      ratingsMap.set(r.providerId, {
        avg: r.avgRating ? parseFloat(String(r.avgRating)) : 0,
        count: r.reviewCount,
      })
    }
  }

  const data: Provider[] = rows.map((row) => {
    const rating = ratingsMap.get(row.id)
    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      photo: row.photo,
      schedule: row.schedule,
      address: row.address,
      services: row.services,
      costs: row.costs,
      notes: row.notes,
      category: row.category,
      serviceRoleId: row.serviceRoleId,
      serviceRoleName: row.serviceRoleName ?? undefined,
      status: row.status,
      createdById: row.createdById,
      createdByName: row.createdByName ?? undefined,
      tenantId: row.tenantId,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      averageRating: rating?.avg ?? 0,
      reviewCount: rating?.count ?? 0,
    }
  })

  // Global status counts (unaffected by filters/pagination)
  const statusConditions = [eq(providers.tenantId, session.tenantId)]
  if (!isPrivileged) {
    statusConditions.push(eq(providers.status, 'active'))
  }
  const statusWhere = and(...statusConditions)

  const [activeRow] = await db
    .select({ total: count() })
    .from(providers)
    .where(and(statusWhere, eq(providers.status, 'active')))

  const [pendingRow] = isPrivileged
    ? await db
        .select({ total: count() })
        .from(providers)
        .where(and(eq(providers.tenantId, session.tenantId), eq(providers.status, 'pending')))
    : [{ total: 0 }]

  return {
    data,
    meta: { total, page, limit },
    counts: {
      active: activeRow?.total ?? 0,
      pending: pendingRow?.total ?? 0,
    },
  }
})

import { z } from 'zod'
import { eq, ilike, and, desc } from 'drizzle-orm'
import { db } from '~~/server/db'
import { incidents } from '~~/server/db/schema/incident'
import { announcements } from '~~/server/db/schema/announcement'
import { meetings } from '~~/server/db/schema/meeting'
import { polls } from '~~/server/db/schema/poll'
import { providers } from '~~/server/db/schema/provider'
import { regulations } from '~~/server/db/schema/regulation'

const SEARCH_TYPES = ['incidencia', 'anuncio', 'reunion', 'votacion', 'proveedor', 'normativa'] as const
type SearchType = (typeof SEARCH_TYPES)[number]

const ROLE_PERMISSIONS: Record<SearchType, string[]> = {
  incidencia: ['admin', 'propietario'],
  anuncio: ['admin'],
  reunion: ['admin', 'propietario', 'conserje'],
  votacion: ['admin', 'propietario'],
  proveedor: ['admin', 'propietario', 'conserje'],
  normativa: ['admin', 'propietario', 'conserje', 'vigilancia'],
}

const querySchema = z.object({
  type: z.enum(SEARCH_TYPES),
  q: z.string().min(1).max(100),
})

interface ChatCommandResult {
  id: string
  label: string
  sublabel?: string
  type: SearchType
}

export default defineEventHandler(async (event): Promise<{ data: ChatCommandResult[] }> => {
  const { tenantId, user } = await requireTenant(event)
  const role = user.role ?? ''

  const query = getQuery(event)
  const parsed = querySchema.safeParse(query)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Parametros invalidos',
      data: parsed.error.issues,
    })
  }

  const { type, q } = parsed.data

  // Validate role permissions
  const allowedRoles = ROLE_PERMISSIONS[type]
  if (!allowedRoles.includes(role)) {
    throw createError({ statusCode: 403, message: 'Sin permisos para buscar este tipo' })
  }

  const searchPattern = `%${q}%`
  const LIMIT = 10

  switch (type) {
    case 'incidencia': {
      const rows = await db
        .select({ id: incidents.id, title: incidents.title, status: incidents.status })
        .from(incidents)
        .where(and(eq(incidents.tenantId, tenantId), ilike(incidents.title, searchPattern)))
        .orderBy(desc(incidents.createdAt))
        .limit(LIMIT)

      return {
        data: rows.map((r) => ({ id: r.id, label: r.title, sublabel: r.status, type })),
      }
    }

    case 'anuncio': {
      const rows = await db
        .select({ id: announcements.id, title: announcements.title, category: announcements.category })
        .from(announcements)
        .where(
          and(
            eq(announcements.tenantId, tenantId),
            eq(announcements.status, 'published'),
            ilike(announcements.title, searchPattern),
          ),
        )
        .orderBy(desc(announcements.createdAt))
        .limit(LIMIT)

      return {
        data: rows.map((r) => ({ id: r.id, label: r.title, sublabel: r.category, type })),
      }
    }

    case 'reunion': {
      const rows = await db
        .select({ id: meetings.id, title: meetings.title, date: meetings.date })
        .from(meetings)
        .where(and(eq(meetings.tenantId, tenantId), ilike(meetings.title, searchPattern)))
        .orderBy(desc(meetings.createdAt))
        .limit(LIMIT)

      return {
        data: rows.map((r) => ({
          id: r.id,
          label: r.title,
          sublabel: r.date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }),
          type,
        })),
      }
    }

    case 'votacion': {
      const rows = await db
        .select({ id: polls.id, title: polls.title, status: polls.status })
        .from(polls)
        .where(and(eq(polls.tenantId, tenantId), ilike(polls.title, searchPattern)))
        .orderBy(desc(polls.createdAt))
        .limit(LIMIT)

      return {
        data: rows.map((r) => ({ id: r.id, label: r.title, sublabel: r.status, type })),
      }
    }

    case 'proveedor': {
      const rows = await db
        .select({ id: providers.id, name: providers.name, category: providers.category })
        .from(providers)
        .where(
          and(
            eq(providers.tenantId, tenantId),
            eq(providers.status, 'active'),
            ilike(providers.name, searchPattern),
          ),
        )
        .orderBy(desc(providers.createdAt))
        .limit(LIMIT)

      return {
        data: rows.map((r) => ({ id: r.id, label: r.name, sublabel: r.category, type })),
      }
    }

    case 'normativa': {
      const rows = await db
        .select({ id: regulations.id, title: regulations.title, category: regulations.category })
        .from(regulations)
        .where(and(eq(regulations.tenantId, tenantId), ilike(regulations.title, searchPattern)))
        .orderBy(desc(regulations.createdAt))
        .limit(LIMIT)

      return {
        data: rows.map((r) => ({ id: r.id, label: r.title, sublabel: r.category, type })),
      }
    }
  }
})

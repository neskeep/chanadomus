import { db } from '~~/server/db'
import { financialRecords } from '~~/server/db/schema/financial'
import { units } from '~~/server/db/schema/unit'
import { incidents } from '~~/server/db/schema/incident'
import { eq, and, inArray, sql as dsql } from 'drizzle-orm'

interface FinancialRow {
  unitLabel: string | null
  unitNumber: string
  totalCargos: string | null
  totalAbonos: string | null
  balance: string | null
}

interface IncidentRow {
  title: string
  priority: string
  status: string
  createdAt: Date
}

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0] ?? ''
}

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  const { tenantId } = session

  // Admin-only endpoint
  if (session.user.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Solo administradores pueden exportar reportes' })
  }

  // Query both sections in parallel
  const [financialRows, incidentRows] = await Promise.all([
    // Section 1: Financial summary per unit
    db
      .select({
        unitLabel: units.label,
        unitNumber: units.number,
        totalCargos: dsql<string>`COALESCE(SUM(CASE WHEN ${financialRecords.type} = 'cargo' THEN CAST(${financialRecords.amount} AS numeric) ELSE 0 END), 0)`.as('total_cargos'),
        totalAbonos: dsql<string>`COALESCE(SUM(CASE WHEN ${financialRecords.type} = 'abono' THEN CAST(${financialRecords.amount} AS numeric) ELSE 0 END), 0)`.as('total_abonos'),
        balance: dsql<string>`COALESCE(SUM(CASE WHEN ${financialRecords.type} = 'cargo' THEN CAST(${financialRecords.amount} AS numeric) ELSE -CAST(${financialRecords.amount} AS numeric) END), 0)`.as('balance'),
      })
      .from(units)
      .leftJoin(
        financialRecords,
        and(
          eq(financialRecords.unitId, units.id),
          eq(financialRecords.tenantId, tenantId),
        ),
      )
      .where(eq(units.tenantId, tenantId))
      .groupBy(units.id, units.label, units.number)
      .orderBy(units.number) as unknown as FinancialRow[],

    // Section 2: Open/In-progress incidents
    db
      .select({
        title: incidents.title,
        priority: incidents.priority,
        status: incidents.status,
        createdAt: incidents.createdAt,
      })
      .from(incidents)
      .where(
        and(
          eq(incidents.tenantId, tenantId),
          inArray(incidents.status, ['open', 'in_progress']),
        ),
      )
      .orderBy(incidents.createdAt) as unknown as IncidentRow[],
  ])

  // Build CSV string
  const lines: string[] = []

  // BOM for Excel compatibility
  const bom = '\uFEFF'

  // Section 1: Financial Summary
  lines.push('RESUMEN FINANCIERO POR UNIDAD')
  lines.push('Unidad,Total Cargos,Total Abonos,Balance')

  for (const row of financialRows) {
    const unitName = row.unitLabel ?? row.unitNumber
    const cargos = Number(row.totalCargos ?? 0).toFixed(2)
    const abonos = Number(row.totalAbonos ?? 0).toFixed(2)
    const balance = Number(row.balance ?? 0).toFixed(2)
    lines.push(`${escapeCsvField(unitName)},${cargos},${abonos},${balance}`)
  }

  // Separator
  lines.push('')

  // Section 2: Incidents
  lines.push('INCIDENCIAS ABIERTAS')
  lines.push('Titulo,Prioridad,Estado,Fecha Creacion')

  for (const row of incidentRows) {
    const statusMap: Record<string, string> = {
      open: 'Abierta',
      in_progress: 'En Progreso',
    }
    const priorityMap: Record<string, string> = {
      low: 'Baja',
      medium: 'Media',
      high: 'Alta',
    }
    lines.push(
      `${escapeCsvField(row.title)},${priorityMap[row.priority] ?? row.priority},${statusMap[row.status] ?? row.status},${formatDate(row.createdAt)}`,
    )
  }

  const csv = bom + lines.join('\n')

  // Date for filename
  const today = new Date().toISOString().split('T')[0]

  setResponseHeaders(event, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="reporte-operacional-${today}.csv"`,
  })

  return csv
})

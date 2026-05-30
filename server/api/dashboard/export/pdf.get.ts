import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { db } from '~~/server/db'
import { incidents } from '~~/server/db/schema/incident'
import { polls } from '~~/server/db/schema/poll'
import { meetings } from '~~/server/db/schema/meeting'
import { eq, and, count, gte, inArray, sql as dsql } from 'drizzle-orm'

interface FinancialRow {
  unitLabel: string
  totalCargos: string
  totalAbonos: string
  balance: string
}

interface IncidentRow {
  title: string
  priority: string
  status: string
  date: string
}

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  const { tenantId } = session

  // Admin-only
  if (session.user.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Solo administradores pueden exportar reportes' })
  }

  const now = new Date()

  // --- Parallel queries ---
  const [financialData, openIncidents, statsData] = await Promise.all([
    // Financial summary per unit
    db.execute(
      dsql`SELECT
        COALESCE(u.label, u.number) AS unit_label,
        COALESCE(SUM(CASE WHEN fr.type = 'cargo' THEN CAST(fr.amount AS numeric) ELSE 0 END), 0) AS total_cargos,
        COALESCE(SUM(CASE WHEN fr.type = 'abono' THEN CAST(fr.amount AS numeric) ELSE 0 END), 0) AS total_abonos,
        COALESCE(SUM(CASE WHEN fr.type = 'cargo' THEN CAST(fr.amount AS numeric) ELSE -CAST(fr.amount AS numeric) END), 0) AS balance
      FROM units u
      LEFT JOIN financial_records fr ON fr.unit_id = u.id AND fr.tenant_id = ${tenantId}
      WHERE u.tenant_id = ${tenantId}
      GROUP BY u.id, u.label, u.number
      ORDER BY u.number ASC`,
    ),

    // Open/in-progress incidents
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
      ),

    // Stats counts
    Promise.all([
      db
        .select({ total: count() })
        .from(incidents)
        .where(and(eq(incidents.tenantId, tenantId), inArray(incidents.status, ['open', 'in_progress']))),
      db
        .select({ total: count() })
        .from(polls)
        .where(and(eq(polls.tenantId, tenantId), eq(polls.status, 'active'))),
      db
        .select({ total: count() })
        .from(meetings)
        .where(and(eq(meetings.tenantId, tenantId), eq(meetings.status, 'programada'), gte(meetings.date, now))),
      db.execute(
        dsql`SELECT COUNT(*) as total FROM (
          SELECT unit_id
          FROM financial_records
          WHERE tenant_id = ${tenantId}
          GROUP BY unit_id
          HAVING SUM(CASE WHEN type = 'cargo' THEN CAST(amount AS numeric) ELSE -CAST(amount AS numeric) END) > 0
        ) AS debt_units`,
      ),
    ]),
  ])

  // Parse stats
  const openIncidentsCount = statsData[0][0]?.total ?? 0
  const activePollsCount = statsData[1][0]?.total ?? 0
  const upcomingMeetingsCount = statsData[2][0]?.total ?? 0
  const unitsInDebtRows = statsData[3] as unknown as Array<{ total: string | number }>
  const unitsInDebtCount = Number(unitsInDebtRows[0]?.total ?? 0)

  // Parse financial data
  const financialRows = (financialData as unknown as Array<{
    unit_label: string
    total_cargos: string | number
    total_abonos: string | number
    balance: string | number
  }>).map((row): FinancialRow => ({
    unitLabel: String(row.unit_label),
    totalCargos: Number(row.total_cargos).toLocaleString('es-VE', { minimumFractionDigits: 2 }),
    totalAbonos: Number(row.total_abonos).toLocaleString('es-VE', { minimumFractionDigits: 2 }),
    balance: Number(row.balance).toLocaleString('es-VE', { minimumFractionDigits: 2 }),
  }))

  // Parse incidents
  const incidentRows: IncidentRow[] = openIncidents.map((inc) => ({
    title: inc.title,
    priority: inc.priority,
    status: inc.status,
    date: inc.createdAt.toLocaleDateString('es-VE'),
  }))

  // --- Build PDF ---
  const dateStr = now.toISOString().split('T')[0]
  const formattedDate = now.toLocaleDateString('es-VE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const doc = new jsPDF()
  const headerColor: [number, number, number] = [26, 26, 46] // #1a1a2e

  // Title
  doc.setFontSize(18)
  doc.setTextColor(headerColor[0], headerColor[1], headerColor[2])
  doc.text('Reporte Operacional \u2014 Ranchos de Chana', 14, 22)

  // Date
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`Fecha: ${formattedDate}`, 14, 30)

  // Section: Resumen General
  doc.setFontSize(14)
  doc.setTextColor(headerColor[0], headerColor[1], headerColor[2])
  doc.text('Resumen General', 14, 42)

  doc.setFontSize(10)
  doc.setTextColor(50, 50, 50)
  const summaryLines = [
    `Incidencias abiertas/en progreso: ${openIncidentsCount}`,
    `Votaciones activas: ${activePollsCount}`,
    `Reuniones programadas: ${upcomingMeetingsCount}`,
    `Unidades en mora: ${unitsInDebtCount}`,
  ]
  let summaryY = 50
  for (const line of summaryLines) {
    doc.text(line, 14, summaryY)
    summaryY += 6
  }

  // Section: Estado Financiero por Unidad
  doc.setFontSize(14)
  doc.setTextColor(headerColor[0], headerColor[1], headerColor[2])
  doc.text('Estado Financiero por Unidad', 14, summaryY + 8)

  autoTable(doc, {
    startY: summaryY + 14,
    head: [['Unidad', 'Total Cargos', 'Total Abonos', 'Balance']],
    body: financialRows.map((row) => [
      row.unitLabel,
      row.totalCargos,
      row.totalAbonos,
      row.balance,
    ]),
    headStyles: {
      fillColor: headerColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 250],
    },
  })

  // Section: Incidencias Abiertas
  // jspdf-autotable extends jsPDF prototype with lastAutoTable after each table draw
  const lastTable = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
  const financialTableEnd = lastTable?.finalY ?? summaryY + 40
  const incidentsStartY = financialTableEnd + 12

  doc.setFontSize(14)
  doc.setTextColor(headerColor[0], headerColor[1], headerColor[2])
  doc.text('Incidencias Abiertas', 14, incidentsStartY)

  if (incidentRows.length > 0) {
    autoTable(doc, {
      startY: incidentsStartY + 6,
      head: [['Titulo', 'Prioridad', 'Estado', 'Fecha']],
      body: incidentRows.map((row) => [
        row.title,
        row.priority,
        row.status,
        row.date,
      ]),
      headStyles: {
        fillColor: headerColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 250],
      },
    })
  } else {
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text('No hay incidencias abiertas.', 14, incidentsStartY + 8)
  }

  // --- Return PDF ---
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

  setResponseHeaders(event, {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="reporte-operacional-${dateStr}.pdf"`,
  })

  return pdfBuffer
})

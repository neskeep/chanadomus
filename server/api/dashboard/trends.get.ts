import { db } from '~~/server/db'
import { incidents } from '~~/server/db/schema/incident'
import { accessLogs } from '~~/server/db/schema/access'
import { financialRecords } from '~~/server/db/schema/financial'
import { eq, and, gte, lt, sql as dsql } from 'drizzle-orm'

interface IncidentByMonth {
  month: string
  count: number
}

interface AccessByDay {
  day: string
  count: number
}

interface FinanceByMonth {
  month: string
  cargos: number
  abonos: number
}

interface FinancialKpis {
  totalCargos: number
  totalAbonos: number
  collectionRate: number
  pendingBalance: number
}

export default defineEventHandler(async (event) => {
  const { tenantId } = await requireTenant(event)

  const now = new Date()
  // Meses y días se calculan en la zona del condominio, no en la del servidor
  const sixMonthsAgoUtc = localMonthStartUtc(5, now)
  // financial_records.date guarda la fecha de calendario (mediodía), se compara contra YYYY-MM-01
  const sixMonthsAgoISO = localMonthStartString(5, now)
  const currentMonthISO = localMonthStartString(0, now)

  const accessDays = lastLocalDays(7, now)
  const accessRange = localDateRangeToUtc(accessDays[0]!, accessDays[accessDays.length - 1]!)
  const accessDayExpr = dsql<string>`to_char(${localDateOf(accessLogs.createdAt)}, 'YYYY-MM-DD')`
  const incidentMonthExpr = dsql<string>`to_char(${localTimestampOf(incidents.createdAt)}, 'YYYY-MM')`

  const [incidentsByMonth, accessByDay, financeByMonth, financialKpis] = await Promise.all([
    // incidentsByMonth — last 6 months
    (async (): Promise<IncidentByMonth[]> => {
      try {
        const rows = await db
          .select({
            month: incidentMonthExpr,
            count: dsql<number>`cast(count(*) as integer)`,
          })
          .from(incidents)
          .where(and(
            eq(incidents.tenantId, tenantId),
            gte(incidents.createdAt, sixMonthsAgoUtc),
          ))
          .groupBy(incidentMonthExpr)
          .orderBy(incidentMonthExpr)
        return rows
      } catch {
        return []
      }
    })(),

    // accessByDay — hoy (zona del condominio) y los 6 días anteriores, días sin accesos en 0.
    // Cuenta solo entradas permitidas (misma definición que stats.todayEntryCount).
    (async (): Promise<AccessByDay[]> => {
      try {
        const rows = await db
          .select({
            day: accessDayExpr,
            count: dsql<number>`cast(count(*) as integer)`,
          })
          .from(accessLogs)
          .where(and(
            eq(accessLogs.tenantId, tenantId),
            gte(accessLogs.createdAt, accessRange.start),
            lt(accessLogs.createdAt, accessRange.end),
            countedEntryCondition(),
          ))
          .groupBy(accessDayExpr)
        const byDay = new Map(rows.map(r => [r.day, r.count]))
        return accessDays.map(day => ({ day, count: byDay.get(day) ?? 0 }))
      } catch {
        return accessDays.map(day => ({ day, count: 0 }))
      }
    })(),

    // financeByMonth — last 6 months
    (async (): Promise<FinanceByMonth[]> => {
      try {
        const rows = await db
          .select({
            month: dsql<string>`to_char(${financialRecords.date}, 'YYYY-MM')`,
            cargos: dsql<number>`cast(coalesce(sum(case when ${financialRecords.type} = 'cargo' then cast(${financialRecords.amount} as numeric) else 0 end), 0) as float)`,
            abonos: dsql<number>`cast(coalesce(sum(case when ${financialRecords.type} = 'abono' then cast(${financialRecords.amount} as numeric) else 0 end), 0) as float)`,
          })
          .from(financialRecords)
          .where(and(
            eq(financialRecords.tenantId, tenantId),
            dsql`${financialRecords.date} >= ${sixMonthsAgoISO}::date`,
          ))
          .groupBy(dsql`to_char(${financialRecords.date}, 'YYYY-MM')`)
          .orderBy(dsql`to_char(${financialRecords.date}, 'YYYY-MM')`)
        return rows
      } catch {
        return []
      }
    })(),

    // financialKpis — current month + all-time pending
    (async (): Promise<FinancialKpis> => {
      const defaultKpis: FinancialKpis = {
        totalCargos: 0,
        totalAbonos: 0,
        collectionRate: 0,
        pendingBalance: 0,
      }
      try {
        const [currentMonth, allTime] = await Promise.all([
          // Current month totals
          db
            .select({
              cargos: dsql<number>`cast(coalesce(sum(case when ${financialRecords.type} = 'cargo' then cast(${financialRecords.amount} as numeric) else 0 end), 0) as float)`,
              abonos: dsql<number>`cast(coalesce(sum(case when ${financialRecords.type} = 'abono' then cast(${financialRecords.amount} as numeric) else 0 end), 0) as float)`,
            })
            .from(financialRecords)
            .where(and(
              eq(financialRecords.tenantId, tenantId),
              dsql`${financialRecords.date} >= ${currentMonthISO}::date`,
            )),

          // All-time pending balance
          db
            .select({
              cargos: dsql<number>`cast(coalesce(sum(case when ${financialRecords.type} = 'cargo' then cast(${financialRecords.amount} as numeric) else 0 end), 0) as float)`,
              abonos: dsql<number>`cast(coalesce(sum(case when ${financialRecords.type} = 'abono' then cast(${financialRecords.amount} as numeric) else 0 end), 0) as float)`,
            })
            .from(financialRecords)
            .where(eq(financialRecords.tenantId, tenantId)),
        ])

        const monthCargos = currentMonth[0]?.cargos ?? 0
        const monthAbonos = currentMonth[0]?.abonos ?? 0
        const totalCargos = allTime[0]?.cargos ?? 0
        const totalAbonos = allTime[0]?.abonos ?? 0
        const pendingBalance = totalCargos - totalAbonos
        const collectionRate = monthCargos > 0
          ? Math.round((monthAbonos / monthCargos) * 10000) / 100
          : 0

        return {
          totalCargos: monthCargos,
          totalAbonos: monthAbonos,
          collectionRate,
          pendingBalance,
        }
      } catch {
        return defaultKpis
      }
    })(),
  ])

  return {
    data: {
      incidentsByMonth,
      accessByDay,
      financeByMonth,
      financialKpis,
    },
  }
})

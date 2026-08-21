import { db } from '~~/server/db'
import { incidents } from '~~/server/db/schema/incident'
import { accessLogs } from '~~/server/db/schema/access'
import { financialRecords } from '~~/server/db/schema/financial'
import { eq, and, gte, sql as dsql } from 'drizzle-orm'

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
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  // Calculate 7 days ago in Caracas timezone to align with GROUP BY
  const caracasOffset = -4 * 60 * 60 * 1000 // UTC-4
  const nowInCaracas = new Date(now.getTime() + caracasOffset)
  const startOfTodayCaracas = new Date(Date.UTC(nowInCaracas.getUTCFullYear(), nowInCaracas.getUTCMonth(), nowInCaracas.getUTCDate()))
  const sevenDaysAgo = new Date(startOfTodayCaracas.getTime() - 6 * 24 * 60 * 60 * 1000 - caracasOffset)
  // Use SQL string to avoid JS Date timezone offset with timestamp columns
  const currentMonthISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const [incidentsByMonth, accessByDay, financeByMonth, financialKpis] = await Promise.all([
    // incidentsByMonth — last 6 months
    (async (): Promise<IncidentByMonth[]> => {
      try {
        const rows = await db
          .select({
            month: dsql<string>`to_char(${incidents.createdAt}, 'YYYY-MM')`,
            count: dsql<number>`cast(count(*) as integer)`,
          })
          .from(incidents)
          .where(and(
            eq(incidents.tenantId, tenantId),
            gte(incidents.createdAt, sixMonthsAgo),
          ))
          .groupBy(dsql`to_char(${incidents.createdAt}, 'YYYY-MM')`)
          .orderBy(dsql`to_char(${incidents.createdAt}, 'YYYY-MM')`)
        return rows
      } catch {
        return []
      }
    })(),

    // accessByDay — last 7 days
    (async (): Promise<AccessByDay[]> => {
      try {
        const rows = await db
          .select({
            day: dsql<string>`to_char(${accessLogs.createdAt} AT TIME ZONE 'America/Caracas', 'YYYY-MM-DD')`,
            count: dsql<number>`cast(count(*) as integer)`,
          })
          .from(accessLogs)
          .where(and(
            eq(accessLogs.tenantId, tenantId),
            gte(accessLogs.createdAt, sevenDaysAgo),
          ))
          .groupBy(dsql`to_char(${accessLogs.createdAt} AT TIME ZONE 'America/Caracas', 'YYYY-MM-DD')`)
          .orderBy(dsql`to_char(${accessLogs.createdAt} AT TIME ZONE 'America/Caracas', 'YYYY-MM-DD')`)
        return rows
      } catch {
        return []
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
            gte(financialRecords.date, sixMonthsAgo),
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

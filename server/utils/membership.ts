import { and, asc, desc, eq, gt, gte, isNotNull, isNull, or, sql, type AnyColumn, type SQL } from 'drizzle-orm'
import { db } from '~~/server/db'
import { user } from '~~/server/db/schema/auth'
import { units } from '~~/server/db/schema/unit'
import { staff } from '~~/server/db/schema/staff'
import { householdMembers } from '~~/server/db/schema/household'
import { householdMemberPasses } from '~~/server/db/schema/household-member-pass'
import { unitServiceStaff } from '~~/server/db/schema/unit-service-staff'
import { serviceStaffPasses } from '~~/server/db/schema/service-staff-pass'
import { vehicles } from '~~/server/db/schema/vehicle'
import { vehiclePasses } from '~~/server/db/schema/vehicle-pass'
import { residentPasses } from '~~/server/db/schema/resident-pass'
import { accessLogs, qrCodes } from '~~/server/db/schema/access'
import { financialRecords } from '~~/server/db/schema/financial'
import { membershipClosings, membershipClosingUnits, membershipRates } from '~~/server/db/schema/membership'
import { countedEntryCondition, type DbExecutor } from '~~/server/utils/access-entry-exit'
import { lastLocalDays, localDateRangeToUtc, localMonthStartString } from '~~/server/utils/tenant-time'
import {
  MEMBERSHIP_ACCESS_WINDOW_DAYS,
  classifyUnit,
  compareMembershipUnits,
  isBillableUnit,
  nextRateAfter,
  normalizeCounts,
  periodOfDate,
  periodStartDate,
  rateEffectiveOn,
  rateFor,
  rateForPeriod,
  reasonsLabel,
  summarize,
  unitKind,
} from '~~/shared/lib/membership'
import type {
  MembershipClosing,
  MembershipClosingDetail,
  MembershipClosingUnit,
  MembershipRate,
  MembershipRates,
  MembershipUnit,
} from '~~/shared/types/membership'

/**
 * Cálculo en vivo de la membresía y cierres mensuales.
 * Reglas puras (clasificación, importes, vigencia) en shared/lib/membership.ts.
 */

// ─── Condiciones ─────────────────────────────────────────────────────────────

/** Pase activo: misma regla que el escáner (validate.post.ts): isActive y sin vencer. */
function activePassCondition(isActive: AnyColumn, expiresAt: AnyColumn, now: Date): SQL {
  return and(eq(isActive, true), or(isNull(expiresAt), gt(expiresAt, now))) as SQL
}

const countInt = (expr: SQL = sql`*`) => sql<number>`count(${expr})::int`

/*
 * Nota: drizzle referencia los campos `sql\`...\`.as()` de una subconsulta sin calificar
 * (sin "m_owners".), así que cada alias es único en toda la consulta (owners_n, vehicles_unit_id...).
 */

// ─── Subconsultas agregadas por unidad ───────────────────────────────────────

function countsSubqueries(exec: DbExecutor, tenantId: string, now: Date) {
  const owners = exec
    .select({ unitId: user.unitId, n: countInt().as('owners_n') })
    .from(user)
    .where(and(
      eq(user.tenantId, tenantId),
      isNotNull(user.unitId),
      sql`coalesce(${user.banned}, false) = false`,
    ))
    .groupBy(user.unitId)
    .as('m_owners')

  const concierges = exec
    .select({ unitId: staff.unitId, n: countInt().as('concierges_n') })
    .from(staff)
    .where(and(
      eq(staff.tenantId, tenantId),
      isNotNull(staff.unitId),
      isNotNull(staff.userId),
      eq(staff.isActive, true),
    ))
    .groupBy(staff.unitId)
    .as('m_concierges')

  // Personal del edificio con QR propio y sin usuario (los que tienen usuario ya cuentan como conserje)
  const buildingStaff = exec
    .select({ unitId: staff.unitId, n: countInt().as('building_staff_n') })
    .from(staff)
    .where(and(
      eq(staff.tenantId, tenantId),
      isNotNull(staff.unitId),
      isNotNull(staff.qrToken),
      isNull(staff.userId),
      eq(staff.isActive, true),
    ))
    .groupBy(staff.unitId)
    .as('m_building_staff')

  const members = exec
    .select({ unitId: householdMemberPasses.unitId, n: countInt(sql`distinct ${householdMembers.id}`).as('members_n') })
    .from(householdMemberPasses)
    .innerJoin(householdMembers, eq(householdMembers.id, householdMemberPasses.memberId))
    .where(and(
      eq(householdMemberPasses.tenantId, tenantId),
      eq(householdMembers.tenantId, tenantId),
      eq(householdMembers.isActive, true),
      activePassCondition(householdMemberPasses.isActive, householdMemberPasses.expiresAt, now),
    ))
    .groupBy(householdMemberPasses.unitId)
    .as('m_members')

  const serviceStaff = exec
    .select({ unitId: serviceStaffPasses.unitId, n: countInt(sql`distinct ${unitServiceStaff.id}`).as('service_staff_n') })
    .from(serviceStaffPasses)
    .innerJoin(unitServiceStaff, eq(unitServiceStaff.id, serviceStaffPasses.staffId))
    .where(and(
      eq(serviceStaffPasses.tenantId, tenantId),
      eq(unitServiceStaff.tenantId, tenantId),
      eq(unitServiceStaff.isActive, true),
      activePassCondition(serviceStaffPasses.isActive, serviceStaffPasses.expiresAt, now),
    ))
    .groupBy(serviceStaffPasses.unitId)
    .as('m_service_staff')

  // Unidad del vehículo: la del vehículo o, si no tiene, la del pase (igual que el escáner)
  const vehicleUnit = sql<string>`coalesce(${vehicles.unitId}, ${vehiclePasses.unitId})`
  const vehicleCount = exec
    .select({
      unitId: sql<string>`${vehicleUnit}`.as('vehicles_unit_id'),
      n: countInt(sql`distinct coalesce(${vehiclePasses.vehicleId}::text, ${vehiclePasses.id}::text)`).as('vehicles_n'),
    })
    .from(vehiclePasses)
    .leftJoin(vehicles, eq(vehicles.id, vehiclePasses.vehicleId))
    .where(and(
      eq(vehiclePasses.tenantId, tenantId),
      eq(vehiclePasses.passType, 'resident'),
      activePassCondition(vehiclePasses.isActive, vehiclePasses.expiresAt, now),
    ))
    .groupBy(vehicleUnit)
    .as('m_vehicles')

  const residents = exec
    .select({ unitId: residentPasses.unitId, n: countInt(sql`distinct ${residentPasses.userId}`).as('resident_passes_n') })
    .from(residentPasses)
    .where(and(
      eq(residentPasses.tenantId, tenantId),
      isNotNull(residentPasses.unitId),
      activePassCondition(residentPasses.isActive, residentPasses.expiresAt, now),
    ))
    .groupBy(residentPasses.unitId)
    .as('m_resident_passes')

  return { owners, concierges, buildingStaff, members, serviceStaff, vehicleCount, residents }
}

function contextSubqueries(exec: DbExecutor, tenantId: string, now: Date) {
  // Ventana de accesos: los últimos N días locales, incluido hoy
  const firstDay = lastLocalDays(MEMBERSHIP_ACCESS_WINDOW_DAYS, now)[0]!
  const since = localDateRangeToUtc(firstDay, firstDay).start

  // Unidad del acceso: la del log, la del QR de visita o la del vehículo (los logs vehiculares no guardan unit_id)
  const accessUnit = sql<string>`coalesce(${accessLogs.unitId}, ${qrCodes.unitId}, ${vehicles.unitId}, ${vehiclePasses.unitId}, ${serviceStaffPasses.unitId})`
  const accesses = exec
    .select({ unitId: sql<string>`${accessUnit}`.as('accesses_unit_id'), n: countInt().as('accesses_n') })
    .from(accessLogs)
    .leftJoin(qrCodes, eq(qrCodes.id, accessLogs.qrCodeId))
    .leftJoin(vehiclePasses, eq(vehiclePasses.id, accessLogs.vehiclePassId))
    .leftJoin(vehicles, eq(vehicles.id, vehiclePasses.vehicleId))
    .leftJoin(serviceStaffPasses, eq(serviceStaffPasses.id, accessLogs.staffPassId))
    .where(and(
      eq(accessLogs.tenantId, tenantId),
      gte(accessLogs.createdAt, since),
      countedEntryCondition(),
    ))
    .groupBy(accessUnit)
    .as('m_accesses')

  // Saldo: abonos suman, cargos restan (misma fórmula que finance/unit-account/[unitId].get.ts)
  const finance = exec
    .select({
      unitId: financialRecords.unitId,
      n: countInt().as('finance_n'),
      balance: sql<string>`coalesce(sum(
        case when ${financialRecords.type} = 'abono' then ${financialRecords.amount}
             when ${financialRecords.type} = 'cargo' then -${financialRecords.amount}
             else 0 end
      ), 0)::numeric(12,2)`.as('finance_balance'),
    })
    .from(financialRecords)
    .where(eq(financialRecords.tenantId, tenantId))
    .groupBy(financialRecords.unitId)
    .as('m_finance')

  return { accesses, finance }
}

export interface ComputedMembershipUnits {
  units: MembershipUnit[]
  /** Unidades DEMO del tenant, excluidas del cobro */
  excludedDemoUnits: number
}

/**
 * Clasificación en vivo de todas las unidades cobrables del tenant.
 * Un solo SELECT sobre `units` con agregados por unidad (todos filtrados por tenant).
 * `rates` null → `rate` de cada unidad en null.
 */
export async function computeMembershipUnits(
  tenantId: string,
  rates: Pick<MembershipRates, 'fullRate' | 'reducedRate'> | null,
  options: { exec?: DbExecutor; now?: Date } = {},
): Promise<ComputedMembershipUnits> {
  const exec = options.exec ?? db
  const now = options.now ?? new Date()
  const c = countsSubqueries(exec, tenantId, now)
  const ctx = contextSubqueries(exec, tenantId, now)
  const n = (col: SQL.Aliased<number> | AnyColumn) => sql<number>`coalesce(${col}, 0)::int`

  const rows = await exec
    .select({
      unitId: units.id,
      number: units.number,
      label: units.label,
      isActive: units.isActive,
      owners: n(c.owners.n),
      concierges: n(c.concierges.n),
      buildingStaff: n(c.buildingStaff.n),
      members: n(c.members.n),
      serviceStaff: n(c.serviceStaff.n),
      vehicles: n(c.vehicleCount.n),
      residentPasses: n(c.residents.n),
      accesses30d: n(ctx.accesses.n),
      financialMovements: n(ctx.finance.n),
      balance: sql<string>`coalesce(${ctx.finance.balance}, 0)::numeric(12,2)`,
    })
    .from(units)
    .leftJoin(c.owners, eq(c.owners.unitId, units.id))
    .leftJoin(c.concierges, eq(c.concierges.unitId, units.id))
    .leftJoin(c.buildingStaff, eq(c.buildingStaff.unitId, units.id))
    .leftJoin(c.members, eq(c.members.unitId, units.id))
    .leftJoin(c.serviceStaff, eq(c.serviceStaff.unitId, units.id))
    .leftJoin(c.vehicleCount, sql`${c.vehicleCount.unitId} = ${units.id}`)
    .leftJoin(c.residents, eq(c.residents.unitId, units.id))
    .leftJoin(ctx.accesses, sql`${ctx.accesses.unitId} = ${units.id}`)
    .leftJoin(ctx.finance, eq(ctx.finance.unitId, units.id))
    .where(eq(units.tenantId, tenantId))

  let excludedDemoUnits = 0
  const result: MembershipUnit[] = []
  for (const row of rows) {
    if (!isBillableUnit(row.number, row.label)) {
      excludedDemoUnits++
      continue
    }
    const counts = normalizeCounts(row)
    const tier = classifyUnit(counts)
    result.push({
      unitId: row.unitId,
      number: row.number,
      label: row.label,
      kind: unitKind(row.number),
      isActive: row.isActive,
      tier,
      rate: rates ? rateFor(tier, rates) : null,
      counts,
      reasons: reasonsLabel(counts),
      accesses30d: Number(row.accesses30d) || 0,
      financialMovements: Number(row.financialMovements) || 0,
      balance: Number(row.balance) || 0,
    })
  }
  result.sort(compareMembershipUnits)
  return { units: result, excludedDemoUnits }
}

// ─── Tarifas ─────────────────────────────────────────────────────────────────

/**
 * Historial de tarifas del tenant, de la más reciente a la más antigua
 * (misma fecha de inicio: la última creada primero, que es la que rige).
 */
export async function listMembershipRates(tenantId: string, exec: DbExecutor = db): Promise<MembershipRate[]> {
  const rows = await exec
    .select({
      id: membershipRates.id,
      fullRate: membershipRates.fullRate,
      reducedRate: membershipRates.reducedRate,
      currency: membershipRates.currency,
      effectiveFrom: membershipRates.effectiveFrom,
      notes: membershipRates.notes,
      createdById: membershipRates.createdById,
      createdByName: user.name,
      createdAt: membershipRates.createdAt,
    })
    .from(membershipRates)
    .leftJoin(user, eq(user.id, membershipRates.createdById))
    .where(eq(membershipRates.tenantId, tenantId))
    .orderBy(desc(membershipRates.effectiveFrom), desc(membershipRates.createdAt))

  return rows.map(row => ({
    ...row,
    fullRate: Number(row.fullRate),
    reducedRate: Number(row.reducedRate),
    createdAt: row.createdAt.toISOString(),
  }))
}

/**
 * Tarifa vigente en la fecha (YYYY-MM-DD). Con dos tarifas del mismo día gana la
 * última creada: listMembershipRates la pone primero y rateEffectiveOn se queda con la primera.
 */
export async function getRatesFor(tenantId: string, ymd: string, exec: DbExecutor = db): Promise<MembershipRate | null> {
  return rateEffectiveOn(await listMembershipRates(tenantId, exec), ymd)
}

/** Mes en curso (YYYY-MM) en la zona del condominio. */
export function currentMembershipPeriod(now: Date = new Date()): string {
  return periodOfDate(localMonthStartString(0, now))
}

/** Mes anterior (YYYY-MM) en la zona del condominio. */
export function previousMembershipPeriod(now: Date = new Date()): string {
  return periodOfDate(localMonthStartString(1, now))
}

/**
 * Tarifa para los importes en vivo: la vigente hoy o, si aún no hay, la próxima programada.
 */
export function liveRate(rates: MembershipRate[], today: string): { rate: MembershipRate | null; status: 'current' | 'upcoming' | 'none' } {
  const current = rateEffectiveOn(rates, today)
  if (current) return { rate: current, status: 'current' }
  const upcoming = nextRateAfter(rates, today)
  return upcoming ? { rate: upcoming, status: 'upcoming' } : { rate: null, status: 'none' }
}

// ─── Cierres ─────────────────────────────────────────────────────────────────

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

/** Clave del advisory lock de un cierre (tenant + periodo). */
function closingLockKey(tenantId: string, period: string): string {
  return `membership-closing:${tenantId}:${period}`
}

async function lockClosing(tx: Transaction, tenantId: string, period: string): Promise<void> {
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${closingLockKey(tenantId, period)}, 0))`)
}

async function closingExists(exec: DbExecutor, tenantId: string, period: string): Promise<boolean> {
  const [row] = await exec
    .select({ id: membershipClosings.id })
    .from(membershipClosings)
    .where(and(eq(membershipClosings.tenantId, tenantId), eq(membershipClosings.period, period)))
    .limit(1)
  return !!row
}

/**
 * Calcula y guarda (o reemplaza) la foto del periodo con los datos de este momento.
 * Debe correr dentro de una transacción que ya tiene el lock del periodo.
 */
async function writeClosing(
  tx: Transaction,
  tenantId: string,
  period: string,
  rate: MembershipRate,
  closedById: string | null,
): Promise<string> {
  const now = new Date()
  const { units: computed } = await computeMembershipUnits(tenantId, rate, { exec: tx, now })
  const totals = summarize(computed, rate)

  const values = {
    fullRate: rate.fullRate.toFixed(2),
    reducedRate: rate.reducedRate.toFixed(2),
    currency: rate.currency,
    unitsFull: totals.byTier.full.units,
    unitsReduced: totals.byTier.reduced.units,
    total: (totals.total ?? 0).toFixed(2),
    closedAt: now,
    closedById,
  }

  const [closing] = await tx
    .insert(membershipClosings)
    .values({ tenantId, period, ...values })
    .onConflictDoUpdate({ target: [membershipClosings.tenantId, membershipClosings.period], set: values })
    .returning({ id: membershipClosings.id })

  const closingId = closing!.id
  await tx.delete(membershipClosingUnits).where(eq(membershipClosingUnits.closingId, closingId))
  if (computed.length) {
    await tx.insert(membershipClosingUnits).values(computed.map(unit => ({
      closingId,
      tenantId,
      unitId: unit.unitId,
      unitNumber: unit.number,
      unitLabel: unit.label,
      unitKind: unit.kind,
      isActive: unit.isActive,
      tier: unit.tier,
      rate: rateFor(unit.tier, rate).toFixed(2),
      reasons: unit.counts,
    })))
  }
  return closingId
}

/**
 * Cierre perezoso (sin cron, como expireEvents): si el mes anterior tiene tarifa
 * vigente y todavía no tiene cierre, lo genera con los datos de este momento
 * (closed_by_id = null). Idempotente y seguro en paralelo: advisory lock por
 * tenant y periodo, y nueva comprobación dentro del lock.
 * Devuelve el periodo cerrado ahora, o null si no hizo nada.
 */
export async function ensureMonthlyClosings(tenantId: string, now: Date = new Date()): Promise<string | null> {
  const period = previousMembershipPeriod(now)
  if (await closingExists(db, tenantId, period)) return null

  const rates = await listMembershipRates(tenantId)
  const rate = rateForPeriod(rates, period)
  if (!rate) return null

  return db.transaction(async (tx) => {
    await lockClosing(tx, tenantId, period)
    if (await closingExists(tx, tenantId, period)) return null
    await writeClosing(tx, tenantId, period, rate, null)
    return period
  })
}

/** Igual que ensureMonthlyClosings, pero nunca lanza (para el dashboard). */
export async function ensureMonthlyClosingsSafe(tenantId: string): Promise<void> {
  try {
    await ensureMonthlyClosings(tenantId)
  }
  catch (err) {
    console.error('[membership] ensureMonthlyClosings failed:', err)
  }
}

/**
 * Cierre manual (superadmin): genera o regenera la foto del periodo.
 * Usa la tarifa vigente el día 01 del periodo; si el periodo es anterior a la
 * primera tarifa (cierre de referencia), usa la próxima programada.
 */
export async function closeMembershipPeriod(tenantId: string, period: string, closedById: string): Promise<MembershipClosingDetail> {
  const rates = await listMembershipRates(tenantId)
  const start = periodStartDate(period)
  const rate = rateEffectiveOn(rates, start) ?? nextRateAfter(rates, start)
  if (!rate) {
    throw createError({ statusCode: 409, message: 'No hay tarifas configuradas. Crea una tarifa antes de cerrar el mes.' })
  }

  await db.transaction(async (tx) => {
    await lockClosing(tx, tenantId, period)
    await writeClosing(tx, tenantId, period, rate, closedById)
  })

  const detail = await getMembershipClosingDetail(tenantId, period)
  if (!detail) throw createError({ statusCode: 500, message: 'No se pudo leer el cierre recién guardado' })
  return detail
}

const closingColumns = {
  id: membershipClosings.id,
  period: membershipClosings.period,
  fullRate: membershipClosings.fullRate,
  reducedRate: membershipClosings.reducedRate,
  currency: membershipClosings.currency,
  unitsFull: membershipClosings.unitsFull,
  unitsReduced: membershipClosings.unitsReduced,
  total: membershipClosings.total,
  closedAt: membershipClosings.closedAt,
  closedById: membershipClosings.closedById,
  closedByName: user.name,
  createdAt: membershipClosings.createdAt,
}

function closingsQuery() {
  return db
    .select(closingColumns)
    .from(membershipClosings)
    .leftJoin(user, eq(user.id, membershipClosings.closedById))
    .$dynamic()
}

type ClosingRow = Awaited<ReturnType<typeof closingsQuery>>[number]

function toClosing(row: ClosingRow): MembershipClosing {
  return {
    id: row.id,
    period: row.period,
    fullRate: Number(row.fullRate),
    reducedRate: Number(row.reducedRate),
    currency: row.currency,
    unitsFull: row.unitsFull,
    unitsReduced: row.unitsReduced,
    total: Number(row.total),
    closedAt: row.closedAt.toISOString(),
    closedById: row.closedById,
    closedByName: row.closedByName,
    isAutomatic: row.closedById === null,
    createdAt: row.createdAt.toISOString(),
  }
}

/** Cierres del tenant, del más reciente al más antiguo. */
export async function listMembershipClosings(tenantId: string, limit?: number): Promise<MembershipClosing[]> {
  const query = closingsQuery()
    .where(eq(membershipClosings.tenantId, tenantId))
    .orderBy(desc(membershipClosings.period))
  const rows = await (limit ? query.limit(limit) : query)
  return rows.map(toClosing)
}

/** Detalle de un cierre con sus unidades (instantánea). null si no existe. */
export async function getMembershipClosingDetail(tenantId: string, period: string): Promise<MembershipClosingDetail | null> {
  const [row] = await closingsQuery()
    .where(and(eq(membershipClosings.tenantId, tenantId), eq(membershipClosings.period, period)))
    .limit(1)
  if (!row) return null

  const closing = toClosing(row)
  const unitRows = await db
    .select({
      unitId: membershipClosingUnits.unitId,
      unitNumber: membershipClosingUnits.unitNumber,
      unitLabel: membershipClosingUnits.unitLabel,
      unitKind: membershipClosingUnits.unitKind,
      isActive: membershipClosingUnits.isActive,
      tier: membershipClosingUnits.tier,
      rate: membershipClosingUnits.rate,
      reasons: membershipClosingUnits.reasons,
    })
    .from(membershipClosingUnits)
    .where(and(eq(membershipClosingUnits.closingId, closing.id), eq(membershipClosingUnits.tenantId, tenantId)))
    .orderBy(asc(membershipClosingUnits.unitNumber))

  const closingUnits: MembershipClosingUnit[] = unitRows.map((unit) => {
    const counts = normalizeCounts(unit.reasons)
    return {
      unitId: unit.unitId,
      unitNumber: unit.unitNumber,
      unitLabel: unit.unitLabel,
      unitKind: unit.unitKind,
      isActive: unit.isActive,
      tier: unit.tier,
      rate: Number(unit.rate),
      counts,
      reasons: reasonsLabel(counts),
    }
  })
  closingUnits.sort((a, b) => compareMembershipUnits(
    { kind: a.unitKind, number: a.unitNumber },
    { kind: b.unitKind, number: b.unitNumber },
  ))

  return {
    closing,
    totals: summarize(closingUnits.map(unit => ({ kind: unit.unitKind, tier: unit.tier })), closing),
    units: closingUnits,
  }
}

/**
 * Lógica pura de la membresía (cobro por unidad). Sirve en server y client.
 * Tipos y reglas de negocio en shared/types/membership.ts.
 */
import { z } from 'zod'
import { paginationQuerySchema } from '~~/shared/lib/pagination'
import { PUSH_STATS_DEMO_UNIT_PATTERN } from '~~/shared/lib/push-stats'
import { normalizeSearchText } from '~~/shared/utils/search'
import {
  MEMBERSHIP_TIERS,
  MEMBERSHIP_UNIT_KINDS,
  type MembershipCounts,
  type MembershipRates,
  type MembershipTier,
  type MembershipTotals,
  type MembershipUnitKind,
} from '~~/shared/types/membership'

export const MEMBERSHIP_UNITS_DEFAULT_LIMIT = 25
export const MEMBERSHIP_UNITS_MAX_LIMIT = 200
export const MEMBERSHIP_DEFAULT_CURRENCY = 'USD'
/** Días de la ventana de accesos usada como contexto */
export const MEMBERSHIP_ACCESS_WINDOW_DAYS = 30

const PERIOD_RE = /^(\d{4})-(0[1-9]|1[0-2])$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

// ─── Unidades ────────────────────────────────────────────────────────────────

const KIND_BY_PREFIX: Record<string, MembershipUnitKind> = {
  R: 'rancho',
  P: 'parcela',
}

/** Tipo de unidad por el prefijo del número ("R-001" → rancho, "P-012" → parcela). */
export function unitKind(number: string): MembershipUnitKind {
  const dash = number.indexOf('-')
  const prefix = dash > 0 ? number.slice(0, dash).trim().toUpperCase() : ''
  return KIND_BY_PREFIX[prefix] ?? 'otra'
}

/** Texto que marca una unidad DEMO (derivado del patrón ILIKE compartido). */
const DEMO_NEEDLE = PUSH_STATS_DEMO_UNIT_PATTERN.replaceAll('%', '').toLowerCase()

/** false si el número o el nombre de la unidad la marcan como DEMO. */
export function isBillableUnit(number: string, label: string | null | undefined): boolean {
  return !number.toLowerCase().includes(DEMO_NEEDLE)
    && !(label ?? '').toLowerCase().includes(DEMO_NEEDLE)
}

// ─── Clasificación ───────────────────────────────────────────────────────────

export const EMPTY_MEMBERSHIP_COUNTS: Readonly<MembershipCounts> = Object.freeze({
  owners: 0,
  concierges: 0,
  buildingStaff: 0,
  members: 0,
  serviceStaff: 0,
  vehicles: 0,
  residentPasses: 0,
})

const COUNT_KEYS = Object.keys(EMPTY_MEMBERSHIP_COUNTS) as Array<keyof MembershipCounts>

/** 'full' si hay al menos una persona o vehículo con acceso permanente; si no, 'reduced'. */
export function classifyUnit(counts: MembershipCounts): MembershipTier {
  return COUNT_KEYS.some(key => (Number(counts[key]) || 0) > 0) ? 'full' : 'reduced'
}

/** Normaliza conteos que vienen de SQL o de jsonb (null/strings → enteros ≥ 0). */
export function normalizeCounts(raw: Partial<Record<keyof MembershipCounts, unknown>> | null | undefined): MembershipCounts {
  const out = { ...EMPTY_MEMBERSHIP_COUNTS }
  for (const key of COUNT_KEYS) {
    const n = Number(raw?.[key] ?? 0)
    out[key] = Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
  }
  return out
}

function plural(n: number, singular: string, pluralForm: string): string {
  return `${n} ${n === 1 ? singular : pluralForm}`
}

export const MEMBERSHIP_NO_REASONS_LABEL = 'Sin personas ni vehículos'

/** Motivo legible: "1 usuario · 10 vehículos · 3 personal". */
export function reasonsLabel(counts: MembershipCounts): string {
  const staffTotal = counts.buildingStaff + counts.serviceStaff
  const parts: string[] = []
  if (counts.owners > 0) parts.push(plural(counts.owners, 'usuario', 'usuarios'))
  if (counts.concierges > 0) parts.push(plural(counts.concierges, 'conserje', 'conserjes'))
  if (counts.members > 0) parts.push(plural(counts.members, 'miembro', 'miembros'))
  if (counts.vehicles > 0) parts.push(plural(counts.vehicles, 'vehículo', 'vehículos'))
  if (staffTotal > 0) parts.push(`${staffTotal} personal`)
  if (counts.residentPasses > 0) parts.push(plural(counts.residentPasses, 'pase de residente', 'pases de residente'))
  return parts.length ? parts.join(' · ') : MEMBERSHIP_NO_REASONS_LABEL
}

// ─── Importes ────────────────────────────────────────────────────────────────

/** Importe → céntimos enteros (evita errores de coma flotante al sumar). */
export function toCents(amount: number): number {
  return Math.round(amount * 100)
}

export function fromCents(cents: number): number {
  return cents / 100
}

/** Importe mensual de una unidad según su tarifa. */
export function rateFor(tier: MembershipTier, rates: Pick<MembershipRates, 'fullRate' | 'reducedRate'>): number {
  return tier === 'full' ? rates.fullRate : rates.reducedRate
}

/**
 * Totales por tarifa, por tipo y tipo×tarifa. Con `rates` null los importes son null
 * (se siguen contando las unidades).
 */
export function summarize(
  units: ReadonlyArray<{ kind: MembershipUnitKind; tier: MembershipTier }>,
  rates: Pick<MembershipRates, 'fullRate' | 'reducedRate'> | null,
): MembershipTotals {
  const tierUnits: Record<MembershipTier, number> = { full: 0, reduced: 0 }
  const kindTier = Object.fromEntries(
    MEMBERSHIP_UNIT_KINDS.map(kind => [kind, { full: 0, reduced: 0 }]),
  ) as Record<MembershipUnitKind, Record<MembershipTier, number>>

  for (const unit of units) {
    tierUnits[unit.tier] += 1
    kindTier[unit.kind][unit.tier] += 1
  }

  const amountOf = (byTier: Record<MembershipTier, number>): number | null => {
    if (!rates) return null
    const cents = MEMBERSHIP_TIERS.reduce((sum, tier) => sum + byTier[tier] * toCents(rateFor(tier, rates)), 0)
    return fromCents(cents)
  }

  return {
    totalUnits: units.length,
    byTier: {
      full: { units: tierUnits.full, amount: rates ? fromCents(tierUnits.full * toCents(rates.fullRate)) : null },
      reduced: { units: tierUnits.reduced, amount: rates ? fromCents(tierUnits.reduced * toCents(rates.reducedRate)) : null },
    },
    byKind: Object.fromEntries(MEMBERSHIP_UNIT_KINDS.map(kind => [kind, {
      units: kindTier[kind].full + kindTier[kind].reduced,
      amount: amountOf(kindTier[kind]),
      byTier: { ...kindTier[kind] },
    }])) as MembershipTotals['byKind'],
    total: amountOf(tierUnits),
  }
}

// ─── Periodos y vigencia de tarifas ──────────────────────────────────────────

/** true si `value` es un periodo YYYY-MM válido. */
export function isPeriod(value: string): boolean {
  return PERIOD_RE.test(value)
}

/** Periodo (YYYY-MM) de una fecha YYYY-MM-DD. */
export function periodOfDate(ymd: string): string {
  return ymd.slice(0, 7)
}

/** Primer día (YYYY-MM-01) del periodo. */
export function periodStartDate(period: string): string {
  return `${period}-01`
}

/**
 * Tarifa vigente en una fecha (YYYY-MM-DD): la de `effectiveFrom` más reciente ≤ fecha.
 * Las tarifas empiezan siempre el día 01, así que un periodo usa la vigente en su día 01.
 */
export function rateEffectiveOn<T extends { effectiveFrom: string }>(rates: readonly T[], ymd: string): T | null {
  let best: T | null = null
  for (const rate of rates) {
    if (rate.effectiveFrom <= ymd && (!best || rate.effectiveFrom > best.effectiveFrom)) best = rate
  }
  return best
}

/** Tarifa que rige un periodo YYYY-MM. */
export function rateForPeriod<T extends { effectiveFrom: string }>(rates: readonly T[], period: string): T | null {
  return rateEffectiveOn(rates, periodStartDate(period))
}

/** Próxima tarifa programada después de la fecha (la de `effectiveFrom` más cercana > fecha). */
export function nextRateAfter<T extends { effectiveFrom: string }>(rates: readonly T[], ymd: string): T | null {
  let best: T | null = null
  for (const rate of rates) {
    if (rate.effectiveFrom > ymd && (!best || rate.effectiveFrom < best.effectiveFrom)) best = rate
  }
  return best
}

// ─── Filtros de la lista ─────────────────────────────────────────────────────

export interface MembershipUnitFilters {
  tier?: MembershipTier
  kind?: MembershipUnitKind
  active?: boolean
  search?: string
}

/** Filtra unidades en memoria (tarifa, tipo, estado y búsqueda por número o nombre). */
export function filterMembershipUnits<T extends {
  tier: MembershipTier
  kind: MembershipUnitKind
  isActive: boolean
  number: string
  label: string | null
}>(units: readonly T[], filters: MembershipUnitFilters): T[] {
  const q = filters.search ? normalizeSearchText(filters.search.trim()) : ''
  return units.filter(unit =>
    (!filters.tier || unit.tier === filters.tier)
    && (!filters.kind || unit.kind === filters.kind)
    && (filters.active === undefined || unit.isActive === filters.active)
    && (!q || normalizeSearchText(`${unit.number} ${unit.label ?? ''}`).includes(q)),
  )
}

/** Orden estable para listas y cierres: por tipo (ranchos, parcelas, otras) y número. */
export function compareMembershipUnits(
  a: { kind: MembershipUnitKind; number: string },
  b: { kind: MembershipUnitKind; number: string },
): number {
  const byKind = MEMBERSHIP_UNIT_KINDS.indexOf(a.kind) - MEMBERSHIP_UNIT_KINDS.indexOf(b.kind)
  return byKind !== 0 ? byKind : a.number.localeCompare(b.number, 'es', { numeric: true })
}

// ─── Schemas de entrada ──────────────────────────────────────────────────────

const booleanQuery = z.enum(['true', 'false'], { error: 'active debe ser "true" o "false"' })
  .transform(value => value === 'true')

/** Query de GET /api/admin/membership/units */
export const membershipUnitsQuerySchema = paginationQuerySchema(
  MEMBERSHIP_UNITS_DEFAULT_LIMIT,
  MEMBERSHIP_UNITS_MAX_LIMIT,
).extend({
  tier: z.enum(MEMBERSHIP_TIERS, { error: 'tier debe ser "full" o "reduced"' }).optional(),
  kind: z.enum(MEMBERSHIP_UNIT_KINDS, { error: 'kind debe ser "rancho", "parcela" u "otra"' }).optional(),
  active: booleanQuery.optional(),
  search: z.string().trim().max(100, 'La búsqueda no puede superar 100 caracteres').optional(),
})

export type MembershipUnitsQueryParsed = z.infer<typeof membershipUnitsQuerySchema>

/** Periodo YYYY-MM en rutas y query. */
export const membershipPeriodSchema = z.string().regex(PERIOD_RE, 'El periodo debe tener el formato AAAA-MM')

const amountSchema = (label: string) => z.coerce.number({ error: `${label} debe ser un número` })
  .min(0, `${label} no puede ser negativa`)
  .max(100000, `${label} es demasiado alta`)
  .refine(value => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6, {
    message: `${label} admite como máximo 2 decimales`,
  })
  .transform(value => fromCents(toCents(value)))

/** Body de POST /api/admin/membership/rates */
export const membershipRateInputSchema = z.object({
  fullRate: amountSchema('La tarifa completa'),
  reducedRate: amountSchema('La tarifa reducida'),
  currency: z.string().trim().regex(/^[A-Z]{3}$/, 'La moneda debe ser un código de 3 letras, como USD')
    .default(MEMBERSHIP_DEFAULT_CURRENCY),
  effectiveFrom: z.string()
    .regex(DATE_RE, 'La fecha de inicio debe tener el formato AAAA-MM-DD')
    .refine(value => value.endsWith('-01') && isPeriod(value.slice(0, 7)), {
      message: 'La tarifa debe empezar el día 1 de un mes',
    }),
  notes: z.string().trim().max(500, 'Las notas no pueden superar 500 caracteres').nullish()
    .transform(value => value || null),
}).refine(value => value.reducedRate <= value.fullRate, {
  message: 'La tarifa reducida no puede ser mayor que la completa',
})

export type MembershipRateInputParsed = z.infer<typeof membershipRateInputSchema>

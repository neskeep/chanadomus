/**
 * Membresía: cobro mensual de ChanaDomus al condominio, por unidad.
 *
 * - Tarifa completa ('full'): la unidad tiene al menos una persona o vehículo con
 *   acceso permanente (usuario, conserje, personal, miembro, vehículo o pase de residente).
 * - Tarifa reducida ('reduced'): todas las demás. Aplica igual a unidades inactivas.
 * - Las unidades DEMO no se cobran.
 *
 * Todos los importes son números en la moneda de la tarifa (USD), redondeados a céntimos.
 * Fechas: `effectiveFrom` es YYYY-MM-DD; `period` es YYYY-MM; los timestamps son ISO.
 */

export const MEMBERSHIP_TIERS = ['full', 'reduced'] as const
export type MembershipTier = (typeof MEMBERSHIP_TIERS)[number]

export const MEMBERSHIP_UNIT_KINDS = ['rancho', 'parcela', 'otra'] as const
export type MembershipUnitKind = (typeof MEMBERSHIP_UNIT_KINDS)[number]

export const MEMBERSHIP_TIER_LABELS: Record<MembershipTier, string> = {
  full: 'Tarifa completa',
  reduced: 'Tarifa reducida',
}

export const MEMBERSHIP_UNIT_KIND_LABELS: Record<MembershipUnitKind, string> = {
  rancho: 'Rancho',
  parcela: 'Parcela',
  otra: 'Otra',
}

/**
 * Conteos que deciden la tarifa de una unidad. Basta uno > 0 para 'full'.
 * Se guardan tal cual en `membership_closing_units.reasons`.
 */
export interface MembershipCounts {
  /** Usuarios con `user.unit_id` = unidad, no baneados */
  owners: number
  /** Conserjes: filas de staff activas con usuario (`staff.user_id`) en la unidad */
  concierges: number
  /** Personal del edificio con QR propio (`staff.qr_token`), activo, sin usuario */
  buildingStaff: number
  /** Miembros del hogar activos con pase activo */
  members: number
  /** Personal de servicio de la unidad activo con pase activo */
  serviceStaff: number
  /** Vehículos con pase de residente activo */
  vehicles: number
  /** Usuarios con pase de residente activo en la unidad */
  residentPasses: number
}

/** Tarifas aplicadas a un cálculo (vigentes o instantánea de un cierre). */
export interface MembershipRates {
  fullRate: number
  reducedRate: number
  currency: string
}

/** Fila del historial de tarifas (GET /api/admin/membership/rates). */
export interface MembershipRate extends MembershipRates {
  id: string
  /** YYYY-MM-DD, siempre día 01 */
  effectiveFrom: string
  notes: string | null
  createdById: string | null
  createdByName: string | null
  createdAt: string
}

/**
 * Cómo se eligió la tarifa del resumen en vivo:
 * - current: vigente hoy
 * - upcoming: aún no hay tarifa vigente; se usa la próxima programada
 * - none: no hay ninguna tarifa (importes en null)
 */
export const MEMBERSHIP_RATE_STATUSES = ['current', 'upcoming', 'none'] as const
export type MembershipRateStatus = (typeof MEMBERSHIP_RATE_STATUSES)[number]

/** Unidad con su clasificación en vivo (GET /api/admin/membership/units). */
export interface MembershipUnit {
  unitId: string
  number: string
  label: string | null
  kind: MembershipUnitKind
  isActive: boolean
  tier: MembershipTier
  /** Importe mensual de la unidad; null si no hay tarifa */
  rate: number | null
  counts: MembershipCounts
  /** Texto legible del motivo, p. ej. "1 usuario · 2 vehículos"; "Sin personas ni vehículos" si no hay nada */
  reasons: string
  /** Contexto (no afecta al precio): entradas contabilizadas en los últimos 30 días */
  accesses30d: number
  /** Contexto: número de movimientos financieros de la unidad */
  financialMovements: number
  /** Contexto: saldo (abonos - cargos), misma fórmula que el estado de cuenta */
  balance: number
}

export interface MembershipTierTotal {
  units: number
  /** null si no hay tarifa */
  amount: number | null
}

export interface MembershipKindTotal {
  units: number
  amount: number | null
  byTier: Record<MembershipTier, number>
}

/** Totales calculados sobre una lista de unidades (pura, ver shared/lib/membership). */
export interface MembershipTotals {
  totalUnits: number
  byTier: Record<MembershipTier, MembershipTierTotal>
  byKind: Record<MembershipUnitKind, MembershipKindTotal>
  /** Total mensual; null si no hay tarifa */
  total: number | null
}

/** Resumen de un cierre (lista de cierres). */
export interface MembershipClosing {
  id: string
  /** YYYY-MM */
  period: string
  fullRate: number
  reducedRate: number
  currency: string
  unitsFull: number
  unitsReduced: number
  total: number
  closedAt: string
  /** null = cierre automático */
  closedById: string | null
  closedByName: string | null
  isAutomatic: boolean
  createdAt: string
}

/** Unidad dentro de un cierre (instantánea, no cambia con los datos vivos). */
export interface MembershipClosingUnit {
  unitId: string
  unitNumber: string
  unitLabel: string | null
  unitKind: MembershipUnitKind
  isActive: boolean
  tier: MembershipTier
  rate: number
  counts: MembershipCounts
  reasons: string
}

/** GET /api/admin/membership/closings/:period */
export interface MembershipClosingDetail {
  closing: MembershipClosing
  totals: MembershipTotals
  units: MembershipClosingUnit[]
}

/** GET /api/admin/membership */
export interface MembershipSummary {
  /** Mes en curso en la zona del condominio, YYYY-MM */
  period: string
  /** Tarifa usada para los importes en vivo (ver `rateStatus`) */
  rate: MembershipRate | null
  rateStatus: MembershipRateStatus
  totals: MembershipTotals
  /** Unidades DEMO excluidas del cobro */
  excludedDemoUnits: number
  /** Último cierre guardado, si existe */
  lastClosing: MembershipClosing | null
  /** true si quien consulta puede editar tarifas y cerrar meses */
  isSuperAdmin: boolean
}

/** Filtros de GET /api/admin/membership/units */
export interface MembershipUnitsQuery {
  tier?: MembershipTier
  kind?: MembershipUnitKind
  /** 'true' | 'false' en la query string */
  active?: boolean
  search?: string
  page?: number
  limit?: number
}

/** Body de POST /api/admin/membership/rates */
export interface MembershipRateInput {
  fullRate: number
  reducedRate: number
  currency?: string
  /** YYYY-MM-DD, debe ser día 01 */
  effectiveFrom: string
  notes?: string | null
}

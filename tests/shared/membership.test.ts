import { describe, it, expect } from 'vitest'
import {
  EMPTY_MEMBERSHIP_COUNTS,
  MEMBERSHIP_NO_REASONS_LABEL,
  classifyUnit,
  filterMembershipUnits,
  isBillableUnit,
  isPeriod,
  membershipRateInputSchema,
  membershipUnitsQuerySchema,
  nextRateAfter,
  normalizeCounts,
  rateEffectiveOn,
  rateFor,
  rateForPeriod,
  reasonsLabel,
  summarize,
  unitKind,
} from '~~/shared/lib/membership'
import type { MembershipCounts, MembershipTier, MembershipUnitKind } from '~~/shared/types/membership'

const counts = (partial: Partial<MembershipCounts> = {}): MembershipCounts => ({ ...EMPTY_MEMBERSHIP_COUNTS, ...partial })
const RATES = { fullRate: 4.5, reducedRate: 2 }

describe('unitKind', () => {
  it('decide por el prefijo R- o P-', () => {
    expect(unitKind('R-001')).toBe('rancho')
    expect(unitKind('P-034')).toBe('parcela')
    expect(unitKind('p-012')).toBe('parcela')
  })
  it('sin prefijo conocido es "otra"', () => {
    expect(unitKind('DEMO')).toBe('otra')
    expect(unitKind('X-1')).toBe('otra')
    expect(unitKind('-1')).toBe('otra')
  })
})

describe('isBillableUnit', () => {
  it('excluye DEMO por número o nombre, sin importar mayúsculas', () => {
    expect(isBillableUnit('R-DEMO', null)).toBe(false)
    expect(isBillableUnit('R-999', 'Rancho Demo')).toBe(false)
    expect(isBillableUnit('demo-1', 'x')).toBe(false)
  })
  it('las demás se cobran', () => {
    expect(isBillableUnit('R-001', 'Rancho 1')).toBe(true)
    expect(isBillableUnit('P-012', null)).toBe(true)
  })
})

describe('classifyUnit', () => {
  it('parcela sin nada → reducida', () => {
    expect(classifyUnit(counts())).toBe('reduced')
  })
  it('parcela solo con vehículo → completa', () => {
    expect(classifyUnit(counts({ vehicles: 1 }))).toBe('full')
  })
  it('unidad inactiva con usuario → completa (la regla no mira el estado)', () => {
    expect(classifyUnit(counts({ owners: 1 }))).toBe('full')
  })
  it('cualquier conteo > 0 basta', () => {
    for (const key of Object.keys(EMPTY_MEMBERSHIP_COUNTS) as Array<keyof MembershipCounts>) {
      expect(classifyUnit(counts({ [key]: 1 }))).toBe('full')
    }
  })
})

describe('normalizeCounts', () => {
  it('convierte null, strings y negativos', () => {
    expect(normalizeCounts({ owners: '2', vehicles: null, members: -1 })).toEqual(counts({ owners: 2 }))
    expect(normalizeCounts(null)).toEqual(counts())
  })
})

describe('reasonsLabel', () => {
  it('genera el texto con singular y plural', () => {
    expect(reasonsLabel(counts({ owners: 1, vehicles: 10, buildingStaff: 1, serviceStaff: 2 })))
      .toBe('1 usuario · 10 vehículos · 3 personal')
    expect(reasonsLabel(counts({ members: 2, residentPasses: 1 }))).toBe('2 miembros · 1 pase de residente')
  })
  it('sin nada devuelve el texto vacío', () => {
    expect(reasonsLabel(counts())).toBe(MEMBERSHIP_NO_REASONS_LABEL)
  })
})

describe('rateFor', () => {
  it('devuelve la tarifa de cada nivel', () => {
    expect(rateFor('full', RATES)).toBe(4.5)
    expect(rateFor('reduced', RATES)).toBe(2)
  })
})

describe('summarize', () => {
  const units: Array<{ kind: MembershipUnitKind; tier: MembershipTier }> = [
    { kind: 'rancho', tier: 'full' },
    { kind: 'rancho', tier: 'full' },
    { kind: 'rancho', tier: 'reduced' },
    { kind: 'parcela', tier: 'full' },
    { kind: 'parcela', tier: 'reduced' },
    { kind: 'parcela', tier: 'reduced' },
  ]

  it('suma por tarifa, por tipo y tipo×tarifa', () => {
    const totals = summarize(units, RATES)
    expect(totals.totalUnits).toBe(6)
    expect(totals.byTier).toEqual({ full: { units: 3, amount: 13.5 }, reduced: { units: 3, amount: 6 } })
    expect(totals.byKind.rancho).toEqual({ units: 3, amount: 11, byTier: { full: 2, reduced: 1 } })
    expect(totals.byKind.parcela).toEqual({ units: 3, amount: 8.5, byTier: { full: 1, reduced: 2 } })
    expect(totals.byKind.otra).toEqual({ units: 0, amount: 0, byTier: { full: 0, reduced: 0 } })
    expect(totals.total).toBe(19.5)
  })

  it('el total cuadra con la suma por unidad sin errores de coma flotante', () => {
    const many = Array.from({ length: 78 }, () => ({ kind: 'rancho' as const, tier: 'full' as const }))
      .concat(Array.from({ length: 39 }, () => ({ kind: 'parcela' as const, tier: 'reduced' as const })))
    const totals = summarize(many, { fullRate: 4.5, reducedRate: 2 })
    expect(totals.total).toBe(429)
    expect(summarize([{ kind: 'rancho', tier: 'full' }, { kind: 'rancho', tier: 'full' }, { kind: 'rancho', tier: 'full' }], { fullRate: 0.1, reducedRate: 0 }).total).toBe(0.3)
  })

  it('sin tarifa cuenta unidades con importes en null', () => {
    const totals = summarize(units, null)
    expect(totals.total).toBeNull()
    expect(totals.byTier.full).toEqual({ units: 3, amount: null })
    expect(totals.byKind.parcela.amount).toBeNull()
  })
})

describe('vigencia de tarifas', () => {
  const history = [
    { id: 'c', effectiveFrom: '2027-03-01', fullRate: 5, reducedRate: 2.5 },
    { id: 'b', effectiveFrom: '2026-10-01', fullRate: 4.5, reducedRate: 2 },
    { id: 'a', effectiveFrom: '2026-01-01', fullRate: 4, reducedRate: 1.5 },
  ]

  it('cambio de tarifa a mitad de historial: cada mes usa la vigente en su día 01', () => {
    expect(rateForPeriod(history, '2026-09')?.id).toBe('a')
    expect(rateForPeriod(history, '2026-10')?.id).toBe('b')
    expect(rateForPeriod(history, '2027-02')?.id).toBe('b')
    expect(rateForPeriod(history, '2027-03')?.id).toBe('c')
    expect(rateForPeriod(history, '2025-12')).toBeNull()
  })

  it('en empate de fecha gana la primera de la lista (la más reciente)', () => {
    const dup = [
      { id: 'new', effectiveFrom: '2026-10-01' },
      { id: 'old', effectiveFrom: '2026-10-01' },
    ]
    expect(rateEffectiveOn(dup, '2026-10-15')?.id).toBe('new')
  })

  it('próxima tarifa programada', () => {
    expect(nextRateAfter(history, '2026-09-24')?.id).toBe('b')
    expect(nextRateAfter(history, '2027-03-01')).toBeNull()
  })
})

describe('isPeriod', () => {
  it('valida YYYY-MM', () => {
    expect(isPeriod('2026-10')).toBe(true)
    expect(isPeriod('2026-13')).toBe(false)
    expect(isPeriod('2026-1')).toBe(false)
  })
})

describe('filterMembershipUnits', () => {
  const list = [
    { number: 'R-001', label: 'Rancho Él', kind: 'rancho' as const, tier: 'full' as const, isActive: true },
    { number: 'P-012', label: null, kind: 'parcela' as const, tier: 'full' as const, isActive: false },
    { number: 'P-013', label: null, kind: 'parcela' as const, tier: 'reduced' as const, isActive: true },
  ]
  it('filtra por tarifa, tipo, estado y búsqueda sin acentos', () => {
    expect(filterMembershipUnits(list, { tier: 'reduced' }).map(u => u.number)).toEqual(['P-013'])
    expect(filterMembershipUnits(list, { kind: 'parcela', active: false }).map(u => u.number)).toEqual(['P-012'])
    expect(filterMembershipUnits(list, { search: 'rancho el' }).map(u => u.number)).toEqual(['R-001'])
    expect(filterMembershipUnits(list, {})).toHaveLength(3)
  })
})

describe('schemas', () => {
  it('units query: defaults y active como booleano', () => {
    const parsed = membershipUnitsQuerySchema.parse({ active: 'false', tier: 'full' })
    expect(parsed).toMatchObject({ page: 1, limit: 25, active: false, tier: 'full' })
    expect(membershipUnitsQuerySchema.safeParse({ tier: 'x' }).success).toBe(false)
  })

  it('tarifa: día 01, 2 decimales y reducida ≤ completa', () => {
    expect(membershipRateInputSchema.parse({ fullRate: '4.5', reducedRate: 2, effectiveFrom: '2026-11-01' }))
      .toEqual({ fullRate: 4.5, reducedRate: 2, currency: 'USD', effectiveFrom: '2026-11-01', notes: null })
    expect(membershipRateInputSchema.safeParse({ fullRate: 4.5, reducedRate: 2, effectiveFrom: '2026-11-15' }).success).toBe(false)
    expect(membershipRateInputSchema.safeParse({ fullRate: 4.555, reducedRate: 2, effectiveFrom: '2026-11-01' }).success).toBe(false)
    expect(membershipRateInputSchema.safeParse({ fullRate: 2, reducedRate: 4.5, effectiveFrom: '2026-11-01' }).success).toBe(false)
  })
})

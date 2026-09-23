import { describe, it, expect } from 'vitest'
import {
  buildMergedDescription,
  buildTargetAppliesUpdate,
  findServiceRoleMergeProblem,
  mergedIntoLabel,
  serviceRoleMergeBodySchema,
  type ServiceRoleMergeCandidate,
} from '~~/server/utils/service-role-merge-rules'

const TENANT = '11111111-1111-4111-8111-111111111111'
const SOURCE_ID = '22222222-2222-4222-8222-222222222222'
const TARGET_ID = '33333333-3333-4333-8333-333333333333'

function role(overrides: Partial<ServiceRoleMergeCandidate> = {}): ServiceRoleMergeCandidate {
  return {
    id: SOURCE_ID,
    name: 'Gas Recarga',
    description: null,
    isActive: true,
    appliesToStaff: false,
    appliesToProviders: true,
    tenantId: TENANT,
    ...overrides,
  }
}

describe('serviceRoleMergeBodySchema', () => {
  it('acepta un targetId uuid', () => {
    expect(serviceRoleMergeBodySchema.safeParse({ targetId: TARGET_ID }).success).toBe(true)
  })

  it('rechaza targetId que no es uuid', () => {
    const r = serviceRoleMergeBodySchema.safeParse({ targetId: 'recarga-gas' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0]?.message).toBe('El rol destino no es válido')
  })

  it('rechaza body vacío o sin targetId', () => {
    expect(serviceRoleMergeBodySchema.safeParse({}).success).toBe(false)
    expect(serviceRoleMergeBodySchema.safeParse(undefined).success).toBe(false)
  })
})

describe('findServiceRoleMergeProblem', () => {
  const source = role()
  const target = role({ id: TARGET_ID, name: 'Recarga Gas' })

  it('devuelve null si la fusión es válida', () => {
    expect(findServiceRoleMergeProblem(SOURCE_ID, TARGET_ID, source, target)).toBeNull()
  })

  it('rechaza origen y destino iguales', () => {
    expect(findServiceRoleMergeProblem(SOURCE_ID, SOURCE_ID, source, source)?.statusCode).toBe(400)
  })

  it('404 si falta el origen o el destino', () => {
    expect(findServiceRoleMergeProblem(SOURCE_ID, TARGET_ID, undefined, target)?.statusCode).toBe(404)
    expect(findServiceRoleMergeProblem(SOURCE_ID, TARGET_ID, source, undefined)?.statusCode).toBe(404)
  })

  it('rechaza roles de distinto tenant', () => {
    const other = role({ id: TARGET_ID, tenantId: '44444444-4444-4444-8444-444444444444' })
    expect(findServiceRoleMergeProblem(SOURCE_ID, TARGET_ID, source, other)?.statusCode).toBe(400)
  })

  it('rechaza un destino inactivo', () => {
    const inactive = role({ id: TARGET_ID, isActive: false })
    expect(findServiceRoleMergeProblem(SOURCE_ID, TARGET_ID, source, inactive)?.message).toMatch(/inactivo/)
  })

  it('permite un origen ya inactivo (re-fusión de restos)', () => {
    expect(findServiceRoleMergeProblem(SOURCE_ID, TARGET_ID, role({ isActive: false }), target)).toBeNull()
  })
})

describe('buildMergedDescription', () => {
  it('sin descripción previa deja solo la marca', () => {
    expect(buildMergedDescription(null, 'Recarga Gas')).toBe('Fusionado en Recarga Gas')
    expect(buildMergedDescription('   ', 'Recarga Gas')).toBe('Fusionado en Recarga Gas')
  })

  it('conserva la descripción anterior concatenada', () => {
    expect(buildMergedDescription('Bombonas a domicilio', 'Recarga Gas'))
      .toBe('Fusionado en Recarga Gas. Bombonas a domicilio')
  })

  it('no repite la marca si ya se fusionó en el mismo destino', () => {
    const once = buildMergedDescription('Bombonas', 'Recarga Gas')
    expect(buildMergedDescription(once, 'Recarga Gas')).toBe(once)
  })

  it('recorta espacios del nombre destino', () => {
    expect(mergedIntoLabel('  Venta Repuesto Moto ')).toBe('Fusionado en Venta Repuesto Moto')
  })
})

describe('buildTargetAppliesUpdate', () => {
  it('no cambia nada si el destino ya cubre al origen', () => {
    expect(buildTargetAppliesUpdate(
      { appliesToStaff: true, appliesToProviders: true },
      { appliesToStaff: true, appliesToProviders: true },
    )).toEqual({})
  })

  it('enciende los flags que el origen tiene y el destino no', () => {
    expect(buildTargetAppliesUpdate(
      { appliesToStaff: true, appliesToProviders: true },
      { appliesToStaff: false, appliesToProviders: false },
    )).toEqual({ appliesToStaff: true, appliesToProviders: true })
  })

  it('nunca apaga flags del destino', () => {
    expect(buildTargetAppliesUpdate(
      { appliesToStaff: false, appliesToProviders: false },
      { appliesToStaff: true, appliesToProviders: false },
    )).toEqual({})
  })

  it('enciende el flag si se movieron filas aunque el origen lo tuviera apagado', () => {
    expect(buildTargetAppliesUpdate(
      { appliesToStaff: false, appliesToProviders: false },
      { appliesToStaff: false, appliesToProviders: false },
      { providers: 2, staffRows: 1 },
    )).toEqual({ appliesToStaff: true, appliesToProviders: true })
  })
})

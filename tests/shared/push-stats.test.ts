import { describe, it, expect } from 'vitest'
import {
  buildPushStats,
  isExpiredSubscriptionStatus,
  pushPercentage,
  pushStatsUsersQuerySchema,
  PUSH_STATS_USERS_DEFAULT_LIMIT,
  PUSH_STATS_USERS_MAX_LIMIT,
} from '~~/shared/lib/push-stats'

describe('pushPercentage', () => {
  it('redondea a un decimal', () => {
    expect(pushPercentage(1, 3)).toBe(33.3)
    expect(pushPercentage(2, 3)).toBe(66.7)
    expect(pushPercentage(43, 86)).toBe(50)
  })

  it('devuelve 0 sin base o sin parte', () => {
    expect(pushPercentage(0, 0)).toBe(0)
    expect(pushPercentage(5, 0)).toBe(0)
    expect(pushPercentage(0, 10)).toBe(0)
  })

  it('nunca supera 100', () => {
    expect(pushPercentage(12, 10)).toBe(100)
  })
})

describe('buildPushStats', () => {
  it('suma el resumen y devuelve los 4 roles en orden fijo', () => {
    const stats = buildPushStats([
      { role: 'propietario', users: 80, withPush: 20, chatDisabled: 3, devices: 25 },
      { role: 'admin', users: 2, withPush: 2, chatDisabled: 0, devices: 3 },
    ])
    expect(stats.summary).toEqual({ totalUsers: 82, usersWithPush: 22, percentage: 26.8, totalDevices: 28 })
    expect(stats.byRole.map(r => r.role)).toEqual(['admin', 'propietario', 'conserje', 'vigilancia'])
    expect(stats.byRole[2]).toEqual({ role: 'conserje', users: 0, withPush: 0, chatDisabled: 0, devices: 0 })
  })

  it('cuenta el rol null como propietario', () => {
    const stats = buildPushStats([
      { role: 'propietario', users: 1, withPush: 1, chatDisabled: 0, devices: 1 },
      { role: null, users: 2, withPush: 0, chatDisabled: 0, devices: 0 },
    ])
    expect(stats.byRole.find(r => r.role === 'propietario')?.users).toBe(3)
  })

  it('incluye roles desconocidos en el resumen pero no en byRole', () => {
    const stats = buildPushStats([{ role: 'otro', users: 4, withPush: 1, chatDisabled: 0, devices: 2 }])
    expect(stats.summary.totalUsers).toBe(4)
    expect(stats.byRole.every(r => r.users === 0)).toBe(true)
  })

  it('tolera agregados que llegan como string desde SQL', () => {
    const stats = buildPushStats([
      { role: 'vigilancia', users: '3' as unknown as number, withPush: '1' as unknown as number, chatDisabled: 0, devices: '2' as unknown as number },
    ])
    expect(stats.summary).toEqual({ totalUsers: 3, usersWithPush: 1, percentage: 33.3, totalDevices: 2 })
  })

  it('sin filas devuelve ceros', () => {
    const stats = buildPushStats([])
    expect(stats.summary).toEqual({ totalUsers: 0, usersWithPush: 0, percentage: 0, totalDevices: 0 })
    expect(stats.byRole).toHaveLength(4)
  })
})

describe('isExpiredSubscriptionStatus', () => {
  it('marca 404 y 410 como suscripción caducada', () => {
    expect(isExpiredSubscriptionStatus(404)).toBe(true)
    expect(isExpiredSubscriptionStatus(410)).toBe(true)
  })

  it('no borra ante errores transitorios', () => {
    for (const code of [400, 401, 403, 413, 429, 500, 503]) {
      expect(isExpiredSubscriptionStatus(code)).toBe(false)
    }
    expect(isExpiredSubscriptionStatus(undefined)).toBe(false)
  })
})

describe('pushStatsUsersQuerySchema', () => {
  it('aplica defaults: status=without, página 1', () => {
    expect(pushStatsUsersQuerySchema.parse({})).toEqual({
      status: 'without',
      page: 1,
      limit: PUSH_STATS_USERS_DEFAULT_LIMIT,
    })
  })

  it('coacciona page y limit desde query string', () => {
    const parsed = pushStatsUsersQuerySchema.parse({ status: 'with', role: 'conserje', page: '2', limit: '50', search: '  Rancho ' })
    expect(parsed).toEqual({ status: 'with', role: 'conserje', page: 2, limit: 50, search: 'Rancho' })
  })

  it('rechaza valores inválidos', () => {
    expect(pushStatsUsersQuerySchema.safeParse({ status: 'x' }).success).toBe(false)
    expect(pushStatsUsersQuerySchema.safeParse({ role: 'superadmin' }).success).toBe(false)
    expect(pushStatsUsersQuerySchema.safeParse({ limit: PUSH_STATS_USERS_MAX_LIMIT + 1 }).success).toBe(false)
    expect(pushStatsUsersQuerySchema.safeParse({ page: 0 }).success).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'
import {
  isIosDevice,
  isSnoozeActive,
  resolvePushPromptState,
} from '~/composables/usePushPrompt'
import type { PushPromptInput } from '~/composables/usePushPrompt'

function input(overrides: Partial<PushPromptInput> = {}): PushPromptInput {
  return {
    ready: true,
    isSupported: true,
    permission: 'default',
    isSubscribed: false,
    isIos: false,
    isStandalone: false,
    snoozed: false,
    ...overrides,
  }
}

describe('resolvePushPromptState', () => {
  it('oculto mientras no termina la comprobación inicial', () => {
    expect(resolvePushPromptState(input({ ready: false }))).toBe('hidden')
  })

  it('oculto si ya hay suscripción o está pospuesto', () => {
    expect(resolvePushPromptState(input({ isSubscribed: true }))).toBe('hidden')
    expect(resolvePushPromptState(input({ snoozed: true }))).toBe('hidden')
  })

  it('pide activar con permiso default o granted sin suscripción', () => {
    expect(resolvePushPromptState(input())).toBe('enable')
    expect(resolvePushPromptState(input({ permission: 'granted' }))).toBe('enable')
  })

  it('muestra bloqueadas con permiso denied', () => {
    expect(resolvePushPromptState(input({ permission: 'denied' }))).toBe('denied')
  })

  it('iOS sin instalar pide instalar aunque no haya PushManager', () => {
    expect(resolvePushPromptState(input({ isIos: true, isSupported: false }))).toBe('ios-install')
  })

  it('iOS instalado se comporta como cualquier navegador compatible', () => {
    expect(resolvePushPromptState(input({ isIos: true, isStandalone: true }))).toBe('enable')
  })

  it('no soportado y no iOS: nada', () => {
    expect(resolvePushPromptState(input({ isSupported: false }))).toBe('hidden')
  })
})

describe('isIosDevice', () => {
  it('detecta iPhone e iPad con iPadOS de escritorio', () => {
    expect(isIosDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', 'iPhone', 5)).toBe(true)
    expect(isIosDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'MacIntel', 5)).toBe(true)
  })

  it('no confunde un Mac ni Android', () => {
    expect(isIosDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'MacIntel', 0)).toBe(false)
    expect(isIosDevice('Mozilla/5.0 (Linux; Android 14)', 'Linux armv8l', 5)).toBe(false)
  })
})

describe('isSnoozeActive', () => {
  const now = 1_700_000_000_000
  it('activo solo si la fecha guardada es futura y válida', () => {
    expect(isSnoozeActive(String(now + 1000), now)).toBe(true)
    expect(isSnoozeActive(String(now - 1000), now)).toBe(false)
    expect(isSnoozeActive(null, now)).toBe(false)
    expect(isSnoozeActive('basura', now)).toBe(false)
  })
})

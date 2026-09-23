import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * sendPushToUser → sendPushToSubscriptions: ante 404/410 del servicio de push
 * se borra la suscripción por endpoint; ante otros errores no se toca.
 */
const { sendNotification, deleteWhere, selectRows } = vi.hoisted(() => ({
  sendNotification: vi.fn(),
  deleteWhere: vi.fn(),
  selectRows: { value: [] as Array<Record<string, unknown>> },
}))

vi.mock('web-push', () => {
  class WebPushError extends Error {
    constructor(message: string, public statusCode: number) {
      super(message)
    }
  }
  return {
    default: { setVapidDetails: vi.fn(), sendNotification, WebPushError },
  }
})

vi.mock('~~/server/db', () => ({
  db: {
    select: () => ({ from: () => ({ where: async () => selectRows.value }) }),
    delete: () => ({ where: deleteWhere }),
  },
}))

const webpush = (await import('web-push')).default as unknown as {
  WebPushError: new (message: string, statusCode: number) => Error
}
const { sendPushToUser } = await import('~~/server/utils/web-push')

function sub(id: string, endpoint: string) {
  return { id, userId: 'u1', endpoint, p256dh: 'k', auth: 'a', role: 'propietario', tenantId: 't', createdAt: new Date() }
}

describe('limpieza de suscripciones caducadas', () => {
  beforeEach(() => {
    sendNotification.mockReset()
    deleteWhere.mockReset()
  })

  it.each([404, 410])('borra la suscripción cuando el servicio responde %i', async (status) => {
    selectRows.value = [sub('s1', 'https://push.example/gone')]
    sendNotification.mockRejectedValueOnce(new webpush.WebPushError('gone', status))

    const result = await sendPushToUser('u1', { title: 't', body: 'b' })

    expect(result).toEqual({ sent: 0, failed: 1, total: 1 })
    expect(deleteWhere).toHaveBeenCalledTimes(1)
  })

  it('no borra ante errores transitorios (429, 500)', async () => {
    selectRows.value = [sub('s1', 'https://push.example/a'), sub('s2', 'https://push.example/b')]
    sendNotification
      .mockRejectedValueOnce(new webpush.WebPushError('rate', 429))
      .mockRejectedValueOnce(new webpush.WebPushError('boom', 500))

    const result = await sendPushToUser('u1', { title: 't', body: 'b' })

    expect(result).toEqual({ sent: 0, failed: 2, total: 2 })
    expect(deleteWhere).not.toHaveBeenCalled()
  })

  it('un fallo al borrar no tumba el envío del resto', async () => {
    selectRows.value = [sub('s1', 'https://push.example/gone'), sub('s2', 'https://push.example/ok')]
    sendNotification
      .mockRejectedValueOnce(new webpush.WebPushError('gone', 410))
      .mockResolvedValueOnce({})
    deleteWhere.mockRejectedValueOnce(new Error('db down'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = await sendPushToUser('u1', { title: 't', body: 'b' })

    expect(result).toEqual({ sent: 1, failed: 1, total: 2 })
    consoleSpy.mockRestore()
  })
})

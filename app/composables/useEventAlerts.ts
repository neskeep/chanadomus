import { toast } from 'vue-sonner'
import type { EventSummary } from '~~/shared/types/event'
import { isUpcomingOrOngoing } from '~~/shared/lib/event-window'

/**
 * Avisos de eventos (visual + sonoro suave) para admin y vigilancia.
 *
 * - admin: sondea el conteo de eventos "pendiente" por validar. Al aumentar,
 *   suena un chime y muestra un toast descartable. Alimenta un badge persistente.
 * - vigilancia: sondea los eventos activos de hoy (lo que dispara ademas el push
 *   "el dia del evento" en el servidor). Al aparecer un evento nuevo, chime + toast.
 *
 * Estado singleton a nivel de modulo (compartido entre componentes), patron igual
 * a usePanicStream. Sondeo por intervalo + refresco al volver a la pestana.
 */
const POLL_INTERVAL = 45000

const pendingCount = ref(0) // admin: eventos por validar
const todayCount = ref(0) // vigilancia: eventos de hoy
const _initialized = ref(false)

let pollTimer: ReturnType<typeof setInterval> | null = null
let _role: string | null = null
let _prevPending = -1 // -1 = sin baseline aun (evita chime en la primera carga)
let _vigilanceSeeded = false
const _seenTodayIds = new Set<string>()

async function pollAdmin() {
  try {
    const { count } = await $fetch<{ count: number }>('/api/events/pending-count')
    if (_prevPending !== -1 && count > _prevPending) {
      useAlertSound().playChime()
      toast.info('Nuevo evento por validar', {
        description: 'Un residente solicito aprobacion de un evento.',
      })
    }
    _prevPending = count
    pendingCount.value = count
  }
  catch {
    // silencioso: el badge conserva su ultimo valor conocido
  }
}

async function pollVigilance() {
  try {
    const { data: visible } = await $fetch<{ data: EventSummary[] }>('/api/events/active')
    // /api/events/active incluye eventos ya terminados con invitados dentro (para
    // registrar salidas). El aviso "eventos hoy" solo cuenta los del dia local que
    // aun no han terminado (el servidor ya filtra por dia local del condominio).
    const now = new Date()
    const data = visible.filter(e => isUpcomingOrOngoing(e, now))
    todayCount.value = data.length
    if (_vigilanceSeeded) {
      const nuevos = data.filter(e => !_seenTodayIds.has(e.id))
      if (nuevos.length > 0) {
        useAlertSound().playChime()
        toast.info('Evento hoy', { description: nuevos[0]!.title })
      }
    }
    data.forEach(e => _seenTodayIds.add(e.id))
    _vigilanceSeeded = true
  }
  catch {
    // silencioso: el badge conserva su ultimo valor conocido
  }
}

function pollOnce() {
  if (_role === 'admin') void pollAdmin()
  else if (_role === 'vigilancia') void pollVigilance()
}

function startPolling() {
  if (pollTimer) return
  pollOnce()
  pollTimer = setInterval(pollOnce, POLL_INTERVAL)
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') pollOnce()
    })
  }
}

export function useEventAlerts() {
  if (!_initialized.value && !import.meta.server) {
    const { role } = useAuth()
    const begin = (r: string | null | undefined) => {
      if (r === 'admin' || r === 'vigilancia') {
        _role = r
        _initialized.value = true
        startPolling()
      }
    }
    if (role.value) {
      begin(role.value)
    }
    else {
      const stop = watch(role, (nr) => {
        if (nr === 'admin' || nr === 'vigilancia') {
          begin(nr)
          stop()
        }
      })
    }
  }

  const badgeCount = computed(() => (_role === 'admin' ? pendingCount.value : todayCount.value))

  return { pendingCount, todayCount, badgeCount }
}

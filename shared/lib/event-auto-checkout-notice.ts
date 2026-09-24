/**
 * Aviso al propietario cuando el cierre automatico registra la salida de sus invitados.
 *
 * Contexto: autoCheckoutStaleGuests (server/utils/event-checkout.ts) marca como 'salio'
 * a los invitados que siguen 'dentro' 24 h despues del fin del evento. El responsable
 * del evento recibe un solo aviso por evento y por cierre, con el total de invitados.
 *
 * Funciones puras (sin Nuxt/Nitro/DB): se testean con vitest.
 */

/** Rol que recibe el aviso: solo propietarios ven /propietario/eventos/:id de su unidad. */
const OWNER_ROLE = 'propietario'

export interface AutoCheckoutNotice {
  title: string
  body: string
  url: string
  /** Tag del SO por evento: un aviso de otro evento no reemplaza a este. */
  tag: string
}

export interface AutoCheckoutEventInfo {
  eventId: string
  eventTitle: string
  guestCount: number
}

export interface AutoCheckoutRecipientCandidate {
  id: string
  role: string | null
  unitId: string | null
  banned: boolean | null
}

/**
 * Cuenta los invitados cerrados por evento a partir de las filas devueltas por el UPDATE.
 * Solo se cuentan filas que cambiaron realmente, asi que dos cierres en paralelo no
 * duplican el aviso: el que no cerro nada no tiene filas.
 */
export function countClosedGuestsByEvent(rows: ReadonlyArray<{ eventId: string }>): Map<string, number> {
  const counts = new Map<string, number>()
  for (const row of rows) {
    counts.set(row.eventId, (counts.get(row.eventId) ?? 0) + 1)
  }
  return counts
}

/** Texto del aviso, con singular/plural correcto. */
export function buildAutoCheckoutNotice(info: AutoCheckoutEventInfo): AutoCheckoutNotice {
  const guests = info.guestCount === 1 ? '1 invitado' : `${info.guestCount} invitados`
  const verb = info.guestCount === 1 ? 'seguía' : 'seguían'
  return {
    title: 'Salida registrada automáticamente',
    body: `Registramos la salida de ${guests} de «${info.eventTitle}» que ${verb} dentro 24 horas después de terminar el evento.`,
    url: `/propietario/eventos/${info.eventId}`,
    tag: `event-auto-checkout-${info.eventId}`,
  }
}

function isActiveOwnerOfUnit(candidate: AutoCheckoutRecipientCandidate, unitId: string): boolean {
  return candidate.role === OWNER_ROLE && candidate.unitId === unitId && !candidate.banned
}

/**
 * Destinatarios del aviso de un evento.
 *
 * - Si lo creo un propietario de la unidad del evento (y sigue activo), solo el: es
 *   quien organizo el evento y cargo a los invitados.
 * - Si lo creo otro rol (conserje o admin), o el creador ya no es propietario activo de
 *   esa unidad, se avisa a todos los propietarios activos de la unidad del evento.
 *
 * Siempre propietarios de la unidad: son los unicos que pueden abrir
 * /propietario/eventos/:id de ese evento.
 */
export function pickAutoCheckoutRecipients(input: {
  unitId: string
  creator: AutoCheckoutRecipientCandidate | null
  unitOwners: ReadonlyArray<AutoCheckoutRecipientCandidate>
}): string[] {
  if (input.creator && isActiveOwnerOfUnit(input.creator, input.unitId)) {
    return [input.creator.id]
  }
  const ids = input.unitOwners
    .filter(o => isActiveOwnerOfUnit(o, input.unitId))
    .map(o => o.id)
  return [...new Set(ids)]
}

import { HIDDEN_CHAT_ROOM_TYPES, type ChatRoomType, type HiddenChatRoomType } from '../types/chat'
import type { UserRole } from '../types/auth'

/**
 * Fuente unica de verdad del acceso a salas de chat por rol.
 * La usan rooms.get (listado), ws-chat (WS + REST de mensajes, lectura, upload)
 * y el calculo de destinatarios de push. No duplicar esta matriz en otro sitio.
 */

type GroupRoomType = Exclude<ChatRoomType, 'unit' | 'direct'>

/** Roles con acceso a cada sala de grupo. Las salas ocultas se bloquean aparte. */
const GROUP_ROOM_ROLES: Record<GroupRoomType, readonly UserRole[]> = {
  general: ['admin', 'propietario', 'conserje', 'vigilancia'],
  incidencias: ['admin', 'propietario', 'conserje', 'vigilancia'],
  vigilancia: ['admin', 'vigilancia', 'conserje', 'propietario'],
  conserjeria: ['admin', 'conserje', 'vigilancia', 'propietario'],
  admin: ['admin', 'propietario'],
  propietarios: ['admin', 'propietario'],
}

/** Roles que pueden entrar a cualquier sala de unidad (ademas de los residentes de esa unidad). */
const UNIT_ROOM_ROLES: readonly UserRole[] = ['admin', 'vigilancia']

/** Rol por defecto cuando el usuario no tiene rol asignado (consistente con el resto del server). */
export const DEFAULT_CHAT_ROLE: UserRole = 'propietario'

export interface ChatAccessUser {
  role: string | null | undefined
  unitId: string | null | undefined
}

export interface ChatAccessRoom {
  type: ChatRoomType
  unitId: string | null
}

export function isHiddenChatRoomType(type: string): type is HiddenChatRoomType {
  return (HIDDEN_CHAT_ROOM_TYPES as readonly string[]).includes(type)
}

function isGroupRoomType(type: ChatRoomType): type is GroupRoomType {
  return type !== 'unit' && type !== 'direct'
}

function normalizeRole(role: string | null | undefined): string {
  return role ?? DEFAULT_CHAT_ROLE
}

/**
 * Tipos de sala de grupo que un rol puede ver en su listado. Excluye las ocultas.
 */
export function getVisibleGroupRoomTypes(role: string | null | undefined): GroupRoomType[] {
  const r = normalizeRole(role)
  return (Object.keys(GROUP_ROOM_ROLES) as GroupRoomType[])
    .filter(type => !isHiddenChatRoomType(type))
    .filter(type => (GROUP_ROOM_ROLES[type] as readonly string[]).includes(r))
}

/**
 * Decide si un usuario puede leer/escribir en una sala.
 * Para salas `direct` la membresia no se puede deducir del rol: el caller la
 * resuelve y la pasa en `isDirectMember`.
 */
export function canAccessChatRoom(
  user: ChatAccessUser,
  room: ChatAccessRoom,
  isDirectMember = false,
): boolean {
  if (isHiddenChatRoomType(room.type)) return false

  const role = normalizeRole(user.role)

  if (room.type === 'direct') return isDirectMember

  if (room.type === 'unit') {
    if ((UNIT_ROOM_ROLES as readonly string[]).includes(role)) return true
    return !!user.unitId && user.unitId === room.unitId
  }

  if (isGroupRoomType(room.type)) {
    return (GROUP_ROOM_ROLES[room.type] as readonly string[]).includes(role)
  }

  return false
}

export interface ChatPushCandidate extends ChatAccessUser {
  id: string
  banned?: boolean | null
}

export interface ChatPushRecipientInput {
  room: ChatAccessRoom
  /** Usuarios del tenant (sala de grupo/unidad) o miembros de la sala (direct). */
  candidates: readonly ChatPushCandidate[]
  senderId: string
  /** Usuarios con la sala abierta y visible en este momento (presencia WS). */
  viewingUserIds: ReadonlySet<string>
  /** Solo para `direct`: ids de los miembros de la sala. */
  directMemberIds?: ReadonlySet<string>
}

/**
 * Destinatarios del push de un mensaje de chat: todos los que tienen acceso a la
 * sala, menos el autor, los baneados y quien esta viendo la sala ahora mismo.
 * El filtro por preferencia `chat` lo aplica despues sendPushToUsers.
 */
export function computeChatPushRecipients(input: ChatPushRecipientInput): string[] {
  const { room, candidates, senderId, viewingUserIds, directMemberIds } = input
  const ids = new Set<string>()
  for (const c of candidates) {
    if (c.id === senderId) continue
    if (c.banned) continue
    if (viewingUserIds.has(c.id)) continue
    const isMember = directMemberIds?.has(c.id) ?? false
    if (!canAccessChatRoom(c, room, isMember)) continue
    ids.add(c.id)
  }
  return [...ids]
}

import { describe, it, expect } from 'vitest'
import {
  canAccessChatRoom,
  computeChatPushRecipients,
  getVisibleGroupRoomTypes,
  isHiddenChatRoomType,
  type ChatPushCandidate,
} from '~~/shared/lib/chat-access'
import { HIDDEN_CHAT_ROOM_TYPES, type ChatRoomType } from '~~/shared/types/chat'
import { USER_ROLES, type UserRole } from '~~/shared/types/auth'

type GroupType = Exclude<ChatRoomType, 'unit' | 'direct'>

// Matriz esperada (ticket e8415ba2): general e incidencias ocultas para todos.
const EXPECTED: Record<UserRole, Record<GroupType, boolean>> = {
  admin: { general: false, incidencias: false, vigilancia: true, conserjeria: true, admin: true, propietarios: true },
  propietario: { general: false, incidencias: false, vigilancia: true, conserjeria: true, admin: true, propietarios: true },
  conserje: { general: false, incidencias: false, vigilancia: true, conserjeria: true, admin: false, propietarios: false },
  vigilancia: { general: false, incidencias: false, vigilancia: true, conserjeria: true, admin: false, propietarios: false },
}

const GROUP_TYPES = Object.keys(EXPECTED.admin) as GroupType[]

describe('HIDDEN_CHAT_ROOM_TYPES', () => {
  it('oculta general e incidencias', () => {
    expect([...HIDDEN_CHAT_ROOM_TYPES].sort()).toEqual(['general', 'incidencias'])
    expect(isHiddenChatRoomType('general')).toBe(true)
    expect(isHiddenChatRoomType('incidencias')).toBe(true)
    expect(isHiddenChatRoomType('vigilancia')).toBe(false)
  })
})

describe('canAccessChatRoom: salas de grupo', () => {
  for (const role of USER_ROLES) {
    for (const type of GROUP_TYPES) {
      it(`${role} -> ${type} = ${EXPECTED[role][type]}`, () => {
        expect(canAccessChatRoom({ role, unitId: null }, { type, unitId: null })).toBe(EXPECTED[role][type])
      })
    }
  }

  it('sin rol se trata como propietario', () => {
    expect(canAccessChatRoom({ role: null, unitId: null }, { type: 'propietarios', unitId: null })).toBe(true)
    expect(canAccessChatRoom({ role: undefined, unitId: null }, { type: 'general', unitId: null })).toBe(false)
  })

  it('rol desconocido no accede a nada', () => {
    for (const type of GROUP_TYPES) {
      expect(canAccessChatRoom({ role: 'externo', unitId: null }, { type, unitId: null })).toBe(false)
    }
  })
})

describe('canAccessChatRoom: unit y direct', () => {
  const unitRoom = { type: 'unit' as const, unitId: 'u1' }

  it('admin y vigilancia entran a cualquier sala de unidad', () => {
    expect(canAccessChatRoom({ role: 'admin', unitId: null }, unitRoom)).toBe(true)
    expect(canAccessChatRoom({ role: 'vigilancia', unitId: null }, unitRoom)).toBe(true)
  })

  it('residente solo entra a la de su unidad', () => {
    expect(canAccessChatRoom({ role: 'propietario', unitId: 'u1' }, unitRoom)).toBe(true)
    expect(canAccessChatRoom({ role: 'propietario', unitId: 'u2' }, unitRoom)).toBe(false)
    expect(canAccessChatRoom({ role: 'propietario', unitId: null }, unitRoom)).toBe(false)
    expect(canAccessChatRoom({ role: 'conserje', unitId: null }, unitRoom)).toBe(false)
  })

  it('direct depende solo de la membresia', () => {
    for (const role of USER_ROLES) {
      expect(canAccessChatRoom({ role, unitId: null }, { type: 'direct', unitId: null }, true)).toBe(true)
      expect(canAccessChatRoom({ role, unitId: null }, { type: 'direct', unitId: null }, false)).toBe(false)
    }
  })
})

describe('getVisibleGroupRoomTypes', () => {
  it('coincide con la matriz y nunca incluye salas ocultas', () => {
    for (const role of USER_ROLES) {
      const visible = getVisibleGroupRoomTypes(role).sort()
      const expected = GROUP_TYPES.filter(t => EXPECTED[role][t]).sort()
      expect(visible).toEqual(expected)
      for (const hidden of HIDDEN_CHAT_ROOM_TYPES) expect(visible).not.toContain(hidden)
    }
  })
})

describe('computeChatPushRecipients', () => {
  const users: ChatPushCandidate[] = [
    { id: 'admin1', role: 'admin', unitId: null },
    { id: 'prop1', role: 'propietario', unitId: 'u1' },
    { id: 'prop2', role: 'propietario', unitId: 'u2' },
    { id: 'vig1', role: 'vigilancia', unitId: null },
    { id: 'vig2', role: 'vigilancia', unitId: null },
    { id: 'cons1', role: 'conserje', unitId: null },
    { id: 'baneado', role: 'propietario', unitId: 'u3', banned: true },
  ]

  it('Vigilancia: todos con acceso menos autor, baneados y quien ve la sala', () => {
    const r = computeChatPushRecipients({
      room: { type: 'vigilancia', unitId: null },
      candidates: users,
      senderId: 'vig1',
      viewingUserIds: new Set(['prop2']),
    })
    expect(r.sort()).toEqual(['admin1', 'cons1', 'prop1', 'vig2'])
  })

  it('Administración: excluye vigilancia y conserjes', () => {
    const r = computeChatPushRecipients({
      room: { type: 'admin', unitId: null },
      candidates: users,
      senderId: 'prop1',
      viewingUserIds: new Set(),
    })
    expect(r.sort()).toEqual(['admin1', 'prop2'])
  })

  it('salas ocultas no notifican a nadie', () => {
    for (const type of HIDDEN_CHAT_ROOM_TYPES) {
      const r = computeChatPushRecipients({
        room: { type, unitId: null },
        candidates: users,
        senderId: 'admin1',
        viewingUserIds: new Set(),
      })
      expect(r).toEqual([])
    }
  })

  it('unit: solo residentes de la unidad, admin y vigilancia', () => {
    const r = computeChatPushRecipients({
      room: { type: 'unit', unitId: 'u1' },
      candidates: users,
      senderId: 'vig1',
      viewingUserIds: new Set(),
    })
    expect(r.sort()).toEqual(['admin1', 'prop1', 'vig2'])
  })

  it('direct: solo el otro miembro', () => {
    const r = computeChatPushRecipients({
      room: { type: 'direct', unitId: null },
      candidates: users.filter(u => u.id === 'prop1' || u.id === 'vig1'),
      senderId: 'prop1',
      viewingUserIds: new Set(),
      directMemberIds: new Set(['prop1', 'vig1']),
    })
    expect(r).toEqual(['vig1'])
  })
})

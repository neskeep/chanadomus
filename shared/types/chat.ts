export type ChatRoomType = 'general' | 'unit' | 'vigilancia' | 'admin' | 'conserjeria' | 'incidencias' | 'propietarios' | 'direct'

export interface ChatRoomLastMessage {
  content: string
  createdAt: string
  userName: string
}

export interface ChatRoomOtherUser {
  id: string
  name: string
  image: string | null
  role: string
}

export interface ChatRoom {
  id: string
  name: string
  type: ChatRoomType
  unitId: string | null
  tenantId: string
  createdAt: string
  lastMessage?: ChatRoomLastMessage | null
  unreadCount?: number
  otherUser?: ChatRoomOtherUser | null
}

export interface ChatContact {
  id: string
  name: string
  image: string | null
  role: string
  unitLabel: string | null
  existingRoomId: string | null
}

export interface ChatAttachment {
  id: string
  filePath: string
  width: number | null
  height: number | null
  fileSize: number
}

export interface ChatMessage {
  id: string
  roomId: string
  userId: string
  content: string
  createdAt: string
  attachments?: ChatAttachment[]
  user?: {
    id: string
    name: string
    image: string | null
  }
}

// --- Chat Commands & Mentions ---

export type ChatCommandType =
  | 'incidencia'
  | 'anuncio'
  | 'reunion'
  | 'votacion'
  | 'proveedor'
  | 'normativa'

export interface ChatCommandDefinition {
  type: ChatCommandType
  label: string
  icon: string
  roles: string[]
  routePrefix: string
}

export interface ChatCommandResult {
  id: string
  label: string
  sublabel?: string
  type: ChatCommandType
}

export interface ChatMentionResult {
  id: string
  name: string
  image: string | null
  role: string
}

export const CHAT_COMMANDS = [
  {
    type: 'incidencia',
    label: 'Incidencia',
    icon: 'alert-triangle',
    roles: ['admin', 'propietario'],
    routePrefix: '/admin/incidencias',
  },
  {
    type: 'anuncio',
    label: 'Anuncio',
    icon: 'megaphone',
    roles: ['admin'],
    routePrefix: '/admin/anuncios',
  },
  {
    type: 'reunion',
    label: 'Reunión',
    icon: 'calendar',
    roles: ['admin', 'propietario', 'conserje'],
    routePrefix: '/admin/reuniones',
  },
  {
    type: 'votacion',
    label: 'Votación',
    icon: 'vote',
    roles: ['admin', 'propietario'],
    routePrefix: '/admin/votaciones',
  },
  {
    type: 'proveedor',
    label: 'Proveedor',
    icon: 'building-2',
    roles: ['admin', 'propietario', 'conserje'],
    routePrefix: '/admin/proveedores',
  },
  {
    type: 'normativa',
    label: 'Normativa',
    icon: 'book-open',
    roles: ['admin', 'propietario', 'conserje', 'vigilancia'],
    routePrefix: '/admin/normativas',
  },
] as const satisfies readonly ChatCommandDefinition[]

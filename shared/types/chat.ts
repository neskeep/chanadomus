export type ChatRoomType = 'general' | 'unit' | 'vigilancia' | 'admin'

export interface ChatRoomLastMessage {
  content: string
  createdAt: string
  userName: string
}

export interface ChatRoom {
  id: string
  name: string
  type: ChatRoomType
  unitId: string | null
  tenantId: string
  createdAt: string
  lastMessage?: ChatRoomLastMessage | null
}

export interface ChatMessage {
  id: string
  roomId: string
  userId: string
  content: string
  createdAt: string
  user?: {
    id: string
    name: string
    image: string | null
  }
}

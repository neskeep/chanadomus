export type ChatRoomType = 'general' | 'unit' | 'vigilancia' | 'admin'

export interface ChatRoom {
  id: string
  name: string
  type: ChatRoomType
  unitId: string | null
  tenantId: string
  createdAt: string
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

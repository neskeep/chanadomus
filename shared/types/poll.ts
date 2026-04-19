export type PollStatus = 'draft' | 'active' | 'closed'
export type PollType = 'single' | 'multiple'

export interface PollOption {
  id: string
  pollId: string
  text: string
  sortOrder: number
  tenantId: string
  createdAt: string
  voteCount?: number
  percentage?: number
}

export interface PollVote {
  id: string
  pollId: string
  optionId: string
  unitId: string
  votedById: string
  tenantId: string
  createdAt: string
}

export interface Poll {
  id: string
  title: string
  description: string | null
  type: PollType
  status: PollStatus
  createdById: string
  createdByName?: string
  tenantId: string
  deadline: string | null
  publishedAt: string | null
  closedAt: string | null
  createdAt: string
  updatedAt: string
  options?: PollOption[]
  totalVotes?: number
  totalUnits?: number
  userVote?: PollVote | null
}

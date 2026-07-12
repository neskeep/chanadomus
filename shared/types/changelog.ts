export const CHANGELOG_ITEM_TYPES = ['added', 'fixed', 'changed', 'removed'] as const
export type ChangelogItemType = (typeof CHANGELOG_ITEM_TYPES)[number]

export interface ChangelogItem {
  type: ChangelogItemType
  description: string
}

export interface ChangelogEntry {
  id: string
  version: string
  title: string
  changes: ChangelogItem[]
  publishedAt: string
  createdById: string
  createdByName?: string
  tenantId: string
  createdAt: string
  updatedAt: string
}

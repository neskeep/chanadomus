type ReorderTable = 'polls' | 'meetings' | 'regulations' | 'announcements'

interface ReorderItem {
  id: string
  displayOrder: number
}

export function useReorder() {
  const isReordering = ref(false)
  const isSaving = ref(false)

  async function saveOrder(table: ReorderTable, items: ReorderItem[]) {
    isSaving.value = true
    try {
      await $fetch('/api/admin/reorder', {
        method: 'POST',
        body: { table, items },
      })
    }
    finally {
      isSaving.value = false
    }
  }

  return { isReordering, isSaving, saveOrder }
}

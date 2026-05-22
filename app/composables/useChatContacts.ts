import type { ChatContact } from '~~/shared/types/chat'

export function useChatContacts() {
  const contacts = ref<ChatContact[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const searchQuery = ref('')

  async function fetchContacts() {
    isLoading.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: ChatContact[] }>('/api/chat/contacts')
      contacts.value = res.data
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar contactos'
      error.value = message
    }
    finally {
      isLoading.value = false
    }
  }

  const filteredContacts = computed(() => {
    if (!searchQuery.value.trim()) return contacts.value
    const q = searchQuery.value.toLowerCase().trim()
    return contacts.value.filter(c =>
      c.name.toLowerCase().includes(q)
      || c.role.toLowerCase().includes(q)
      || (c.unitLabel && c.unitLabel.toLowerCase().includes(q)),
    )
  })

  async function startConversation(contactId: string): Promise<string> {
    const res = await $fetch<{ data: { roomId: string } }>('/api/chat/direct', {
      method: 'POST',
      body: { targetUserId: contactId },
    })
    return res.data.roomId
  }

  return {
    contacts,
    isLoading,
    error,
    searchQuery,
    filteredContacts,
    fetchContacts,
    startConversation,
  }
}

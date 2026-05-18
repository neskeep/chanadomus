import type { Ref } from 'vue'
import type {
  ChatCommandType,
  ChatCommandDefinition,
  ChatCommandResult,
  ChatMentionResult,
} from '~~/shared/types/chat'
import { CHAT_COMMANDS } from '~~/shared/types/chat'

type CommandMode = 'idle' | 'command-type' | 'command-search' | 'mention'
type ResultItem = ChatCommandResult | ChatMentionResult

interface TriggerMatch {
  mode: 'command-type' | 'command-search' | 'mention'
  start: number
  query: string
}

const DEBOUNCE_MS = 300

export function useChatCommands(inputText: Ref<string>, userRole: Ref<string>) {
  // --- State ---
  const mode = ref<CommandMode>('idle')
  const selectedCommandType = ref<ChatCommandType | null>(null)
  const searchQuery = ref('')
  const results = ref<ResultItem[]>([])
  const selectedIndex = ref(0)
  const isSearching = ref(false)

  // Internal: position of the trigger character in inputText
  let triggerStart = -1
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  // --- Computed ---
  const isActive = computed(() => mode.value !== 'idle')

  const availableCommands = computed<ChatCommandDefinition[]>(() =>
    CHAT_COMMANDS.filter(cmd => (cmd.roles as readonly string[]).includes(userRole.value)),
  )

  const filteredCommandTypes = computed<ChatCommandDefinition[]>(() => {
    if (mode.value !== 'command-type') return []
    const q = searchQuery.value.toLowerCase()
    if (!q) return [...availableCommands.value]
    return availableCommands.value.filter(
      cmd => cmd.type.includes(q) || cmd.label.toLowerCase().includes(q),
    )
  })

  // --- Trigger Detection ---

  function findTrigger(text: string, cursorPos: number): TriggerMatch | null {
    // Scan backwards from cursor to find an unmatched / or @
    for (let i = cursorPos - 1; i >= 0; i--) {
      const ch = text[i]

      // Stop scanning at whitespace — trigger must be contiguous
      // (but we allow spaces within command-search query, e.g. `/incidencia: tuberia rota`)
      // So only stop at newline
      if (ch === '\n') break

      if (ch === '/' || ch === '@') {
        // Trigger character must be at start or preceded by a space
        if (i > 0 && text[i - 1] !== ' ') continue

        const afterTrigger = text.substring(i + 1, cursorPos)

        if (ch === '/') {
          // Check if we're in command-search mode (contains `: `)
          const colonIndex = afterTrigger.indexOf(': ')
          if (colonIndex !== -1) {
            const typePart = afterTrigger.substring(0, colonIndex).toLowerCase()
            const matchedCmd = availableCommands.value.find(c => c.type === typePart)
            if (matchedCmd) {
              return {
                mode: 'command-search',
                start: i,
                query: afterTrigger.substring(colonIndex + 2),
              }
            }
          }
          return {
            mode: 'command-type',
            start: i,
            query: afterTrigger.toLowerCase(),
          }
        }

        if (ch === '@') {
          return {
            mode: 'mention',
            start: i,
            query: afterTrigger,
          }
        }
      }
    }
    return null
  }

  function detectTrigger(text: string, cursorPos: number) {
    const match = findTrigger(text, cursorPos)

    if (!match) {
      if (mode.value !== 'idle') dismiss()
      return
    }

    triggerStart = match.start

    if (match.mode === 'command-type') {
      mode.value = 'command-type'
      selectedCommandType.value = null
      searchQuery.value = match.query
      results.value = []
      selectedIndex.value = 0
    }
    else if (match.mode === 'command-search') {
      // Extract the command type from the text
      const afterSlash = text.substring(match.start + 1, cursorPos)
      const colonIdx = afterSlash.indexOf(': ')
      const typePart = afterSlash.substring(0, colonIdx).toLowerCase() as ChatCommandType
      mode.value = 'command-search'
      selectedCommandType.value = typePart
      searchQuery.value = match.query
      debouncedSearch(match.query)
    }
    else if (match.mode === 'mention') {
      mode.value = 'mention'
      searchQuery.value = match.query
      debouncedSearch(match.query)
    }
  }

  // --- API Search ---

  function clearDebounce() {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
  }

  function debouncedSearch(query: string) {
    clearDebounce()
    debounceTimer = setTimeout(() => {
      search(query)
    }, DEBOUNCE_MS)
  }

  async function search(query: string) {
    // Don't search if mode changed while debouncing
    if (mode.value === 'idle' || mode.value === 'command-type') return

    isSearching.value = true
    try {
      if (mode.value === 'command-search' && selectedCommandType.value) {
        const data = await $fetch<{ data: ChatCommandResult[] }>('/api/chat/search', {
          params: { type: selectedCommandType.value, q: query },
        })
        results.value = data.data
      }
      else if (mode.value === 'mention') {
        const data = await $fetch<{ data: ChatMentionResult[] }>('/api/chat/search-users', {
          params: { q: query },
        })
        results.value = data.data
      }
      // Clamp selectedIndex to valid range
      clampSelectedIndex()
    }
    catch {
      results.value = []
    }
    finally {
      isSearching.value = false
    }
  }

  // --- Selection ---

  function selectCommandType(cmd: ChatCommandDefinition) {
    selectedCommandType.value = cmd.type
    mode.value = 'command-search'
    searchQuery.value = ''
    results.value = []
    selectedIndex.value = 0

    // Replace the input text from trigger start to current end with `/tipo: `
    const before = inputText.value.substring(0, triggerStart)
    const after = inputText.value.substring(findTriggerEnd(inputText.value))
    inputText.value = `${before}/${cmd.type}: ${after}`
  }

  function selectResult(index?: number) {
    const idx = index ?? selectedIndex.value

    // In command-type mode, select the command type instead
    if (mode.value === 'command-type') {
      const cmdItem = filteredCommandTypes.value[idx]
      if (cmdItem) selectCommandType(cmdItem)
      return
    }

    const result = results.value[idx]
    if (!result) return

    const before = inputText.value.substring(0, triggerStart)
    const afterEnd = findTriggerEnd(inputText.value)
    const after = inputText.value.substring(afterEnd)

    let insertion = ''
    if (mode.value === 'command-search' && isCommandResult(result)) {
      insertion = `[[${result.type}:${result.id}:${result.label}]] `
    }
    else if (mode.value === 'mention' && isMentionResult(result)) {
      insertion = `@[${result.name}](${result.id}) `
    }

    inputText.value = `${before}${insertion}${after}`
    dismiss()
  }

  // --- Keyboard Navigation ---

  function handleKeydown(event: KeyboardEvent): boolean {
    if (!isActive.value) return false

    const itemCount = currentItemCount()

    switch (event.key) {
      case 'ArrowDown':
        if (itemCount > 0) {
          selectedIndex.value = (selectedIndex.value + 1) % itemCount
        }
        return true

      case 'ArrowUp':
        if (itemCount > 0) {
          selectedIndex.value = (selectedIndex.value - 1 + itemCount) % itemCount
        }
        return true

      case 'Enter':
      case 'Tab':
        if (itemCount > 0) {
          selectResult(selectedIndex.value)
        }
        return true

      case 'Escape':
        dismiss()
        return true

      default:
        return false
    }
  }

  // --- Dismiss ---

  function dismiss() {
    mode.value = 'idle'
    selectedCommandType.value = null
    searchQuery.value = ''
    results.value = []
    selectedIndex.value = 0
    triggerStart = -1
    clearDebounce()
  }

  // --- Helpers ---

  function currentItemCount(): number {
    if (mode.value === 'command-type') return filteredCommandTypes.value.length
    return results.value.length
  }

  function findTriggerEnd(text: string): number {
    // From triggerStart, find the end of the current trigger token
    // The trigger ends at cursor position (we assume cursor is at end of relevant text)
    // Since we don't have cursor here, find the next space after the search content
    // or end of string. For safety, scan from triggerStart past the trigger content.
    if (triggerStart < 0) return text.length

    const triggerChar = text[triggerStart]
    let pos = triggerStart + 1

    if (triggerChar === '/') {
      // For command mode, find end: look for text up to next newline or end
      // If in command-search, the pattern is `/type: query`
      while (pos < text.length && text[pos] !== '\n') {
        // Stop if we hit a closing pattern (e.g., `]]` or start of new trigger)
        if (text[pos] === '/' && pos > triggerStart + 1 && text[pos - 1] === ' ') break
        pos++
      }
    }
    else if (triggerChar === '@') {
      // Mention: until space or end
      while (pos < text.length && text[pos] !== ' ' && text[pos] !== '\n') {
        pos++
      }
    }

    return pos
  }

  function clampSelectedIndex() {
    const count = currentItemCount()
    if (count === 0) {
      selectedIndex.value = 0
    }
    else if (selectedIndex.value >= count) {
      selectedIndex.value = count - 1
    }
  }

  function isCommandResult(item: ResultItem): item is ChatCommandResult {
    return 'type' in item && 'label' in item
  }

  function isMentionResult(item: ResultItem): item is ChatMentionResult {
    return 'name' in item && 'role' in item
  }

  // Clamp when results change
  watch(results, () => clampSelectedIndex())
  watch(filteredCommandTypes, () => clampSelectedIndex())

  // Cleanup debounce on unmount
  onUnmounted(() => {
    clearDebounce()
  })

  return {
    // State
    mode: readonly(mode),
    selectedCommandType: readonly(selectedCommandType),
    searchQuery: readonly(searchQuery),
    results: readonly(results),
    selectedIndex,
    isActive,
    isSearching: readonly(isSearching),

    // Computed
    filteredCommandTypes,
    availableCommands,

    // Methods
    detectTrigger,
    selectCommandType,
    selectResult,
    handleKeydown,
    dismiss,
  }
}

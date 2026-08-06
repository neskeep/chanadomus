import type { CreateGuest } from '~~/shared/types/event'

interface ParsedLine {
  name: string
  document: string | null
  isValid: boolean
  error: string | null
  lineNumber: number
}

export function useEventBulkImport() {
  const rawText = ref('')
  const parsedLines = ref<ParsedLine[]>([])

  const validGuests = computed(() =>
    parsedLines.value.filter(l => l.isValid),
  )

  const invalidLines = computed(() =>
    parsedLines.value.filter(l => !l.isValid && l.error !== null),
  )

  const guestCount = computed(() => validGuests.value.length)

  function parseText(text: string) {
    rawText.value = text
    const lines = text.split('\n')
    const seen = new Set<string>()
    const results: ParsedLine[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!.trim()
      if (!line) continue // Skip empty lines

      let name: string
      let document: string | null = null

      // Try "Name, Document" or "Name - Document" format
      const commaIdx = line.lastIndexOf(',')
      const dashIdx = line.lastIndexOf(' - ')

      if (commaIdx > 0) {
        name = line.substring(0, commaIdx).trim()
        document = line.substring(commaIdx + 1).trim() || null
      }
      else if (dashIdx > 0) {
        name = line.substring(0, dashIdx).trim()
        document = line.substring(dashIdx + 3).trim() || null
      }
      else {
        name = line
      }

      // Validate
      if (name.length < 2) {
        results.push({ name, document, isValid: false, error: 'Nombre muy corto', lineNumber: i + 1 })
        continue
      }

      // Deduplicate
      const key = name.toLowerCase()
      if (seen.has(key)) {
        results.push({ name, document, isValid: false, error: 'Duplicado', lineNumber: i + 1 })
        continue
      }

      seen.add(key)
      results.push({ name, document, isValid: true, error: null, lineNumber: i + 1 })
    }

    parsedLines.value = results
  }

  function getGuestsForImport(): CreateGuest[] {
    return validGuests.value.map(l => ({
      name: l.name,
      document: l.document ?? undefined,
    }))
  }

  function reset() {
    rawText.value = ''
    parsedLines.value = []
  }

  return {
    rawText,
    parsedLines,
    validGuests,
    invalidLines,
    guestCount,
    parseText,
    getGuestsForImport,
    reset,
  }
}

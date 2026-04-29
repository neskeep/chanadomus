import type { MaybeRef } from 'vue'
import { useResizeObserver } from '@vueuse/core'

export function useContentResize(el?: MaybeRef<HTMLElement | null | undefined>) {
  const width = useState('content-resize-w', () => 0)
  const height = useState('content-resize-h', () => 0)

  if (el) {
    useResizeObserver(el, (entries) => {
      const entry = entries[0]
      if (entry) {
        width.value = entry.contentRect.width
        height.value = entry.contentRect.height
      }
    })
  }

  return { width, height }
}

<script setup lang="ts">
import {
  AlertTriangle,
  Megaphone,
  Calendar,
  Vote,
  Building2,
  BookOpen,
} from 'lucide-vue-next'
import { CHAT_COMMANDS, type ChatCommandType } from '~~/shared/types/chat'

const props = defineProps<{
  content: string
  isOwn?: boolean
}>()

type Segment =
  | { type: 'text'; content: string }
  | { type: 'command'; commandType: ChatCommandType; id: string; label: string }
  | { type: 'mention'; name: string; userId: string }

const COMMAND_ICONS: Record<ChatCommandType, Component> = {
  incidencia: AlertTriangle,
  anuncio: Megaphone,
  reunion: Calendar,
  votacion: Vote,
  proveedor: Building2,
  normativa: BookOpen,
}

function getCommandRoute(commandType: ChatCommandType, id: string): string {
  const def = CHAT_COMMANDS.find(c => c.type === commandType)
  return def ? `${def.routePrefix}/${id}` : '#'
}

const segments = computed((): Segment[] => {
  const text = props.content
  if (!text) return []

  const result: Segment[] = []
  // Combined regex: match commands or mentions
  const regex = /\[\[(\w+):([^:]+):([^\]]+)\]\]|@\[([^\]]+)\]\(([^)]+)\)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    // Push preceding text
    if (match.index > lastIndex) {
      result.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    }

    if (match[1] !== undefined) {
      // Command: [[type:id:label]]
      result.push({
        type: 'command',
        commandType: match[1] as ChatCommandType,
        id: match[2]!,
        label: match[3]!,
      })
    } else if (match[4] !== undefined) {
      // Mention: @[Name](userId)
      result.push({
        type: 'mention',
        name: match[4]!,
        userId: match[5]!,
      })
    }

    lastIndex = match.index + match[0].length
  }

  // Push remaining text
  if (lastIndex < text.length) {
    result.push({ type: 'text', content: text.slice(lastIndex) })
  }

  return result
})
</script>

<template>
  <span class="whitespace-pre-wrap break-words">
    <template v-for="(seg, i) in segments" :key="i">
      <!-- Plain text -->
      <template v-if="seg.type === 'text'">{{ seg.content }}</template>

      <!-- Command chip -->
      <NuxtLink
        v-else-if="seg.type === 'command'"
        :to="getCommandRoute(seg.commandType, seg.id)"
        class="inline-flex items-center gap-1 rounded-lg border px-1.5 py-0.5 align-baseline text-xs font-medium transition-colors"
        :class="
          isOwn
            ? 'border-primary-foreground/20 bg-background/90 text-foreground hover:bg-muted'
            : 'border-border bg-background text-foreground hover:bg-muted'
        "
      >
        <component
          :is="COMMAND_ICONS[seg.commandType]"
          class="size-3 shrink-0"
        />
        {{ seg.label }}
      </NuxtLink>

      <!-- Mention -->
      <span
        v-else-if="seg.type === 'mention'"
        class="rounded-sm px-0.5 font-semibold"
        :class="isOwn ? 'bg-primary-foreground/20 text-primary-foreground underline underline-offset-2' : 'text-primary'"
      >@{{ seg.name }}</span>
    </template>
  </span>
</template>

<script setup lang="ts">
import {
  Calendar,
  MapPin,
  Video,
  FileText,
} from 'lucide-vue-next'
import type { Meeting, MeetingType, MeetingStatus } from '~~/shared/types/meeting'
import { MEETING_TYPES, MEETING_STATUSES } from '~~/shared/types/meeting'

// --- Type / Status helpers ---

import { MEETING_TYPE_COLORS as TYPE_COLORS, MEETING_STATUS_COLORS as STATUS_COLORS } from '~/composables/useColorMap'

useHead({ title: 'Reuniones' })

const { meetings, isLoading, error, fetchMeetings } = useMeetings()

// --- Formatters ---

function formatDay(iso: string): string {
  return new Date(iso).getDate().toString()
}

function formatMonthShort(iso: string): string {
  return new Date(iso).toLocaleDateString('es-VE', { month: 'short' })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
}

const { formatMonthYear } = useFormatDate()

function typeLabel(key: MeetingType): string {
  return MEETING_TYPES.find(t => t.key === key)?.label ?? key
}

function statusLabel(key: MeetingStatus): string {
  return MEETING_STATUSES.find(s => s.key === key)?.label ?? key
}

// --- Grouping ---

const groupedMeetings = computed(() => {
  const groups: { label: string; meetings: Meeting[] }[] = []
  let currentLabel = ''
  for (const m of meetings.value) {
    const label = formatMonthYear(m.date)
    if (label !== currentLabel) {
      currentLabel = label
      groups.push({ label, meetings: [] })
    }
    groups[groups.length - 1]!.meetings.push(m)
  }
  return groups
})

// --- Load ---

onMounted(() => {
  fetchMeetings()
})
</script>

<template>
  <div>
    <!-- Error -->
    <ErrorAlert :message="error" class="mb-4" />

    <!-- Loading -->
    <ListSkeleton v-if="isLoading" :count="3" />

    <!-- Content -->
    <template v-else-if="!error">
      <!-- Empty state -->
      <EmptyState
        v-if="meetings.length === 0"
        :icon="Calendar"
        title="No hay reuniones programadas"
        description="Las próximas reuniones aparecerán aquí"
      />

      <!-- Grouped meetings -->
      <div v-else class="space-y-6">
        <section v-for="group in groupedMeetings" :key="group.label">
          <!-- Month header -->
          <h2 class="mb-3 text-sm font-medium capitalize text-muted-foreground">
            {{ group.label }}
          </h2>

          <!-- Meeting cards -->
          <div class="space-y-2">
            <NuxtLink v-for="m in group.meetings" :key="m.id" :to="`/mi-chana/reuniones/${m.id}`" class="block">
            <Card class="transition-colors hover:bg-muted/50">
              <CardContent class="flex gap-2.5 px-3 py-2.5">
                <!-- Date badge -->
                <div class="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <span class="text-lg font-bold leading-none">{{ formatDay(m.date) }}</span>
                  <span class="text-xs capitalize">{{ formatMonthShort(m.date) }}</span>
                </div>

                <!-- Content: 2 rows -->
                <div class="min-w-0 flex-1">
                  <!-- Row 1: Title + Type Badge + Time -->
                  <div class="flex items-center gap-1.5">
                    <h3 class="min-w-0 flex-1 truncate text-sm font-semibold">{{ m.title }}</h3>
                    <span class="shrink-0 rounded-lg px-2 py-0.5 text-[11px] font-medium" :class="TYPE_COLORS[m.type]">
                      {{ typeLabel(m.type) }}
                    </span>
                    <span class="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                      {{ formatTime(m.date) }}
                      <template v-if="m.endDate"> – {{ formatTime(m.endDate) }}</template>
                    </span>
                  </div>

                  <!-- Row 2: Meta inline -->
                  <div class="mt-0.5 flex items-center gap-x-1 text-[11px] text-muted-foreground">
                    <!-- Status (only if not 'programada') -->
                    <template v-if="m.status !== 'programada'">
                      <span class="font-medium" :class="STATUS_COLORS[m.status]">{{ statusLabel(m.status) }}</span>
                      <span class="opacity-30">&middot;</span>
                    </template>
                    <!-- Location -->
                    <template v-if="m.location">
                      <MapPin class="size-3 shrink-0" />
                      <span class="truncate">{{ m.location }}</span>
                    </template>
                    <!-- Meeting link -->
                    <template v-if="m.meetingLink">
                      <span v-if="m.location" class="opacity-30">&middot;</span>
                      <a :href="m.meetingLink" target="_blank" rel="noopener noreferrer" class="inline-flex shrink-0 items-center gap-1 text-primary hover:underline" @click.stop>
                        <Video class="size-3" />
                        Unirse
                      </a>
                    </template>
                    <!-- Agenda preview -->
                    <template v-if="m.agenda">
                      <span v-if="m.location || m.meetingLink" class="opacity-30">&middot;</span>
                      <FileText class="size-3 shrink-0" />
                      <span class="truncate">{{ m.agenda.slice(0, 60) }}{{ m.agenda.length > 60 ? '…' : '' }}</span>
                    </template>
                  </div>
                </div>
              </CardContent>
            </Card>
            </NuxtLink>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

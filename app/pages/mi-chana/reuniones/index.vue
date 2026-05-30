<script setup lang="ts">
import {
  Calendar,
  Clock,
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
            <Card v-for="m in group.meetings" :key="m.id">
              <CardContent class="flex gap-2.5 p-3">
                <!-- Date badge -->
                <div class="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <span class="text-lg font-bold leading-none">{{ formatDay(m.date) }}</span>
                  <span class="text-xs capitalize">{{ formatMonthShort(m.date) }}</span>
                </div>

                <!-- Content -->
                <div class="min-w-0 flex-1">
                  <h3 class="text-sm font-medium">{{ m.title }}</h3>

                  <!-- Time -->
                  <p class="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock class="size-3 shrink-0" />
                    <span>
                      {{ formatTime(m.date) }}
                      <template v-if="m.endDate"> – {{ formatTime(m.endDate) }}</template>
                    </span>
                  </p>

                  <!-- Location -->
                  <p
                    v-if="m.location"
                    class="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"
                  >
                    <MapPin class="size-3 shrink-0" />
                    <span class="truncate">{{ m.location }}</span>
                  </p>

                  <!-- Meeting link -->
                  <a
                    v-if="m.meetingLink"
                    :href="m.meetingLink"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="mt-1 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    <Video class="size-3 shrink-0" />
                    Unirse a la reunión
                  </a>

                  <!-- Badges -->
                  <div class="mt-2 flex flex-wrap gap-1.5">
                    <span
                      class="inline-flex rounded-lg px-2 py-0.5 text-xs font-medium"
                      :class="TYPE_COLORS[m.type]"
                    >
                      {{ typeLabel(m.type) }}
                    </span>
                    <span
                      v-if="m.status !== 'programada'"
                      class="inline-flex rounded-lg px-2 py-0.5 text-xs font-medium"
                      :class="STATUS_COLORS[m.status]"
                    >
                      {{ statusLabel(m.status) }}
                    </span>
                  </div>

                  <!-- Agenda preview -->
                  <p
                    v-if="m.agenda"
                    class="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground"
                  >
                    <FileText class="mt-0.5 size-3 shrink-0" />
                    <span class="line-clamp-2">{{ m.agenda.slice(0, 100) }}{{ m.agenda.length > 100 ? '...' : '' }}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

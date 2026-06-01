<script setup lang="ts">
import {
  Calendar,
  MapPin,
  Video,
  Users,
  CheckSquare,
  ListChecks,
  MessageSquare,
  CheckCircle,
  XCircle,
} from 'lucide-vue-next'
import type { Meeting, MeetingType, MeetingStatus } from '~~/shared/types/meeting'
import { MEETING_TYPES, MEETING_STATUSES } from '~~/shared/types/meeting'
import { MEETING_TYPE_COLORS as TYPE_COLORS, MEETING_STATUS_COLORS as STATUS_COLORS } from '~/composables/useColorMap'

const route = useRoute()
const id = route.params.id as string

const { isLoading, error, fetchMeeting } = useMeetings()

const meeting = ref<Meeting | null>(null)

useHead({ title: () => meeting.value?.title ?? 'Reunion' })

function typeLabel(key: MeetingType): string {
  return MEETING_TYPES.find(t => t.key === key)?.label ?? key
}

function statusLabel(key: MeetingStatus): string {
  return MEETING_STATUSES.find(s => s.key === key)?.label ?? key
}

function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
}

const attendeesList = computed(() => {
  return meeting.value?.minutesAttendeesData ?? []
})

const hasMinutes = computed(() => {
  if (!meeting.value) return false
  const m = meeting.value
  return !!(
    (m.minutesAttendeesData && m.minutesAttendeesData.length > 0)
    || (m.agendaItems && m.agendaItems.some(i => i.discussed))
    || (m.minutesAgreementsList && m.minutesAgreementsList.length > 0)
    || m.minutesNotes
    || m.minutesQuorum !== null
  )
})

onMounted(async () => {
  try {
    meeting.value = await fetchMeeting(id)
  }
  catch {
    // error set by composable
  }
})
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="isLoading && !meeting" class="space-y-4">
      <Skeleton class="h-8 w-2/3" />
      <Skeleton class="h-40 w-full" />
      <Skeleton class="h-60 w-full" />
    </div>

    <!-- Error -->
    <ErrorAlert v-else-if="error && !meeting" :message="error" />

    <!-- Detail -->
    <template v-else-if="meeting">
      <!-- Header -->
      <div class="mb-6">
        <div class="flex flex-wrap items-center gap-2">
          <h1 class="text-lg font-bold">{{ meeting.title }}</h1>
          <span
            class="rounded-lg px-2 py-0.5 text-xs font-medium"
            :class="TYPE_COLORS[meeting.type]"
          >
            {{ typeLabel(meeting.type) }}
          </span>
          <span
            class="rounded-lg px-2 py-0.5 text-xs font-medium"
            :class="STATUS_COLORS[meeting.status]"
          >
            {{ statusLabel(meeting.status) }}
          </span>
        </div>
        <p v-if="meeting.description" class="mt-1 text-sm text-muted-foreground">
          {{ meeting.description }}
        </p>
      </div>

      <!-- Info card -->
      <Card class="mb-4">
        <CardContent class="grid gap-3 p-4 sm:grid-cols-2">
          <!-- Date -->
          <div class="flex items-center gap-2 text-sm">
            <Calendar class="size-4 shrink-0 text-muted-foreground" />
            <span class="capitalize">{{ formatFullDate(meeting.date) }}</span>
          </div>
          <!-- Time -->
          <div class="flex items-center gap-2 text-sm">
            <span class="size-4 shrink-0" />
            <span class="tabular-nums">
              {{ formatTime(meeting.date) }}
              <template v-if="meeting.endDate"> – {{ formatTime(meeting.endDate) }}</template>
            </span>
          </div>
          <!-- Location -->
          <div v-if="meeting.location" class="flex items-center gap-2 text-sm">
            <MapPin class="size-4 shrink-0 text-muted-foreground" />
            <span>{{ meeting.location }}</span>
          </div>
          <!-- Meeting link -->
          <div v-if="meeting.meetingLink" class="flex items-center gap-2 text-sm">
            <Video class="size-4 shrink-0 text-muted-foreground" />
            <a
              :href="meeting.meetingLink"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary hover:underline"
            >
              Unirse a la reunion
            </a>
          </div>
        </CardContent>
      </Card>

      <!-- Agenda -->
      <Card v-if="meeting.agendaItems && meeting.agendaItems.length > 0" class="mb-4">
        <CardContent class="p-4">
          <h2 class="mb-3 text-sm font-semibold">Agenda</h2>
          <ol class="space-y-2">
            <li
              v-for="(item, idx) in meeting.agendaItems"
              :key="idx"
              class="flex items-start gap-2"
            >
              <span class="flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                {{ idx + 1 }}
              </span>
              <span class="text-sm">{{ item.text }}</span>
            </li>
          </ol>
        </CardContent>
      </Card>

      <!-- Minuta estructurada -->
      <Card v-if="hasMinutes" class="mb-4">
        <CardContent class="space-y-5 p-4">
          <h2 class="text-sm font-semibold">Acta / Minuta</h2>

          <!-- Quorum -->
          <div v-if="meeting.minutesQuorum !== null" class="flex items-center gap-2 text-sm">
            <CheckCircle v-if="meeting.minutesQuorum" class="size-4 text-primary" />
            <XCircle v-else class="size-4 text-destructive" />
            <span :class="meeting.minutesQuorum ? 'text-primary' : 'text-destructive'" class="font-medium">
              {{ meeting.minutesQuorum ? 'Quorum alcanzado' : 'Sin quorum' }}
            </span>
          </div>

          <!-- Asistentes -->
          <div v-if="attendeesList.length > 0">
            <h3 class="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Users class="size-3.5" />
              Asistentes ({{ attendeesList.length }})
            </h3>
            <div class="flex flex-wrap gap-1.5">
              <Badge v-for="a in attendeesList" :key="a.id" variant="secondary" class="text-xs">
                {{ a.name }}
              </Badge>
            </div>
          </div>

          <Separator v-if="(meeting.agendaItems && meeting.agendaItems.some(i => i.discussed)) || (meeting.minutesAgreementsList && meeting.minutesAgreementsList.length > 0)" />

          <!-- Puntos tratados -->
          <div v-if="meeting.agendaItems && meeting.agendaItems.some(i => i.discussed)">
            <h3 class="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <ListChecks class="size-3.5" />
              Puntos tratados
            </h3>
            <div class="space-y-3">
              <div
                v-for="(item, idx) in meeting.agendaItems.filter(i => i.discussed)"
                :key="idx"
                class="space-y-1"
              >
                <p class="text-sm font-medium">{{ item.text }}</p>
                <p class="whitespace-pre-line text-sm text-muted-foreground">{{ item.discussed }}</p>
              </div>
            </div>
          </div>

          <!-- Acuerdos -->
          <div v-if="meeting.minutesAgreementsList && meeting.minutesAgreementsList.length > 0">
            <h3 class="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <CheckSquare class="size-3.5" />
              Acuerdos
            </h3>
            <ol class="space-y-1.5">
              <li
                v-for="(agreement, idx) in meeting.minutesAgreementsList"
                :key="idx"
                class="flex items-start gap-2"
              >
                <span class="flex size-5 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-[11px] font-semibold text-primary">
                  {{ idx + 1 }}
                </span>
                <span class="text-sm">{{ agreement }}</span>
              </li>
            </ol>
          </div>

          <!-- Observaciones -->
          <div v-if="meeting.minutesNotes">
            <h3 class="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <MessageSquare class="size-3.5" />
              Observaciones
            </h3>
            <p class="whitespace-pre-line text-sm text-muted-foreground">{{ meeting.minutesNotes }}</p>
          </div>
        </CardContent>
      </Card>

      <!-- Created by -->
      <p v-if="meeting.createdByName" class="text-xs text-muted-foreground">
        Convocada por {{ meeting.createdByName }}
      </p>
    </template>
  </div>
</template>

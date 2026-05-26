<script setup lang="ts">
import {
  AlertTriangle,
  Plus,
  Clock,
  CheckCircle2,
  Loader2,
  XCircle,
  EyeOff,
} from 'lucide-vue-next'
import type { IncidentStatus, IncidentPriority } from '~~/shared/types/incident'
import { INCIDENT_STATUS_COLORS, INCIDENT_STATUS_LABELS, INCIDENT_PRIORITY_COLORS, INCIDENT_PRIORITY_LABELS } from '~/composables/useColorMap'

useHead({ title: 'Incidencias' })

const { target, isMounted } = useTopbarPortal()

const { incidents, isLoading, error, totalPages, fetchIncidents } = useIncidents()
const currentPage = ref(1)

const STATUS_CONFIG: Record<IncidentStatus, { label: string, class: string, icon: typeof Clock }> = {
  open: { label: INCIDENT_STATUS_LABELS.open, class: INCIDENT_STATUS_COLORS.open, icon: AlertTriangle },
  in_progress: { label: INCIDENT_STATUS_LABELS.in_progress, class: INCIDENT_STATUS_COLORS.in_progress, icon: Loader2 },
  resolved: { label: INCIDENT_STATUS_LABELS.resolved, class: INCIDENT_STATUS_COLORS.resolved, icon: CheckCircle2 },
  closed: { label: INCIDENT_STATUS_LABELS.closed, class: INCIDENT_STATUS_COLORS.closed, icon: XCircle },
}

const PRIORITY_CONFIG: Record<IncidentPriority, { label: string, class: string }> = {
  low: { label: INCIDENT_PRIORITY_LABELS.low, class: INCIDENT_PRIORITY_COLORS.low },
  medium: { label: INCIDENT_PRIORITY_LABELS.medium, class: INCIDENT_PRIORITY_COLORS.medium },
  high: { label: INCIDENT_PRIORITY_LABELS.high, class: INCIDENT_PRIORITY_COLORS.high },
}

watch(currentPage, (page) => {
  fetchIncidents({ page })
})

onMounted(() => {
  fetchIncidents()
})

const { formatDate } = useFormatDate()
</script>

<template>
  <div>
    <!-- Topbar actions (desktop) -->
    <Teleport :to="target" defer v-if="isMounted">
      <Button size="sm" @click="navigateTo('/propietario/incidencias/nueva')">
        <Plus class="mr-1.5 size-3.5" />
        Reportar
      </Button>
    </Teleport>

    <!-- Mobile action button -->
    <TopbarMobileAction>
      <Button size="icon" variant="ghost" class="size-9" @click="navigateTo('/propietario/incidencias/nueva')">
        <Plus class="size-4" />
      </Button>
    </TopbarMobileAction>

    <!-- Error -->
    <ErrorAlert :message="error" class="mb-4" />

    <!-- Loading -->
    <ListSkeleton v-if="isLoading" :count="3" />

    <!-- Content -->
    <template v-else-if="!error">
      <!-- Empty state -->
      <EmptyState
        v-if="incidents.length === 0"
        :icon="AlertTriangle"
        title="No hay incidencias"
        description="Reporta un problema y le daremos seguimiento"
      >
        <template #action>
          <Button size="sm" @click="navigateTo('/propietario/incidencias/nueva')">
            <Plus class="mr-1.5 size-3.5" />
            Reportar incidencia
          </Button>
        </template>
      </EmptyState>

      <!-- Incident cards -->
      <div v-else>
        <div class="space-y-2">
          <NuxtLink
            v-for="item in incidents"
            :key="item.id"
            :to="`/propietario/incidencias/${item.id}`"
            class="block"
          >
            <Card class="transition-colors hover:bg-muted/50">
              <CardContent class="px-3 py-2.5">
                <!-- Row 1: Title + Priority badge + Date -->
                <div class="flex items-center gap-1.5">
                  <p class="min-w-0 flex-1 truncate text-sm font-semibold">{{ item.title }}</p>
                  <span
                    class="inline-flex shrink-0 rounded-lg px-2 py-0.5 text-[11px] font-medium"
                    :class="PRIORITY_CONFIG[item.priority].class"
                  >
                    {{ PRIORITY_CONFIG[item.priority].label }}
                  </span>
                  <span class="shrink-0 text-[11px] tabular-nums text-muted-foreground">{{ formatDate(item.createdAt) }}</span>
                </div>
                <!-- Row 2: Status + reporter/anonymous + unit -->
                <div class="mt-0.5 flex items-center gap-x-1 text-[11px] text-muted-foreground">
                  <span :class="STATUS_CONFIG[item.status].class.replace(/bg-\S+/g, '')" class="font-medium">
                    {{ STATUS_CONFIG[item.status].label }}
                  </span>
                  <template v-if="item.isAnonymous">
                    <span class="opacity-30">·</span>
                    <span class="inline-flex items-center gap-0.5">
                      <EyeOff class="size-2.5" />
                      Anónima
                    </span>
                  </template>
                  <template v-else>
                    <template v-if="item.reportedByName">
                      <span class="opacity-30">·</span>
                      <span class="truncate">{{ item.reportedByName }}</span>
                    </template>
                  </template>
                </div>
              </CardContent>
            </Card>
          </NuxtLink>
        </div>

        <!-- Pagination -->
        <ListPagination v-model:current-page="currentPage" :total-pages="totalPages" class="mt-4" />
      </div>
    </template>
  </div>
</template>

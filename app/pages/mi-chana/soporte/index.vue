<script setup lang="ts">
import type { Component } from 'vue'
import {
  LifeBuoy,
  Plus,
  Circle,
  Eye,
  Code2,
  CheckCircle2,
  XCircle,
} from 'lucide-vue-next'
import type { SupportTicketStatus, SupportTicketPriority } from '~~/shared/types/support'
import {
  SUPPORT_STATUS_COLORS,
  SUPPORT_STATUS_LABELS,
  SUPPORT_PRIORITY_COLORS,
  SUPPORT_PRIORITY_LABELS,
  SUPPORT_TYPE_COLORS,
  SUPPORT_TYPE_LABELS,
} from '~/composables/useColorMap'

useHead({ title: 'Soporte' })

const { target, isMounted } = useTopbarPortal()

const { tickets, isLoading, error, totalPages, fetchTickets } = useSupportTickets()
const currentPage = ref(1)

const STATUS_CONFIG: Record<SupportTicketStatus, { label: string; class: string; icon: Component }> = {
  nuevo: { label: SUPPORT_STATUS_LABELS.nuevo, class: SUPPORT_STATUS_COLORS.nuevo, icon: Circle },
  en_revision: { label: SUPPORT_STATUS_LABELS.en_revision, class: SUPPORT_STATUS_COLORS.en_revision, icon: Eye },
  en_desarrollo: { label: SUPPORT_STATUS_LABELS.en_desarrollo, class: SUPPORT_STATUS_COLORS.en_desarrollo, icon: Code2 },
  resuelto: { label: SUPPORT_STATUS_LABELS.resuelto, class: SUPPORT_STATUS_COLORS.resuelto, icon: CheckCircle2 },
  cerrado: { label: SUPPORT_STATUS_LABELS.cerrado, class: SUPPORT_STATUS_COLORS.cerrado, icon: XCircle },
}

const PRIORITY_CONFIG: Record<SupportTicketPriority, { label: string; class: string }> = {
  baja: { label: SUPPORT_PRIORITY_LABELS.baja, class: SUPPORT_PRIORITY_COLORS.baja },
  media: { label: SUPPORT_PRIORITY_LABELS.media, class: SUPPORT_PRIORITY_COLORS.media },
  alta: { label: SUPPORT_PRIORITY_LABELS.alta, class: SUPPORT_PRIORITY_COLORS.alta },
  critica: { label: SUPPORT_PRIORITY_LABELS.critica, class: SUPPORT_PRIORITY_COLORS.critica },
}

watch(currentPage, (page) => {
  fetchTickets({ page })
})

onMounted(() => {
  fetchTickets()
})

const { formatDate } = useFormatDate()
</script>

<template>
  <div>
    <!-- Topbar actions (desktop) -->
    <Teleport v-if="isMounted" :to="target" defer>
      <Button size="sm" @click="navigateTo('/mi-chana/soporte/nuevo')">
        <Plus class="mr-1.5 size-3.5" />
        Nuevo ticket
      </Button>
    </Teleport>

    <!-- Mobile action button -->
    <TopbarMobileAction>
      <Button size="icon" variant="ghost" class="size-9" @click="navigateTo('/mi-chana/soporte/nuevo')">
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
        v-if="tickets.length === 0"
        :icon="LifeBuoy"
        title="No hay tickets"
        description="Reporta un problema o sugerencia"
      >
        <template #action>
          <Button size="sm" @click="navigateTo('/mi-chana/soporte/nuevo')">
            <Plus class="mr-1.5 size-3.5" />
            Nuevo ticket
          </Button>
        </template>
      </EmptyState>

      <!-- Ticket cards -->
      <div v-else>
        <div class="space-y-2">
          <NuxtLink
            v-for="item in tickets"
            :key="item.id"
            :to="`/mi-chana/soporte/${item.id}`"
            class="block"
          >
            <Card class="transition-colors hover:bg-muted/50">
              <CardContent class="px-3 py-2.5">
                <!-- Row 1: Title + Type badge + Date -->
                <div class="flex items-center gap-1.5">
                  <p class="min-w-0 flex-1 truncate text-sm font-semibold">{{ item.title }}</p>
                  <span
                    class="inline-flex shrink-0 rounded-lg px-2 py-0.5 text-[11px] font-medium"
                    :class="SUPPORT_TYPE_COLORS[item.type]"
                  >
                    {{ SUPPORT_TYPE_LABELS[item.type] }}
                  </span>
                  <span class="shrink-0 text-[11px] tabular-nums text-muted-foreground">{{ formatDate(item.createdAt) }}</span>
                </div>
                <!-- Row 2: Status label + priority label -->
                <div class="mt-0.5 flex items-center gap-x-1 text-[11px] text-muted-foreground">
                  <span :class="STATUS_CONFIG[item.status].class.replace(/bg-\S+/g, '')" class="font-medium">
                    {{ STATUS_CONFIG[item.status].label }}
                  </span>
                  <span class="opacity-30">&middot;</span>
                  <span :class="PRIORITY_CONFIG[item.priority].class.replace(/bg-\S+/g, '')" class="font-medium">
                    {{ PRIORITY_CONFIG[item.priority].label }}
                  </span>
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

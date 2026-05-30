<script setup lang="ts">
import {
  Vote,
  CheckCircle2,
  Clock,
  Users,
  Loader2,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { Poll, PollStatus } from '~~/shared/types/poll'
import { POLL_STATUS_COLORS, POLL_STATUS_LABELS } from '~/composables/useColorMap'

useHead({ title: 'Votaciones' })

const { formatDate } = useFormatDate()
const { polls, isLoading, isSubmitting, error, totalPages, fetchPolls, vote } = usePolls()

const { target, isMounted } = useTopbarPortal()

const currentPage = ref(1)
const activeTab = ref<'active' | 'closed'>('active')
const selectedOption = ref<Record<string, string>>({})

const STATUS_CONFIG: Record<PollStatus, { label: string; class: string }> = {
  draft: { label: POLL_STATUS_LABELS.draft, class: POLL_STATUS_COLORS.draft },
  active: { label: POLL_STATUS_LABELS.active, class: POLL_STATUS_COLORS.active },
  closed: { label: POLL_STATUS_LABELS.closed, class: POLL_STATUS_COLORS.closed },
}

const statusOptions: Array<{ value: 'active' | 'closed'; label: string }> = [
  { value: 'active', label: 'Activas' },
  { value: 'closed', label: 'Cerradas' },
]

const filteredPolls = computed(() => {
  return polls.value.filter(p => p.status === activeTab.value)
})

const emptyTitle = computed(() =>
  activeTab.value === 'active' ? 'No hay votaciones activas' : 'No hay votaciones cerradas',
)

const emptyDescription = computed(() =>
  activeTab.value === 'active' ? 'Las nuevas votaciones apareceran aqui' : 'Las votaciones cerradas apareceran aqui',
)

async function loadPolls() {
  await fetchPolls({ page: currentPage.value, status: activeTab.value })
}

watch(activeTab, () => {
  currentPage.value = 1
  loadPolls()
})

watch(currentPage, () => {
  loadPolls()
})

onMounted(() => {
  loadPolls()
})

function hasVoted(poll: Poll): boolean {
  return !!poll.userVote
}

const clientNow = ref<Date | null>(null)
onMounted(() => { clientNow.value = new Date() })

function isExpired(poll: Poll): boolean {
  if (!poll.deadline || !clientNow.value) return false
  return clientNow.value > new Date(poll.deadline)
}

function canVote(poll: Poll): boolean {
  return poll.status === 'active' && !hasVoted(poll) && !isExpired(poll)
}

async function handleVote(poll: Poll) {
  const optionId = selectedOption.value[poll.id]
  if (!optionId) {
    toast.error('Selecciona una opcion')
    return
  }

  try {
    await vote(poll.id, optionId)
    toast.success('Voto registrado correctamente')
    await loadPolls()
  }
  catch {
    toast.error(error.value ?? 'Error al votar')
  }
}

function getParticipation(poll: Poll): string {
  const total = poll.totalUnits ?? 0
  const votes = poll.totalVotes ?? 0
  if (total === 0) return '0%'
  return `${Math.round((votes / total) * 100)}%`
}
</script>

<template>
  <div>
    <!-- Topbar actions -->
    <Teleport v-if="isMounted" :to="target" defer>
      <TopbarFilters :active="activeTab !== 'active'" @clear="activeTab = 'active'">
        <TopbarFilterGroup v-model="activeTab" label="Estado" :options="statusOptions" />
      </TopbarFilters>
    </Teleport>

    <!-- Mobile filters -->
    <div class="mb-4 md:hidden">
      <TopbarFilters :active="activeTab !== 'active'" @clear="activeTab = 'active'">
        <TopbarFilterGroup v-model="activeTab" label="Estado" :options="statusOptions" />
      </TopbarFilters>
    </div>

    <!-- Error -->
    <ErrorAlert v-if="error" :message="error" class="mb-4" />

    <!-- Loading -->
    <ListSkeleton v-if="isLoading" :count="3" variant="card" />

    <!-- Content -->
    <template v-else-if="!error">
      <!-- Empty state -->
      <EmptyState
        v-if="filteredPolls.length === 0"
        :icon="Vote"
        :title="emptyTitle"
        :description="emptyDescription"
      />

      <!-- Poll cards -->
      <div v-else class="space-y-2">
        <Card
          v-for="poll in filteredPolls"
          :key="poll.id"
        >
          <CardContent class="p-3">
            <!-- Header -->
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium leading-snug">{{ poll.title }}</p>
                <p v-if="poll.description" class="mt-1 text-xs text-muted-foreground">
                  {{ poll.description }}
                </p>
              </div>
              <span
                class="inline-flex shrink-0 rounded-lg px-2 py-0.5 text-xs font-medium"
                :class="STATUS_CONFIG[poll.status].class"
              >
                {{ STATUS_CONFIG[poll.status].label }}
              </span>
            </div>

            <!-- Meta info -->
            <div class="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span class="inline-flex items-center gap-1">
                <Users class="size-3" />
                {{ poll.totalVotes ?? 0 }}/{{ poll.totalUnits ?? 0 }} votos ({{ getParticipation(poll) }})
              </span>
              <span v-if="poll.deadline" class="inline-flex items-center gap-1">
                <Clock class="size-3" />
                {{ formatDate(poll.deadline) }}
              </span>
            </div>

            <!-- Voted badge -->
            <div
              v-if="hasVoted(poll)"
              class="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800"
            >
              <CheckCircle2 class="size-3.5" />
              Ya votaste
            </div>

            <!-- Expired badge (active but deadline passed) -->
            <div
              v-else-if="poll.status === 'active' && isExpired(poll)"
              class="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800"
            >
              <Clock class="size-3.5" />
              Plazo vencido
            </div>

            <!-- Vote section (active + not voted + not expired) -->
            <div v-if="canVote(poll)" class="mt-4">
              <Separator class="mb-4" />
              <RadioGroup
                :model-value="selectedOption[poll.id] ?? ''"
                @update:model-value="(val) => selectedOption[poll.id] = String(val)"
              >
                <div
                  v-for="opt in poll.options"
                  :key="opt.id"
                  class="flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors"
                  :class="{
                    'border-primary bg-primary/5': selectedOption[poll.id] === opt.id,
                    'hover:bg-muted/50': selectedOption[poll.id] !== opt.id,
                  }"
                >
                  <RadioGroupItem :id="`opt-${opt.id}`" :value="opt.id" />
                  <Label :for="`opt-${opt.id}`" class="flex-1 cursor-pointer text-sm">
                    {{ opt.text }}
                  </Label>
                </div>
              </RadioGroup>

              <Button
                class="mt-3 w-full"
                size="sm"
                :disabled="!selectedOption[poll.id] || isSubmitting"
                @click="handleVote(poll)"
              >
                <Loader2 v-if="isSubmitting" class="mr-2 size-4 animate-spin" />
                <Vote v-else class="mr-2 size-4" />
                {{ isSubmitting ? 'Enviando...' : 'Enviar voto' }}
              </Button>
            </div>

            <!-- Results section (after voting or closed) -->
            <div v-if="(hasVoted(poll) || poll.status === 'closed') && poll.options?.length" class="mt-4">
              <Separator class="mb-4" />
              <div class="space-y-2.5">
                <div v-for="opt in poll.options" :key="opt.id" class="space-y-1">
                  <div class="flex items-center justify-between text-xs">
                    <span class="flex items-center gap-1.5">
                      <CheckCircle2
                        v-if="poll.userVote?.optionId === opt.id"
                        class="size-3.5 text-primary"
                      />
                      <span :class="{ 'font-medium': poll.userVote?.optionId === opt.id }">
                        {{ opt.text }}
                      </span>
                    </span>
                    <span class="ml-2 shrink-0 font-medium">
                      {{ opt.voteCount ?? 0 }} · {{ opt.percentage ?? 0 }}%
                    </span>
                  </div>
                  <Progress :model-value="opt.percentage ?? 0" class="h-2.5" />
                </div>
              </div>
            </div>

            <!-- Closed at info -->
            <p v-if="poll.closedAt" class="mt-3 text-xs text-muted-foreground">
              Cerrada el {{ formatDate(poll.closedAt) }}
            </p>
          </CardContent>
        </Card>

        <!-- Pagination -->
        <ListPagination v-model:current-page="currentPage" :total-pages="totalPages" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import {
  Vote,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Lock,
  Users,
  Loader2,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { Poll, PollStatus } from '~~/shared/types/poll'

useHead({ title: 'Votaciones' })

const { polls, meta, isLoading, isSubmitting, error, totalPages, fetchPolls, vote } = usePolls()

const currentPage = ref(1)
const activeTab = ref<'active' | 'closed'>('active')
const selectedOption = ref<Record<string, string>>({})

const STATUS_CONFIG: Record<PollStatus, { label: string; class: string }> = {
  draft: { label: 'Borrador', class: 'bg-zinc-100 text-zinc-600' },
  active: { label: 'Activa', class: 'bg-emerald-100 text-emerald-800' },
  closed: { label: 'Cerrada', class: 'bg-blue-100 text-blue-800' },
}

const filteredPolls = computed(() => {
  return polls.value.filter(p => p.status === activeTab.value)
})

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

function isExpired(poll: Poll): boolean {
  if (!poll.deadline) return false
  return new Date() > new Date(poll.deadline)
}

function canVote(poll: Poll): boolean {
  return poll.status === 'active' && !hasVoted(poll) && !isExpired(poll)
}

async function handleVote(poll: Poll) {
  const optionId = selectedOption.value[poll.id]
  if (!optionId) {
    toast.error('Selecciona una opción')
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-VE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function getParticipation(poll: Poll): string {
  const total = poll.totalUnits ?? 0
  const votes = poll.totalVotes ?? 0
  if (total === 0) return '0%'
  return `${Math.round((votes / total) * 100)}%`
}
</script>

<template>
  <div class="mx-auto max-w-lg">
    <!-- Tabs -->
    <div class="mb-4 flex gap-2">
      <Button
        :variant="activeTab === 'active' ? 'default' : 'outline'"
        size="sm"
        @click="activeTab = 'active'"
      >
        Activas
      </Button>
      <Button
        :variant="activeTab === 'closed' ? 'default' : 'outline'"
        size="sm"
        @click="activeTab = 'closed'"
      >
        Cerradas
      </Button>
    </div>

    <!-- Error -->
    <div
      v-if="error"
      role="alert"
      class="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
    >
      {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="space-y-3">
      <Card v-for="i in 3" :key="i">
        <CardContent class="p-3">
          <div class="space-y-2.5">
            <Skeleton class="h-5 w-3/4" />
            <Skeleton class="h-4 w-1/2" />
            <Skeleton class="h-8 w-full" />
            <Skeleton class="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Content -->
    <template v-else-if="!error">
      <!-- Empty state -->
      <div
        v-if="filteredPolls.length === 0"
        class="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8 text-center"
      >
        <div class="flex size-10 items-center justify-center rounded-lg bg-muted">
          <Vote class="size-5 text-muted-foreground" />
        </div>
        <div>
          <p class="font-medium">
            {{ activeTab === 'active' ? 'No hay votaciones activas' : 'No hay votaciones cerradas' }}
          </p>
          <p class="mt-1 text-sm text-muted-foreground">
            {{ activeTab === 'active' ? 'Las nuevas votaciones aparecerán aquí' : 'Las votaciones cerradas aparecerán aquí' }}
          </p>
        </div>
      </div>

      <!-- Poll cards -->
      <div v-else class="space-y-3">
        <Card
          v-for="poll in filteredPolls"
          :key="poll.id"
          :class="{ 'border-primary/30': poll.status === 'active' && !hasVoted(poll) }"
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
                class="inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
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
              class="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800"
            >
              <CheckCircle2 class="size-3.5" />
              Ya votaste
            </div>

            <!-- Expired badge (active but deadline passed) -->
            <div
              v-else-if="poll.status === 'active' && isExpired(poll)"
              class="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800"
            >
              <Clock class="size-3.5" />
              Plazo vencido
            </div>

            <!-- Vote section (active + not voted + not expired) -->
            <div v-if="canVote(poll)" class="mt-4">
              <Separator class="mb-4" />
              <RadioGroup
                :model-value="selectedOption[poll.id] ?? ''"
                @update:model-value="(val: string) => selectedOption[poll.id] = val"
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
                  <RadioGroupItem :value="opt.id" :id="`opt-${opt.id}`" />
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
        <div v-if="totalPages > 1" class="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            size="sm"
            :disabled="currentPage <= 1"
            @click="currentPage--"
          >
            <ChevronLeft class="mr-1 size-4" />
            Anterior
          </Button>
          <span class="text-sm text-muted-foreground">
            {{ currentPage }} / {{ totalPages }}
          </span>
          <Button
            variant="outline"
            size="sm"
            :disabled="currentPage >= totalPages"
            @click="currentPage++"
          >
            Siguiente
            <ChevronRight class="ml-1 size-4" />
          </Button>
        </div>
      </div>
    </template>
  </div>
</template>

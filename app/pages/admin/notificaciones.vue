<script setup lang="ts">
import { BellOff, BellRing, CheckCircle2, Clock, Info, Loader2, Megaphone, MessageSquareOff, Search, Send, Smartphone } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useDebounceFn } from '@vueuse/core'
import { ROLE_LABELS, USER_ROLES } from '~~/shared/types/auth'
import type { PushStatsStatus } from '~~/shared/types/push-stats'
import { ICON_BG } from '~/composables/useColorMap'

useHead({ title: 'Notificaciones' })

// --- Pestañas (sincronizadas con ?tab= para enlazar directo a "Alcance") ---

type PageTab = 'enviar' | 'alcance'

const route = useRoute()
const router = useRouter()

const activeTab = computed<PageTab>({
  get: () => (route.query.tab === 'alcance' ? 'alcance' : 'enviar'),
  set: (tab) => {
    router.replace({ query: { ...route.query, tab: tab === 'alcance' ? 'alcance' : undefined } })
  },
})

function onTabChange(value: string | number) {
  activeTab.value = value === 'alcance' ? 'alcance' : 'enviar'
}

// --- Enviar ---

const title = ref('')
const body = ref('')
const isSending = ref(false)

const canSend = computed(() =>
  title.value.trim().length > 0
  && body.value.trim().length > 0
  && !isSending.value,
)

const { data: historyData, refresh } = await useFetch('/api/push/broadcast', {
  default: () => ({ data: [] }),
})

const history = computed(() => historyData.value?.data ?? [])

async function handleSend() {
  if (!canSend.value) return

  isSending.value = true
  try {
    const result = await $fetch('/api/push/broadcast', {
      method: 'POST',
      body: {
        title: title.value.trim(),
        body: body.value.trim(),
      },
    })

    const push = (result as { data?: { push?: { sent?: number } } }).data?.push
    toast.success(`Notificación enviada a ${push?.sent ?? 0} usuario(s)`)
    title.value = ''
    body.value = ''
    await refresh()
  }
  catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    toast.error(err?.data?.message ?? 'Error al enviar notificación')
  }
  finally {
    isSending.value = false
  }
}

const { formatDateTime } = useFormatDate()

// --- Alcance ---

const {
  stats,
  users,
  meta,
  filters,
  totalPages,
  isLoadingUsers,
  statsError,
  usersError,
  fetchStats,
  fetchUsers,
  setFilters,
  setPage,
} = usePushStats()

// Pendiente hasta la primera respuesta (evita mostrar ceros o "—" antes de cargar).
const isStatsPending = computed(() => !stats.value && !statsError.value)
const summary = computed(() => stats.value?.summary ?? null)
const chatDisabledTotal = computed(() =>
  stats.value?.byRole.reduce((sum, row) => sum + row.chatDisabled, 0) ?? 0,
)

const roleOptions = USER_ROLES.map(role => ({ value: role, label: ROLE_LABELS[role] }))

// TopbarFilterGroup trabaja con string ('' = sin filtro); el composable con UserRole | null.
const roleFilter = computed({
  get: () => filters.role ?? '',
  set: (value: string) => {
    const role = USER_ROLES.find(r => r === value) ?? null
    setFilters({ role })
  },
})

const searchQuery = computed({
  get: () => filters.search,
  set: (value: string) => {
    filters.search = value
    debouncedSearch()
  },
})
const debouncedSearch = useDebounceFn(() => setFilters({}), 300)

function clearFilters() {
  filters.search = ''
  setFilters({ role: null })
}

const hasFilters = computed(() => filters.role !== null || filters.search.trim() !== '')

// Conteos por estado: del rol filtrado si lo hay, si no del total. Con búsqueda no aplican.
const statusCounts = computed<Record<PushStatsStatus, number> | null>(() => {
  if (!stats.value || filters.search.trim()) return null
  const row = filters.role ? stats.value.byRole.find(r => r.role === filters.role) : null
  const total = row ? row.users : stats.value.summary.totalUsers
  const withPush = row ? row.withPush : stats.value.summary.usersWithPush
  return { without: total - withPush, with: withPush, all: total }
})

const STATUS_TABS: Array<{ value: PushStatsStatus, label: string }> = [
  { value: 'without', label: 'Sin avisos' },
  { value: 'with', label: 'Con avisos' },
  { value: 'all', label: 'Todos' },
]

function onStatusChange(value: string | number) {
  const status = STATUS_TABS.find(t => t.value === value)?.value
  if (status && status !== filters.status) setFilters({ status })
}

const emptyState = computed(() => {
  if (hasFilters.value) {
    return { icon: Search, title: 'Sin resultados', description: 'Prueba con otro nombre, correo o unidad, o limpia los filtros.' }
  }
  if (filters.status === 'without') {
    return { icon: CheckCircle2, title: 'Todos los usuarios tienen los avisos activos', description: 'Cada uno recibe avisos en al menos un dispositivo.' }
  }
  if (filters.status === 'with') {
    return { icon: BellOff, title: 'Nadie ha activado los avisos todavía', description: 'Pide a los usuarios que los activen desde Notificaciones en su teléfono o computadora.' }
  }
  return { icon: BellOff, title: 'No hay usuarios', description: '' }
})

const { target, isMounted } = useTopbarPortal()

// El resumen también alimenta la nota de alcance en "Enviar"; la lista solo se pide al abrir "Alcance".
// hasFetchedUsers evita que el estado vacío aparezca antes de la primera respuesta.
const hasFetchedUsers = ref(false)
onMounted(() => {
  fetchStats()
  watch(activeTab, async (tab) => {
    if (tab !== 'alcance' || hasFetchedUsers.value || isLoadingUsers.value) return
    await fetchUsers()
    hasFetchedUsers.value = true
  }, { immediate: true })
})
</script>

<template>
  <div class="space-y-6">
    <!-- Buscador y filtros de la lista: solo en "Alcance" -->
    <Teleport v-if="isMounted && activeTab === 'alcance'" :to="target" defer>
      <TopbarSearch v-model="searchQuery" placeholder="Buscar usuario...">
        <TopbarFilters :active="filters.role !== null" @clear="clearFilters">
          <TopbarFilterGroup v-model="roleFilter" label="Rol" :options="roleOptions" />
        </TopbarFilters>
      </TopbarSearch>
    </Teleport>

    <Tabs :model-value="activeTab" @update:model-value="onTabChange">
      <TabsList>
        <TabsTrigger value="enviar">
          <Send />
          Enviar
        </TabsTrigger>
        <TabsTrigger value="alcance">
          <BellRing />
          Alcance
        </TabsTrigger>
      </TabsList>

      <!-- ===== Enviar ===== -->
      <TabsContent value="enviar" class="mt-4 space-y-6">
        <Card>
          <CardContent class="p-5 md:p-8">
            <p class="mb-5 text-sm text-muted-foreground">
              Envía un mensaje push a todos los usuarios suscritos. El mensaje aparecerá como barra de anuncio durante 24 horas.
            </p>
            <form class="space-y-4" @submit.prevent="handleSend">
              <div class="space-y-1.5">
                <Label for="bc-title">Título <span class="text-destructive">*</span></Label>
                <Input
                  id="bc-title"
                  v-model="title"
                  placeholder="Ej: Nueva actualización disponible"
                  class="h-12 text-base"
                  required
                />
              </div>

              <div class="space-y-1.5">
                <Label for="bc-body">Mensaje <span class="text-destructive">*</span></Label>
                <Textarea
                  id="bc-body"
                  v-model="body"
                  placeholder="Escribe el mensaje que recibirán todos los usuarios..."
                  rows="3"
                  class="text-base"
                  required
                />
              </div>

              <Button
                type="submit"
                class="h-12 w-full text-base font-semibold"
                :disabled="!canSend"
              >
                <Loader2 v-if="isSending" class="mr-2 size-4 animate-spin" />
                <Send v-else class="mr-2 size-4" />
                {{ isSending ? 'Enviando...' : 'Enviar a todos' }}
              </Button>

              <p v-if="summary" class="text-center text-xs text-muted-foreground">
                Llegará a <span class="font-medium tabular-nums text-foreground">{{ summary.usersWithPush }} de {{ summary.totalUsers }}</span>
                usuarios, los que activaron los avisos.
                <NuxtLink
                  to="/admin/notificaciones?tab=alcance"
                  class="rounded-lg font-medium text-accent-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Ver quién falta
                </NuxtLink>
              </p>
            </form>
          </CardContent>
        </Card>

        <section v-if="history.length > 0" class="space-y-3" aria-labelledby="history-title">
          <h2 id="history-title" class="text-lg font-semibold">Historial de envíos</h2>
          <div class="space-y-2">
            <Card v-for="item in history" :key="item.id">
              <CardContent class="flex items-start gap-3 p-4">
                <Megaphone class="mt-0.5 size-4 shrink-0 text-primary" />
                <div class="min-w-0 flex-1">
                  <p class="font-medium">{{ item.title }}</p>
                  <p class="text-sm text-muted-foreground">{{ item.body }}</p>
                  <div class="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock class="size-3" />
                    <span>{{ formatDateTime(item.createdAt) }}</span>
                    <span v-if="item.authorName">· {{ item.authorName }}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </TabsContent>

      <!-- ===== Alcance ===== -->
      <TabsContent value="alcance" class="mt-4 space-y-8">
        <div class="flex items-start gap-2.5 rounded-lg bg-muted/60 px-3 py-2.5 text-sm text-muted-foreground">
          <Info class="mt-0.5 size-4 shrink-0" />
          <p>
            Cada usuario activa los avisos en su propio dispositivo, desde <span class="font-medium text-foreground">Notificaciones</span>:
            la campana en el teléfono o el menú de su cuenta en la computadora. Mientras no lo haga, no recibe avisos del chat ni de accesos.
            Si usa la app en ambos, debe activarlos en cada uno.
          </p>
        </div>

        <!-- Resumen -->
        <section class="space-y-4" aria-labelledby="reach-summary-title">
          <h2 id="reach-summary-title" class="text-base font-semibold">Resumen</h2>

          <ErrorAlert :message="statsError" />

          <div class="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <ProgressStatCard
              class="col-span-2 lg:col-span-1"
              label="Con avisos activos"
              :value="summary ? `${summary.percentage.toFixed(1)}%` : '—'"
              :progress="summary?.percentage ?? 0"
              :icon="BellRing"
              :icon-bg-class="ICON_BG.orange"
              :caption="summary ? `${summary.usersWithPush} de ${summary.totalUsers} usuarios` : undefined"
              :is-loading="isStatsPending"
            />
            <StatCard
              label="Dispositivos"
              :value="summary?.totalDevices ?? '—'"
              :icon="Smartphone"
              :icon-bg-class="ICON_BG.teal"
              tooltip="Teléfonos y computadoras con avisos activos. Un usuario puede tener varios."
              :is-loading="isStatsPending"
            />
            <StatCard
              label="Chat desactivado"
              :value="stats ? chatDisabledTotal : '—'"
              :icon="MessageSquareOff"
              :icon-bg-class="ICON_BG.warning"
              tooltip="Usuarios con avisos activos que apagaron los del chat en sus preferencias."
              :is-loading="isStatsPending"
            />
          </div>

          <AdminPushRoleTable :rows="stats?.byRole ?? []" :is-loading="isStatsPending" />
        </section>

        <!-- Usuarios -->
        <section class="space-y-4" aria-labelledby="reach-users-title">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 id="reach-users-title" class="text-base font-semibold">Usuarios</h2>
            <Tabs :model-value="filters.status" @update:model-value="onStatusChange">
              <TabsList aria-label="Filtrar por estado de los avisos">
                <TabsTrigger v-for="tab in STATUS_TABS" :key="tab.value" :value="tab.value">
                  {{ tab.label }}
                  <span v-if="statusCounts" class="tabular-nums text-muted-foreground">{{ statusCounts[tab.value] }}</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <!-- Buscador móvil (en desktop vive en la barra superior) -->
          <div class="md:hidden">
            <TopbarSearch v-model="searchQuery" placeholder="Buscar usuario...">
              <TopbarFilters :active="filters.role !== null" @clear="clearFilters">
                <TopbarFilterGroup v-model="roleFilter" label="Rol" :options="roleOptions" />
              </TopbarFilters>
            </TopbarSearch>
          </div>

          <ErrorAlert :message="usersError" />

          <ListSkeleton v-if="!hasFetchedUsers || (isLoadingUsers && users.length === 0)" :count="5" variant="row" />

          <EmptyState
            v-else-if="!usersError && meta.total === 0"
            :icon="emptyState.icon"
            :title="emptyState.title"
            :description="emptyState.description || undefined"
          >
            <template v-if="hasFilters" #action>
              <Button variant="outline" @click="clearFilters">Limpiar filtros</Button>
            </template>
          </EmptyState>

          <div v-else-if="users.length > 0" :aria-busy="isLoadingUsers" class="transition-opacity" :class="isLoadingUsers && 'opacity-60'">
            <AdminPushUsersList :users="users" />
            <ListPagination :current-page="filters.page" :total-pages="totalPages" @update:current-page="setPage" />
          </div>
        </section>
      </TabsContent>
    </Tabs>
  </div>
</template>

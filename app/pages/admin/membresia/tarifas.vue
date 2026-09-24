<script setup lang="ts">
import { History, Loader2, Save } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { MEMBERSHIP_DEFAULT_CURRENCY, membershipRateInputSchema, rateEffectiveOn } from '~~/shared/lib/membership'
import type { MembershipRate } from '~~/shared/types/membership'

useHead({ title: 'Tarifas de membresía' })

// --- Solo superadmin (el middleware solo comprueba el rol) ---

const { isSuperAdmin, isLoading: isAuthLoading } = useAuth()
// Solo en cliente: en SSR la sesión del cliente de auth aún no está disponible.
onMounted(() => {
  watch([isAuthLoading, isSuperAdmin], ([loading, superAdmin]) => {
    if (!loading && !superAdmin) navigateTo('/admin/membresia', { replace: true })
  }, { immediate: true })
})

const { rates, isLoading, hasFetched, isSaving, error, fetchRates, createRate } = useMembershipRates()
const { today } = useLocalDate()
const { formatDate, formatDateTime, formatCurrency } = useFormatDate()

// --- Vigente desde: mes y año (siempre día 1) ---

const MONTHS = Array.from({ length: 12 }, (_, i) => {
  const name = new Intl.DateTimeFormat('es-VE', { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, i, 1)))
  return { value: String(i + 1).padStart(2, '0'), label: name.charAt(0).toUpperCase() + name.slice(1) }
})

const todayYmd = today()
const currentYear = Number(todayYmd.slice(0, 4))
const YEARS = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map(String)

// Por defecto, el mes siguiente.
const nextMonth = new Date(Date.UTC(currentYear, Number(todayYmd.slice(5, 7)), 1))

// --- Formulario ---

const fullRate = ref('')
const reducedRate = ref('')
const month = ref(String(nextMonth.getUTCMonth() + 1).padStart(2, '0'))
const year = ref(String(nextMonth.getUTCFullYear()))
const notes = ref('')
const submitted = ref(false)
const serverError = ref<string | null>(null)

const effectiveFrom = computed(() => `${year.value}-${month.value}-01`)
const startsInPast = computed(() => effectiveFrom.value.slice(0, 7) < todayYmd.slice(0, 7))

const parsed = computed(() => membershipRateInputSchema.safeParse({
  fullRate: fullRate.value.trim().replace(',', '.') || undefined,
  reducedRate: reducedRate.value.trim().replace(',', '.') || undefined,
  currency: MEMBERSHIP_DEFAULT_CURRENCY,
  effectiveFrom: effectiveFrom.value,
  notes: notes.value,
}))

/** Primer error por campo (el error de la regla reducida ≤ completa va a la reducida). */
const fieldErrors = computed(() => {
  const out: Partial<Record<'fullRate' | 'reducedRate' | 'effectiveFrom' | 'notes', string>> = {}
  if (parsed.value.success) return out
  for (const issue of parsed.value.error.issues) {
    const key = (issue.path[0] as keyof typeof out | undefined) ?? 'reducedRate'
    if (!out[key]) out[key] = issue.message
  }
  return out
})

function fieldError(key: keyof typeof fieldErrors.value): string | undefined {
  return submitted.value ? fieldErrors.value[key] : undefined
}

async function handleSubmit() {
  submitted.value = true
  serverError.value = null
  if (!parsed.value.success) return

  try {
    const rate = await createRate(parsed.value.data)
    toast.success(`Tarifa guardada. Rige desde el ${formatDate(rate.effectiveFrom)}`)
    fullRate.value = ''
    reducedRate.value = ''
    notes.value = ''
    submitted.value = false
  }
  catch (err: unknown) {
    serverError.value = err instanceof Error ? err.message : 'No se pudo guardar la tarifa'
    toast.error(serverError.value)
  }
}

// --- Historial ---

const currentRateId = computed(() => rateEffectiveOn(rates.value, todayYmd)?.id ?? null)

function rateStatus(rate: MembershipRate): { label: string, variant: 'default' | 'outline' | 'ghost' } {
  if (rate.id === currentRateId.value) return { label: 'Vigente', variant: 'default' }
  if (rate.effectiveFrom > todayYmd) return { label: 'Programada', variant: 'outline' }
  return { label: 'Anterior', variant: 'ghost' }
}

onMounted(fetchRates)
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <div v-if="!isSuperAdmin" class="space-y-3" aria-busy="true">
      <Skeleton class="h-96 w-full" />
    </div>
    <div v-else class="space-y-8">
      <Card>
        <CardContent class="p-5 md:p-8">
          <form class="space-y-6" novalidate @submit.prevent="handleSubmit">
            <p class="text-sm text-muted-foreground">
              La tarifa nueva se aplica desde el día 1 del mes que elijas. Los meses ya cerrados conservan la tarifa con la que se cerraron.
            </p>

            <ErrorAlert :message="serverError" />

            <div class="grid gap-4 sm:grid-cols-2">
              <div class="space-y-1.5">
                <Label for="full-rate">Tarifa completa <span class="text-destructive">*</span></Label>
                <InputGroup class="h-11">
                  <InputGroupAddon>$</InputGroupAddon>
                  <InputGroupInput
                    id="full-rate"
                    v-model="fullRate"
                    inputmode="decimal"
                    placeholder="4.50"
                    class="text-base tabular-nums"
                    :aria-invalid="!!fieldError('fullRate')"
                    aria-describedby="full-rate-help"
                  />
                </InputGroup>
                <p v-if="fieldError('fullRate')" id="full-rate-help" class="text-sm text-destructive">{{ fieldError('fullRate') }}</p>
                <p v-else id="full-rate-help" class="text-xs text-muted-foreground">Por unidad y mes, con usuarios o pases permanentes.</p>
              </div>

              <div class="space-y-1.5">
                <Label for="reduced-rate">Tarifa reducida <span class="text-destructive">*</span></Label>
                <InputGroup class="h-11">
                  <InputGroupAddon>$</InputGroupAddon>
                  <InputGroupInput
                    id="reduced-rate"
                    v-model="reducedRate"
                    inputmode="decimal"
                    placeholder="2.00"
                    class="text-base tabular-nums"
                    :aria-invalid="!!fieldError('reducedRate')"
                    aria-describedby="reduced-rate-help"
                  />
                </InputGroup>
                <p v-if="fieldError('reducedRate')" id="reduced-rate-help" class="text-sm text-destructive">{{ fieldError('reducedRate') }}</p>
                <p v-else id="reduced-rate-help" class="text-xs text-muted-foreground">Por unidad y mes, sin usuarios ni pases.</p>
              </div>
            </div>

            <fieldset class="space-y-1.5">
              <legend class="mb-1.5 text-sm font-medium">Vigente desde <span class="text-destructive">*</span></legend>
              <div class="grid grid-cols-[1fr_auto] gap-3">
                <Select v-model="month">
                  <SelectTrigger class="h-11 w-full" aria-label="Mes">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="m in MONTHS" :key="m.value" :value="m.value">{{ m.label }}</SelectItem>
                  </SelectContent>
                </Select>
                <Select v-model="year">
                  <SelectTrigger class="h-11 w-28" aria-label="Año">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="y in YEARS" :key="y" :value="y">{{ y }}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p v-if="fieldError('effectiveFrom')" class="text-sm text-destructive">{{ fieldError('effectiveFrom') }}</p>
              <p v-else-if="startsInPast" class="text-sm text-foreground">
                Ese mes ya empezó. Si ya tiene cierre, regenéralo desde Cierres para aplicar la tarifa nueva.
              </p>
              <p v-else class="text-xs text-muted-foreground">Empieza el {{ formatDate(effectiveFrom) }}. Moneda: {{ MEMBERSHIP_DEFAULT_CURRENCY }}.</p>
            </fieldset>

            <div class="space-y-1.5">
              <Label for="rate-notes">Notas</Label>
              <Textarea
                id="rate-notes"
                v-model="notes"
                rows="3"
                maxlength="500"
                placeholder="Motivo del cambio o acuerdo con la administración"
                class="text-base"
              />
              <p v-if="fieldError('notes')" class="text-sm text-destructive">{{ fieldError('notes') }}</p>
            </div>

            <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button variant="outline" class="h-11" as-child>
                <NuxtLink to="/admin/membresia">Volver a Membresía</NuxtLink>
              </Button>
              <Button type="submit" class="h-11" :disabled="isSaving">
                <Loader2 v-if="isSaving" class="size-4 animate-spin" aria-hidden="true" />
                <Save v-else class="size-4" aria-hidden="true" />
                {{ isSaving ? 'Guardando...' : 'Guardar tarifa' }}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <section class="space-y-3" aria-labelledby="rates-history-title">
        <h2 id="rates-history-title" class="text-lg font-semibold">Historial de tarifas</h2>

        <ErrorAlert :message="error" />

        <ListSkeleton v-if="!hasFetched || (isLoading && rates.length === 0)" :count="2" variant="row" />

        <EmptyState
          v-else-if="!error && rates.length === 0"
          :icon="History"
          title="Todavía no hay tarifas"
          description="La primera que guardes aparecerá aquí."
        />

        <ul v-else class="space-y-2">
          <li v-for="rate in rates" :key="rate.id">
            <Card class="gap-0 px-4 py-3">
              <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
                <p class="text-base font-semibold">Desde el {{ formatDate(rate.effectiveFrom) }}</p>
                <Badge :variant="rateStatus(rate).variant">{{ rateStatus(rate).label }}</Badge>
              </div>
              <p class="mt-1 text-sm tabular-nums">
                {{ formatCurrency(rate.fullRate) }} completa, {{ formatCurrency(rate.reducedRate) }} reducida
                <span class="text-muted-foreground">({{ rate.currency }})</span>
              </p>
              <p v-if="rate.notes" class="mt-1 text-sm text-muted-foreground">{{ rate.notes }}</p>
              <p class="mt-1 text-xs text-muted-foreground">
                {{ rate.createdByName ? `Creada por ${rate.createdByName}` : 'Creada por el sistema' }}, el {{ formatDateTime(rate.createdAt) }}
              </p>
            </Card>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

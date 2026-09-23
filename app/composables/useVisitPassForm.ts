import type { DateValue } from 'reka-ui'
import type { UpdateQrInput, VisitorType } from '~~/shared/types/qr'

export type VisitPassFormMode = 'create' | 'edit'

/** 'keep' solo existe al editar: conserva la vigencia actual del pase. */
export type VisitPassDuration = 'keep' | '1d' | '2d' | '3d' | '7d' | '14d' | '30d' | 'custom'

/** Valores con los que arranca el formulario (query de visitante frecuente o pase a editar). */
export interface VisitPassFormInitial {
  visitorName?: string
  visitorDocument?: string | null
  visitorType?: VisitorType
  frequentVisitorId?: string | null
  /** Solo edición: vigencia actual del pase (ISO) */
  expiresAt?: string
  /** Solo edición: si el pase actual es multiuso */
  multiUse?: boolean
}

export interface VisitPassFormValues {
  visitorName: string
  visitorDocument: string
  visitorType: VisitorType
  /** ISO de vencimiento, o null si se mantiene la vigencia actual (edición) */
  expiresAt: string | null
  multiUse: boolean
  frequentVisitorId: string | null
  saveAsFrequent: boolean
}

export interface FrequentVisitorOption {
  id: string
  visitorName: string
  visitorDocument: string | null
  visitorType: string
}

const DURATION_DAYS: Record<Exclude<VisitPassDuration, 'keep' | 'custom'>, number> = {
  '1d': 1, '2d': 2, '3d': 3, '7d': 7, '14d': 14, '30d': 30,
}

const BASE_DURATION_OPTIONS: { value: VisitPassDuration; label: string }[] = [
  { value: '1d', label: '24 horas' },
  { value: '2d', label: '2 días' },
  { value: '3d', label: '3 días' },
  { value: '7d', label: '1 semana' },
  { value: '14d', label: '2 semanas' },
  { value: '30d', label: '1 mes' },
  { value: 'custom', label: 'Hasta una fecha' },
]

function pickerDateToISO(d: DateValue): string {
  return new Date(d.year, d.month - 1, d.day, 23, 59, 59).toISOString()
}

/**
 * Estado y reglas de presentación del formulario de pase de visita, compartido
 * por crear y editar. Las reglas de negocio (qué se puede editar) viven en el
 * servidor y en shared/lib/qr-pass.ts; aquí solo se arma lo que se envía.
 */
export function useVisitPassForm(mode: VisitPassFormMode, initial: VisitPassFormInitial = {}) {
  const visitorName = ref(initial.visitorName ?? '')
  const visitorDocument = ref(initial.visitorDocument ?? '')
  const visitorType = ref<VisitorType>(initial.visitorType ?? 'invitado')
  const frequentVisitorId = ref<string | null>(initial.frequentVisitorId ?? null)
  const saveAsFrequent = ref(false)

  const duration = ref<VisitPassDuration>(mode === 'edit' ? 'keep' : '1d')
  const customDate = shallowRef<DateValue | undefined>(undefined)

  const durationOptions = computed(() => mode === 'edit'
    ? [{ value: 'keep' as const, label: 'Mantener la vigencia actual' }, ...BASE_DURATION_OPTIONS]
    : BASE_DURATION_OPTIONS)

  const isMultiUse = computed(() => {
    if (duration.value === 'keep') return initial.multiUse ?? false
    return duration.value !== '1d'
  })

  /** Se calcula al enviar para que "24 horas" cuente desde ese momento. */
  function resolveExpiresAt(): string | null {
    if (duration.value === 'keep') return null
    if (duration.value === 'custom') return customDate.value ? pickerDateToISO(customDate.value) : null
    const expires = new Date()
    expires.setDate(expires.getDate() + DURATION_DAYS[duration.value])
    return expires.toISOString()
  }

  const trimmedName = computed(() => visitorName.value.trim())
  const trimmedDocument = computed(() => visitorDocument.value.trim())

  const isComplete = computed(() => {
    if (trimmedName.value === '' || trimmedDocument.value === '') return false
    if (duration.value === 'custom') return !!customDate.value
    return true
  })

  const hasChanges = computed(() => {
    if (mode === 'create') return true
    return trimmedName.value !== (initial.visitorName ?? '').trim()
      || trimmedDocument.value !== (initial.visitorDocument ?? '').trim()
      || duration.value !== 'keep'
  })

  const canSubmit = computed(() => isComplete.value && hasChanges.value)

  function selectFrequent(visitor: FrequentVisitorOption) {
    visitorName.value = visitor.visitorName
    visitorDocument.value = visitor.visitorDocument ?? ''
    visitorType.value = visitor.visitorType === 'proveedor' ? 'proveedor' : 'invitado'
    frequentVisitorId.value = visitor.id
  }

  function values(): VisitPassFormValues {
    return {
      visitorName: trimmedName.value,
      visitorDocument: trimmedDocument.value,
      visitorType: visitorType.value,
      expiresAt: resolveExpiresAt(),
      multiUse: isMultiUse.value,
      frequentVisitorId: frequentVisitorId.value,
      saveAsFrequent: saveAsFrequent.value,
    }
  }

  return {
    visitorName,
    visitorDocument,
    visitorType,
    frequentVisitorId,
    saveAsFrequent,
    duration,
    customDate,
    durationOptions,
    isMultiUse,
    canSubmit,
    hasChanges,
    selectFrequent,
    values,
  }
}

/**
 * Cambios de un formulario de edición frente al pase original, listos para
 * PATCH /api/qr/[id]. null si no hay nada que guardar.
 */
export function toQrUpdateInput(values: VisitPassFormValues, original: VisitPassFormInitial): UpdateQrInput | null {
  const input: UpdateQrInput = {}
  if (values.visitorName !== (original.visitorName ?? '').trim()) input.visitorName = values.visitorName
  if (values.visitorDocument !== (original.visitorDocument ?? '').trim()) input.visitorDocument = values.visitorDocument
  if (values.expiresAt) {
    input.expiresAt = values.expiresAt
    if (values.multiUse !== (original.multiUse ?? false)) input.multiUse = values.multiUse
  }
  return Object.keys(input).length > 0 ? input : null
}

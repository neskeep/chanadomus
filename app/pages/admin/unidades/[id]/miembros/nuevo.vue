<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { HouseholdRelationship } from '~~/shared/types/household'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const unitId = route.params.id as string

const {
  isSubmitting,
  createMember,
} = useUnitMembers(unitId)

// Unit data for breadcrumb
const unit = ref<{ id: string, number: string, label: string | null } | null>(null)

async function fetchUnit() {
  try {
    const res = await $fetch<{ data: { id: string, number: string, label: string | null }[] }>('/api/units')
    unit.value = res.data.find(u => u.id === unitId) ?? null
  }
  catch { /* ignore */ }
}

// Breadcrumb
const pageOverride = computed(() => {
  const unitLabel = unit.value ? `Unidad ${unit.value.number}` : 'Unidad'
  return {
    title: 'Agregar miembro',
    breadcrumbs: [
      { label: 'Unidades', to: '/admin/unidades' },
      { label: unitLabel, to: `/admin/unidades/${unitId}` },
    ],
  }
})
usePageInfoOverride(pageOverride)

// Form state
const form = ref({
  name: '',
  relationship: 'owner' as HouseholdRelationship,
  idDocument: '',
  phone: '',
})

const canSubmit = computed(() =>
  form.value.name.trim().length > 0
  && !isSubmitting.value,
)

async function handleSubmit() {
  if (!canSubmit.value) return
  try {
    await createMember({
      name: form.value.name.trim(),
      relationship: form.value.relationship,
      idDocument: form.value.idDocument.trim() || undefined,
      phone: form.value.phone.trim() || undefined,
    })
    toast.success('Miembro agregado')
    router.push(`/admin/unidades/${unitId}`)
  }
  catch {
    toast.error('Error al agregar miembro')
  }
}

onMounted(() => {
  fetchUnit()
})
</script>

<template>
  <div>
    <Card>
      <CardContent class="p-5 md:p-8">
        <form class="space-y-6" @submit.prevent="handleSubmit">
          <div class="space-y-1.5">
            <Label for="member-name">Nombre <span class="text-destructive">*</span></Label>
            <Input
              id="member-name"
              v-model="form.name"
              placeholder="Nombre completo"
              required
              class="h-12 text-base"
            />
          </div>

          <div class="space-y-1.5">
            <Label for="member-relationship">Parentesco <span class="text-destructive">*</span></Label>
            <Select v-model="form.relationship">
              <SelectTrigger id="member-relationship" size="lg" class="text-base">
                <SelectValue placeholder="Seleccionar parentesco" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">Propietario</SelectItem>
                <SelectItem value="spouse">Conyuge</SelectItem>
                <SelectItem value="child">Hijo/a</SelectItem>
                <SelectItem value="tenant">Inquilino</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label for="member-id-document">Documento de identidad</Label>
              <Input
                id="member-id-document"
                v-model="form.idDocument"
                placeholder="Opcional"
                class="h-12 text-base"
              />
            </div>

            <div class="space-y-1.5">
              <Label for="member-phone">Telefono</Label>
              <Input
                id="member-phone"
                v-model="form.phone"
                placeholder="Opcional"
                type="tel"
                class="h-12 text-base"
              />
            </div>
          </div>

          <Button
            type="submit"
            class="h-12 w-full text-base font-semibold"
            :disabled="!canSubmit"
          >
            <Loader2 v-if="isSubmitting" class="mr-2 size-4 animate-spin" />
            {{ isSubmitting ? 'Agregando...' : 'Agregar miembro' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>

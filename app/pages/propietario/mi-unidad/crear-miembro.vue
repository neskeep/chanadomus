<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { HouseholdRelationship } from '~~/shared/types/household'

useHead({ title: 'Agregar Integrante' })

const router = useRouter()
const { isSubmitting, error, createMember, generateMemberPass } = useMyUnit()

const formName = ref('')
const formRelationship = ref<HouseholdRelationship | ''>('')
const formDocument = ref('')
const formPhone = ref('')

const canSubmit = computed(() =>
  formName.value.trim().length > 0
  && formRelationship.value !== ''
  && formDocument.value.trim().length > 0
  && !isSubmitting.value,
)

async function handleSubmit() {
  if (!canSubmit.value) return
  try {
    const member = await createMember({
      name: formName.value.trim(),
      relationship: formRelationship.value as HouseholdRelationship,
      idDocument: formDocument.value.trim() || undefined,
      phone: formPhone.value.trim() || undefined,
    })
    // Auto-generate QR pass
    try {
      await generateMemberPass(member.id)
    }
    catch {
      // Non-blocking: pass generation failure shouldn't prevent creation
    }
    toast.success('Integrante agregado con pase QR')
    router.push(`/propietario/mi-unidad/editar-miembro/${member.id}`)
  }
  catch {
    toast.error(error.value ?? 'Error al guardar')
  }
}
</script>

<template>
  <div>
    <Card>
      <CardContent class="p-5 md:p-8">
        <form class="space-y-6" @submit.prevent="handleSubmit">
          <ErrorAlert v-if="error" :message="error" />

          <div class="space-y-1.5">
            <Label for="member-name">Nombre completo <span class="text-destructive">*</span></Label>
            <Input
              id="member-name"
              v-model="formName"
              placeholder="Nombre completo"
              class="h-12 text-base"
              required
            />
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label for="member-relationship">Parentesco <span class="text-destructive">*</span></Label>
              <Select v-model="formRelationship">
                <SelectTrigger id="member-relationship" size="lg" class="text-base">
                  <SelectValue placeholder="Seleccionar parentesco" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Propietario</SelectItem>
                  <SelectItem value="spouse">Cónyuge</SelectItem>
                  <SelectItem value="child">Hijo/a</SelectItem>
                  <SelectItem value="tenant">Inquilino</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-1.5">
              <Label for="member-document">Cédula <span class="text-destructive">*</span></Label>
              <Input
                id="member-document"
                v-model="formDocument"
                placeholder="V-12345678"
                class="h-12 text-base"
                required
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <Label for="member-phone">Teléfono</Label>
            <Input
              id="member-phone"
              v-model="formPhone"
              placeholder="0412-1234567"
              type="tel"
              class="h-12 text-base"
            />
          </div>

          <Button
            type="submit"
            class="h-12 w-full text-base font-semibold"
            :disabled="!canSubmit"
          >
            <Loader2 v-if="isSubmitting" class="mr-2 size-4 animate-spin" />
            {{ isSubmitting ? 'Guardando...' : 'Agregar Integrante' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>

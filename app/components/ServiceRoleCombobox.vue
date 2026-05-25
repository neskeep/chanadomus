<script setup lang="ts">
import { Check, ChevronsUpDown, Search, Plus, Loader2 } from 'lucide-vue-next'

interface RoleOption {
  id: string
  name: string
}

const props = withDefaults(defineProps<{
  modelValue?: string
  roles: RoleOption[]
  placeholder?: string
  required?: boolean
  disabled?: boolean
}>(), {
  modelValue: undefined,
  placeholder: 'Seleccionar categoría',
  required: false,
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined]
  'create': [role: RoleOption]
}>()

const open = ref(false)
const search = ref('')
const triggerEl = ref<HTMLElement | null>(null)
const dropStyle = ref<Record<string, string>>({})

// Inline create state
const isCreating = ref(false)
const isSubmitting = ref(false)

function updatePosition() {
  if (!triggerEl.value) return
  const rect = triggerEl.value.getBoundingClientRect()
  dropStyle.value = {
    position: 'fixed',
    top: `${rect.bottom + 4}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
  }
}

function toggle() {
  if (open.value) {
    close()
  }
  else {
    updatePosition()
    open.value = true
    nextTick(() => {
      const input = document.querySelector<HTMLInputElement>('[data-role-search]')
      input?.focus()
    })
  }
}

const sortedRoles = computed(() =>
  [...props.roles].sort((a, b) => a.name.localeCompare(b.name, 'es')),
)

const filteredOptions = computed(() => {
  if (!search.value.trim()) return sortedRoles.value
  const q = search.value.trim().toLowerCase()
  return sortedRoles.value.filter(r => r.name.toLowerCase().includes(q))
})

const selectedLabel = computed(() => {
  if (!props.modelValue) return null
  const role = props.roles.find(r => r.id === props.modelValue)
  return role?.name ?? null
})

// Check if search term already exists
const canCreate = computed(() => {
  if (!search.value.trim()) return false
  const q = search.value.trim().toLowerCase()
  return !props.roles.some(r => r.name.toLowerCase() === q)
})

function selectRole(roleId: string) {
  emit('update:modelValue', roleId)
  close()
}

function close() {
  open.value = false
  search.value = ''
  isCreating.value = false
}

async function handleCreate() {
  if (!canCreate.value || isSubmitting.value) return
  const name = search.value.trim()
  isSubmitting.value = true
  try {
    const { createRole } = useServiceRoles()
    const newRole = await createRole(name)
    emit('create', { id: newRole.id, name: newRole.name })
    emit('update:modelValue', newRole.id)
    close()
  }
  catch {
    // Error handled by composable
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="w-full">
    <button
      ref="triggerEl"
      type="button"
      role="combobox"
      :aria-expanded="open"
      :disabled="disabled"
      class="flex h-12 w-full items-center justify-between rounded-3xl border border-transparent bg-input/50 px-3 text-base transition-[color,box-shadow,background-color] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"
      @click="toggle"
    >
      <span :class="selectedLabel ? 'text-foreground' : 'text-muted-foreground'">
        {{ selectedLabel ?? placeholder }}
      </span>
      <ChevronsUpDown class="size-4 shrink-0 text-muted-foreground" />
    </button>

    <Teleport to="body">
      <!-- Backdrop -->
      <div
        v-if="open"
        class="fixed inset-0 z-50"
        @click="close"
      />

      <!-- Dropdown -->
      <div
        v-if="open"
        class="z-50 overflow-hidden rounded-2xl border bg-popover shadow-lg"
        :style="dropStyle"
      >
        <!-- Search -->
        <div class="flex items-center gap-2 border-b px-3 py-2.5">
          <Search class="size-4 shrink-0 text-muted-foreground" />
          <input
            data-role-search
            v-model="search"
            placeholder="Buscar o crear categoría..."
            class="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            @keydown.escape="close"
            @keydown.enter="canCreate ? handleCreate() : undefined"
          />
        </div>

        <!-- List -->
        <div class="max-h-56 overflow-y-auto overscroll-contain p-1">
          <template v-if="filteredOptions.length > 0">
            <button
              v-for="role in filteredOptions"
              :key="role.id"
              type="button"
              class="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-sm transition-colors hover:bg-accent"
              @click="selectRole(role.id)"
            >
              <Check
                class="size-4 shrink-0"
                :class="modelValue === role.id ? 'opacity-100' : 'opacity-0'"
              />
              <span>{{ role.name }}</span>
            </button>
          </template>

          <!-- Create new option -->
          <button
            v-if="canCreate"
            type="button"
            class="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-medium text-primary transition-colors hover:bg-accent"
            :disabled="isSubmitting"
            @click="handleCreate"
          >
            <Loader2 v-if="isSubmitting" class="size-4 shrink-0 animate-spin" />
            <Plus v-else class="size-4 shrink-0" />
            <span>Crear "{{ search.trim() }}"</span>
          </button>

          <!-- No results and can't create -->
          <p
            v-if="filteredOptions.length === 0 && !canCreate"
            class="py-4 text-center text-sm text-muted-foreground"
          >
            No se encontraron categorías
          </p>
        </div>
      </div>
    </Teleport>
  </div>
</template>

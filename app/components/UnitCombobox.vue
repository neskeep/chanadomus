<script setup lang="ts">
import { Check, ChevronsUpDown, Search } from 'lucide-vue-next'

interface UnitOption {
  id: string
  number: string
  label: string | null
}

const props = withDefaults(defineProps<{
  modelValue?: string
  units: UnitOption[]
  placeholder?: string
  required?: boolean
  disabled?: boolean
}>(), {
  modelValue: undefined,
  placeholder: 'Seleccionar rancho',
  required: false,
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined]
}>()

const open = ref(false)
const search = ref('')
const triggerEl = ref<HTMLElement | null>(null)
const dropStyle = ref<Record<string, string>>({})

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
    open.value = false
    search.value = ''
  }
  else {
    updatePosition()
    open.value = true
    nextTick(() => {
      const input = document.querySelector<HTMLInputElement>('[data-unit-search]')
      input?.focus()
    })
  }
}

// Filter only ranchos (R-XXX), sort by label alphabetically
const ranchoOptions = computed(() =>
  props.units
    .filter(u => u.number.startsWith('R-'))
    .sort((a, b) => (a.label ?? a.number).localeCompare(b.label ?? b.number, 'es')),
)

const filteredOptions = computed(() => {
  if (!search.value.trim()) return ranchoOptions.value
  const q = search.value.trim().toLowerCase()
  return ranchoOptions.value.filter(u =>
    (u.label ?? '').toLowerCase().includes(q)
    || u.number.toLowerCase().includes(q),
  )
})

const selectedLabel = computed(() => {
  if (!props.modelValue) return null
  const unit = props.units.find(u => u.id === props.modelValue)
  return unit?.label ?? unit?.number ?? null
})

function selectUnit(unitId: string) {
  emit('update:modelValue', unitId)
  open.value = false
  search.value = ''
}

function close() {
  open.value = false
  search.value = ''
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
            data-unit-search
            v-model="search"
            placeholder="Buscar rancho..."
            class="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            @keydown.escape="close"
          />
        </div>

        <!-- List -->
        <div class="max-h-56 overflow-y-auto overscroll-contain p-1">
          <template v-if="filteredOptions.length > 0">
            <button
              v-for="unit in filteredOptions"
              :key="unit.id"
              type="button"
              class="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-sm transition-colors hover:bg-accent"
              @click="selectUnit(unit.id)"
            >
              <Check
                class="size-4 shrink-0"
                :class="modelValue === unit.id ? 'opacity-100' : 'opacity-0'"
              />
              <span>{{ unit.label ?? unit.number }}</span>
            </button>
          </template>
          <p v-else class="py-4 text-center text-sm text-muted-foreground">
            No se encontraron ranchos
          </p>
        </div>
      </div>
    </Teleport>
  </div>
</template>

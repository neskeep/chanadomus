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
  placeholder: 'Seleccionar unidad',
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

// Group units by type prefix
interface UnitGroup {
  key: string
  label: string
  units: UnitOption[]
}

const groupOrder: Record<string, string> = {
  'R': 'Ranchos',
  'P': 'Parcelas',
}

function sortUnits(list: UnitOption[]) {
  return [...list].sort((a, b) => (a.label ?? a.number).localeCompare(b.label ?? b.number, 'es'))
}

function getPrefix(unit: UnitOption): string {
  const dash = unit.number.indexOf('-')
  return dash > 0 ? unit.number.slice(0, dash) : ''
}

const groupedOptions = computed<UnitGroup[]>(() => {
  const source = search.value.trim()
    ? (() => {
        const q = search.value.trim().toLowerCase()
        return props.units.filter(u =>
          (u.label ?? '').toLowerCase().includes(q)
          || u.number.toLowerCase().includes(q),
        )
      })()
    : props.units

  const groups = new Map<string, UnitOption[]>()
  for (const unit of source) {
    const prefix = getPrefix(unit)
    if (!groups.has(prefix)) groups.set(prefix, [])
    groups.get(prefix)!.push(unit)
  }

  // Known prefixes first in order, then unknown
  const known = Object.keys(groupOrder)
  const result: UnitGroup[] = []
  for (const k of known) {
    const items = groups.get(k)
    if (items?.length) {
      result.push({ key: k, label: groupOrder[k]!, units: sortUnits(items) })
      groups.delete(k)
    }
  }
  for (const [k, items] of groups) {
    if (items.length) {
      result.push({ key: k, label: k || 'Otros', units: sortUnits(items) })
    }
  }
  return result
})

const hasResults = computed(() => groupedOptions.value.some(g => g.units.length > 0))

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
        data-unit-combobox-dropdown
        class="fixed inset-0 z-50"
        @click="close"
      />

      <!-- Dropdown -->
      <div
        v-if="open"
        data-unit-combobox-dropdown
        class="z-50 overflow-hidden rounded-2xl border bg-popover shadow-lg"
        :style="dropStyle"
      >
        <!-- Search -->
        <div class="flex items-center gap-2 border-b px-3 py-2.5">
          <Search class="size-4 shrink-0 text-muted-foreground" />
          <input
            v-model="search"
            data-unit-search
            placeholder="Buscar unidad..."
            class="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            @keydown.escape="close"
          >
        </div>

        <!-- List -->
        <div class="max-h-56 overflow-y-auto overscroll-contain p-1">
          <template v-if="hasResults">
            <div v-for="(group, gi) in groupedOptions" :key="group.key">
              <div
                v-if="groupedOptions.length > 1"
                class="px-2.5 pb-1 text-xs font-medium text-muted-foreground"
                :class="gi > 0 ? 'mt-2 border-t pt-2' : 'pt-1'"
              >
                {{ group.label }}
              </div>
              <button
                v-for="unit in group.units"
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
            </div>
          </template>
          <p v-else class="py-4 text-center text-sm text-muted-foreground">
            No se encontraron unidades
          </p>
        </div>
      </div>
    </Teleport>
  </div>
</template>

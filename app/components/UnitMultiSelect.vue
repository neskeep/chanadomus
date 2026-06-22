<script setup lang="ts">
import { ChevronsUpDown, Search } from 'lucide-vue-next'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

interface UnitOption {
  id: string
  number: string
  label: string | null
}

interface UnitGroup {
  key: string
  label: string
  units: UnitOption[]
}

const props = withDefaults(defineProps<{
  modelValue: string[]
  units: UnitOption[]
  disabled?: boolean
}>(), {
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const search = ref('')

const groupOrder: Record<string, string> = {
  'R': 'Ranchos',
  'P': 'Parcelas',
}

function getPrefix(unit: UnitOption): string {
  const dash = unit.number.indexOf('-')
  return dash > 0 ? unit.number.slice(0, dash) : ''
}

function sortUnits(list: UnitOption[]) {
  return [...list].sort((a, b) => (a.label ?? a.number).localeCompare(b.label ?? b.number, 'es'))
}

function matchesSearch(unit: UnitOption): boolean {
  if (!search.value) return true
  const s = search.value.toLowerCase()
  return unit.number.toLowerCase().includes(s) || (unit.label?.toLowerCase().includes(s) ?? false)
}

const groupedOptions = computed<UnitGroup[]>(() => {
  const source = props.units.filter(u => matchesSearch(u))

  const groups = new Map<string, UnitOption[]>()
  for (const unit of source) {
    const prefix = getPrefix(unit)
    if (!groups.has(prefix)) groups.set(prefix, [])
    groups.get(prefix)!.push(unit)
  }

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

const selectedSet = computed(() => new Set(props.modelValue))

const allSelected = computed(() =>
  props.units.length > 0 && selectedSet.value.size === props.units.length,
)

const selectionLabel = computed(() => {
  const count = selectedSet.value.size
  if (count === 0) return 'Ninguna unidad seleccionada'
  if (count === props.units.length) return `Todas las unidades (${props.units.length})`
  return `${count} de ${props.units.length} unidades`
})

function toggle(id: string) {
  const next = isSelected(id)
    ? props.modelValue.filter(v => v !== id)
    : [...props.modelValue, id]
  emit('update:modelValue', next)
}

function toggleAll() {
  emit('update:modelValue', allSelected.value ? [] : props.units.map(u => u.id))
}
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        role="listbox"
        :aria-expanded="true"
        :aria-label="selectionLabel"
        :disabled="disabled"
        class="h-12 w-full justify-between rounded-3xl border border-transparent bg-input/50 text-base font-normal transition-[color,box-shadow,background-color] hover:bg-input/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        <span :class="modelValue.length > 0 ? 'text-foreground' : 'text-muted-foreground'">
          {{ selectionLabel }}
        </span>
        <ChevronsUpDown class="size-4 shrink-0 text-muted-foreground" />
      </Button>
    </PopoverTrigger>

    <PopoverContent
      class="w-[--reka-popover-trigger-width] gap-0 p-0"
      align="start"
      @open-auto-focus.prevent
    >
      <!-- Search -->
      <div class="flex items-center gap-2 border-b px-3 py-2.5">
        <Search class="size-4 shrink-0 text-muted-foreground" />
        <input
          v-model="search"
          placeholder="Buscar unidad..."
          class="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        >
      </div>

      <!-- Select/Deselect all -->
      <div class="border-b px-3 py-2">
        <button
          type="button"
          class="text-xs font-medium text-primary hover:underline"
          @click="toggleAll"
        >
          {{ allSelected ? 'Deseleccionar todas' : 'Seleccionar todas' }}
        </button>
      </div>

      <!-- Scrollable list -->
      <div class="max-h-64 overflow-y-auto overscroll-contain p-1">
        <template v-if="hasResults">
          <div v-for="(group, gi) in groupedOptions" :key="group.key">
            <div
              v-if="groupedOptions.length > 1"
              class="px-2.5 pb-1 text-xs font-medium text-muted-foreground"
              :class="gi > 0 ? 'mt-2 border-t pt-2' : 'pt-1'"
            >
              {{ group.label }}
            </div>
            <div
              v-for="unit in group.units"
              :key="unit.id"
              class="flex cursor-pointer items-center gap-2 rounded-xl px-2.5 py-2 text-sm transition-colors hover:bg-accent"
              @click="toggle(unit.id)"
            >
              <Checkbox
                :checked="selectedSet.has(unit.id)"
                @click.stop
                @update:checked="() => toggle(unit.id)"
              />
              <span>{{ unit.label ?? unit.number }}</span>
            </div>
          </div>
        </template>
        <p v-else class="py-4 text-center text-sm text-muted-foreground">
          No se encontraron unidades
        </p>
      </div>
    </PopoverContent>
  </Popover>
</template>

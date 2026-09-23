<script setup lang="ts">
import type { AcceptableValue } from 'reka-ui'

interface FilterOption {
  value: string
  label: string
}

const model = defineModel<string>({ required: true })

const props = withDefaults(defineProps<{
  label: string
  options: FilterOption[]
  /**
   * `chips` (por defecto): botones en línea, para pocas opciones.
   * `list`: buscador + lista vertical con scroll, para catálogos largos.
   * Se renderiza inline dentro del popover de TopbarFilters (sin popover anidado).
   */
  variant?: 'chips' | 'list'
  /** Texto de la opción que quita el filtro (solo `list`). */
  allLabel?: string
  /** Placeholder del buscador (solo `list`). */
  searchPlaceholder?: string
}>(), {
  variant: 'chips',
  allLabel: 'Todas',
  searchPlaceholder: 'Buscar...',
})

const labelId = useId()

// Clases de ítem de la variante `list` (el check de CommandItem se colorea con el token primary).
const LIST_ITEM_CLASS = 'rounded-lg px-2.5 py-2 font-normal leading-snug sm:py-1.5 data-highlighted:bg-muted *:[svg]:text-primary data-[state=checked]:font-medium'

// Orden alfabético en español para que la lista larga sea fácil de recorrer.
const sortedOptions = computed(() =>
  [...props.options].sort((a, b) => a.label.localeCompare(b.label, 'es')),
)

// El filtro de Command (reka useFilter, sensitivity: 'base') ya ignora mayúsculas y acentos.
// Listbox en modo toggle emite undefined al volver a pulsar la opción activa: equivale a "sin filtro".
// Al reabrir el filtro, la opción activa puede estar fuera de vista en una lista larga.
const rootEl = ref<HTMLElement | null>(null)
onMounted(() => {
  if (props.variant !== 'list' || !model.value) return
  // Esperamos un frame: el popover aún se está posicionando al montar.
  requestAnimationFrame(() => {
    const list = rootEl.value?.querySelector<HTMLElement>('[data-slot="command-list"]')
    const item = list?.querySelector<HTMLElement>('[data-slot="command-item"][data-state="checked"]')
    if (!list || !item) return
    const offset = item.getBoundingClientRect().top - list.getBoundingClientRect().top
    list.scrollTop += offset - (list.clientHeight - item.offsetHeight) / 2
  })
})

function onListSelect(value: AcceptableValue | AcceptableValue[] | undefined) {
  model.value = typeof value === 'string' ? value : ''
}
</script>

<template>
  <div ref="rootEl">
    <p :id="labelId" class="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{{ label }}</p>

    <div v-if="variant === 'chips'" class="flex flex-wrap gap-1">
      <button
        v-for="opt in options"
        :key="opt.value"
        type="button"
        class="rounded-lg px-2 py-1 text-xs font-medium transition-colors"
        :class="model === opt.value
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground hover:text-foreground'"
        :aria-pressed="model === opt.value"
        @click="model = model === opt.value ? '' : opt.value"
      >
        {{ opt.label }}
      </button>
    </div>

    <Command
      v-else
      :model-value="model"
      highlight-on-hover
      class="rounded-lg border border-border p-0"
      @update:model-value="onListSelect"
    >
      <CommandInput :placeholder="searchPlaceholder" :aria-label="searchPlaceholder" />
      <CommandList :aria-labelledby="labelId" class="max-h-56 overscroll-contain p-1">
        <CommandEmpty class="py-4 text-xs text-muted-foreground">
          Sin resultados
        </CommandEmpty>
        <CommandGroup class="p-0">
          <CommandItem
            value=""
            :data-checked="model === ''"
            :class="[LIST_ITEM_CLASS, 'text-muted-foreground data-highlighted:text-foreground data-[state=checked]:text-foreground']"
          >
            {{ allLabel }}
          </CommandItem>
          <CommandItem
            v-for="opt in sortedOptions"
            :key="opt.value"
            :value="opt.value"
            :data-checked="model === opt.value"
            :class="LIST_ITEM_CLASS"
          >
            <span class="min-w-0 flex-1 break-words">{{ opt.label }}</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  </div>
</template>

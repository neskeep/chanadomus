<script setup lang="ts" generic="T extends string">
const model = defineModel<T>({ required: true })

const props = defineProps<{
  placeholder?: string
  options: Array<{ value: T; label: string }>
}>()

const ALL_VALUE = '__all__'

const allOption = computed(() => props.options.find(o => o.value === ''))
const selectOptions = computed(() => props.options.filter(o => o.value !== ''))

const internalValue = computed({
  get: () => (model.value === '' ? ALL_VALUE : model.value) as string,
  set: (v: string) => { model.value = (v === ALL_VALUE ? '' : v) as T },
})
</script>

<template>
  <Select v-model="internalValue">
    <SelectTrigger class="h-8 w-auto text-sm">
      <SelectValue :placeholder="placeholder" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem v-if="allOption" :value="ALL_VALUE">
        {{ allOption.label }}
      </SelectItem>
      <SelectItem v-for="opt in selectOptions" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </SelectItem>
    </SelectContent>
  </Select>
</template>

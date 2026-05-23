<script setup lang="ts">
interface KeyValueItem {
  key: string
  value: string
}

interface Props {
  items: KeyValueItem[]
  keyLabel?: string
  valueLabel?: string
}

withDefaults(defineProps<Props>(), {
  keyLabel: 'Campo',
  valueLabel: 'Descripcion',
})
</script>

<template>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead class="text-sm">
          {{ keyLabel }}
        </TableHead>
        <TableHead class="text-sm">
          {{ valueLabel }}
        </TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow v-for="item in items" :key="item.key">
        <TableCell class="text-sm font-medium">
          {{ item.key }}
        </TableCell>
        <TableCell class="text-sm">
          {{ item.value }}
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>

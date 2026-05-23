<script setup lang="ts">
const { groups, activeId, scrollTo } = useDocsNavigation()
</script>

<template>
  <nav aria-label="Índice de documentación" class="space-y-1">
    <Collapsible
      v-for="group in groups"
      :key="group.label"
      :default-open="true"
    >
      <CollapsibleTrigger class="flex w-full items-center py-2">
        <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {{ group.label }}
        </span>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div class="space-y-0.5 pb-2">
          <button
            v-for="item in group.items"
            :key="item.id"
            class="w-full rounded-lg px-3 py-1.5 text-left text-sm transition-colors hover:bg-accent"
            :class="activeId === item.id ? 'bg-accent font-medium text-accent-foreground' : 'text-muted-foreground'"
            @click="scrollTo(item.id)"
          >
            {{ item.label }}
          </button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  </nav>
</template>

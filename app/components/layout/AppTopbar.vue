<script setup lang="ts">
const pageInfo = usePageInfo()
</script>

<template>
  <header class="hidden md:flex shrink-0 h-[68px] items-center border-b bg-background px-5 lg:px-6">
    <div class="min-w-0 shrink-0">
      <!-- Breadcrumb mode -->
      <Breadcrumb v-if="pageInfo.breadcrumbs?.length">
        <BreadcrumbList>
          <template v-for="crumb in pageInfo.breadcrumbs" :key="crumb.to">
            <BreadcrumbItem>
              <BreadcrumbLink as-child>
                <NuxtLink :to="crumb.to" class="text-sm">
                  {{ crumb.label }}
                </NuxtLink>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </template>
          <BreadcrumbItem>
            <BreadcrumbPage class="text-sm font-semibold">
              {{ pageInfo.title }}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <!-- Default title mode -->
      <template v-else>
        <div class="flex flex-col">
          <h1 class="text-base font-semibold truncate leading-tight">{{ pageInfo.title }}</h1>
          <p v-if="pageInfo.description" class="text-xs text-muted-foreground truncate">{{ pageInfo.description }}</p>
        </div>
      </template>
    </div>

    <div class="ml-auto flex items-center gap-2">
      <div id="topbar-actions" class="flex items-center gap-2" />
      <PanicButton />
    </div>
  </header>
</template>

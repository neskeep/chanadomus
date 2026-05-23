<script setup lang="ts">
import { SearchIcon } from 'lucide-vue-next'

definePageMeta({ layout: 'default' })

const { target, isMounted } = useTopbarPortal()
const { openSearch } = useDocsSearch()
</script>

<template>
  <div>
    <!-- Topbar action: search button (desktop) -->
    <Teleport v-if="isMounted" :to="target" defer>
      <Button variant="ghost" size="icon" class="size-8" @click="openSearch()">
        <SearchIcon class="size-4" />
      </Button>
    </Teleport>

    <!-- Topbar action: search button (mobile) -->
    <TopbarMobileAction>
      <Button variant="ghost" size="icon" class="size-8" @click="openSearch()">
        <SearchIcon class="size-4" />
      </Button>
    </TopbarMobileAction>

    <DocsLayout>
      <DocsIntroduccionContent />
      <DocsRolesContent />
      <DocsUsuariosContent />
      <DocsInvitacionesContent />
      <DocsUnidadesContent />
      <DocsMiembrosContent />
      <DocsVehiculosContent />
      <DocsQrContent />
      <DocsEscaneoContent />
      <DocsAccesosContent />
      <DocsPasesVehicularesContent />
      <DocsVisitantesFrecuentesContent />
      <DocsPanicoContent />
      <DocsIncidenciasContent />
      <DocsChatContent />
      <DocsCarteleraContent />
      <DocsNotificacionesContent />
      <DocsVotacionesContent />
      <DocsReunionesContent />
      <DocsNormativasContent />
      <DocsFinanzasContent />
      <DocsPersonalContent />
      <DocsProveedoresContent />
      <DocsPerfilContent />
    </DocsLayout>
  </div>
</template>

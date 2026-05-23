<script setup lang="ts">
const stepsGenerar = [
  'Ir a Gestión > Pases Vehiculares',
  'Presionar "Nuevo pase"',
  'Seleccionar el vehículo al que se asignará el pase (debe estar registrado previamente)',
  'Opcionalmente establecer un límite de ocupantes',
  'Establecer fecha de expiración (opcional)',
  'Generar el pase',
]

const tiposPases = [
  { key: 'Pase de residente', value: 'Para vehículos de propietarios y residentes. Acceso permanente o con fecha de expiración.' },
  { key: 'Pase de invitado', value: 'Para vehículos de visitantes. Generalmente de uso temporal.' },
]
</script>

<template>
  <DocsSection id="pases-vehiculares" title="Pases vehiculares">
    <DocsRoleBadges :roles="['admin']" />

    <p class="mt-3 text-sm leading-relaxed text-muted-foreground">
      Los pases vehiculares son códigos QR asignados a vehículos registrados en el sistema. Permiten
      un control de acceso vehicular más ágil, especialmente para residentes con múltiples vehículos.
    </p>

    <DocsSubSection id="pases-generar" title="Generar un pase vehicular">
      <DocsStepList :steps="stepsGenerar" />

      <div class="mt-4">
        <DocsNote variant="info">
          Solo es posible generar pases para vehículos previamente registrados en una unidad. Si el
          vehículo no aparece en la lista, primero regístrelo en la sección de la unidad correspondiente.
        </DocsNote>
      </div>
    </DocsSubSection>

    <DocsSubSection id="pases-tipos" title="Tipos de pases">
      <DocsKeyValue :items="tiposPases" key-label="Tipo" value-label="Descripción" />
    </DocsSubSection>

    <DocsSubSection id="pases-administrar" title="Administrar pases">
      <p class="text-sm leading-relaxed text-muted-foreground">
        Los pases activos se pueden desactivar en cualquier momento desde la lista de pases vehiculares.
        Al desactivar un pase, se registra la fecha de desactivación y el pase deja de ser válido de
        forma inmediata.
      </p>

      <p class="mt-3 text-sm leading-relaxed text-muted-foreground">
        Los pases cuya fecha de expiración ha pasado se muestran como inactivos automáticamente, sin
        necesidad de intervención manual.
      </p>
    </DocsSubSection>
  </DocsSection>
</template>

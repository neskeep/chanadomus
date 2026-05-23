<script setup lang="ts">
const stepsCrear = [
  'Ir a Comunidad > Cartelera',
  'Presionar "Nuevo anuncio"',
  'Escribir un título claro y conciso',
  'Redactar el contenido del anuncio',
  'Seleccionar la categoría: General, Mantenimiento, Seguridad, Financiero, Evento o Urgente',
  'Opcionalmente adjuntar un archivo',
  'Seleccionar el estado: Borrador (para publicar después) o Publicado (visible de inmediato)',
  'Guardar',
]

const categoriasAnuncios = [
  { key: 'General', value: 'Información de interés general para la comunidad.' },
  { key: 'Mantenimiento', value: 'Avisos sobre trabajos de mantenimiento programados.' },
  { key: 'Seguridad', value: 'Alertas y recomendaciones de seguridad.' },
  { key: 'Financiero', value: 'Comunicados sobre cuotas, pagos o estados de cuenta.' },
  { key: 'Evento', value: 'Invitaciones a eventos comunitarios.' },
  { key: 'Urgente', value: 'Situaciones que requieren atención inmediata de todos los residentes.' },
]

const cicloVida = [
  { key: 'Borrador', value: 'El anuncio existe pero no es visible para los residentes. Permite preparar comunicados con anticipación.' },
  { key: 'Publicado', value: 'El anuncio es visible para todos los residentes en la cartelera comunitaria.' },
  { key: 'Archivado', value: 'El anuncio se retira de la vista principal pero permanece en el historial.' },
]
</script>

<template>
  <DocsSection id="cartelera" title="Cartelera y anuncios">
    <DocsRoleBadges :roles="['admin']" />

    <p class="mt-3 text-sm leading-relaxed text-muted-foreground">
      La cartelera es el canal oficial de comunicación del condominio. Los administradores publican
      anuncios que son visibles para todos los residentes desde la sección comunitaria.
    </p>

    <DocsSubSection id="cartelera-crear" title="Crear un anuncio">
      <DocsStepList :steps="stepsCrear" />

      <div class="mt-4">
        <DocsNote variant="info">
          Los anuncios marcados como "Urgente" generan una notificación push inmediata a todos
          los residentes con notificaciones activas.
        </DocsNote>
      </div>
    </DocsSubSection>

    <DocsSubSection id="cartelera-categorias" title="Categorías de anuncios">
      <DocsKeyValue :items="categoriasAnuncios" key-label="Categoría" value-label="Descripción" />
    </DocsSubSection>

    <DocsSubSection id="cartelera-ciclo" title="Ciclo de vida">
      <DocsKeyValue :items="cicloVida" key-label="Estado" value-label="Descripción" />

      <p class="mt-3 text-sm leading-relaxed text-muted-foreground">
        Opcionalmente se puede establecer una fecha de expiración para que el anuncio se archive
        automáticamente.
      </p>
    </DocsSubSection>
  </DocsSection>
</template>

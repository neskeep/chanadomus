<script setup lang="ts">
const stepsActivar = [
  'Ir a Mi Perfil > Notificaciones',
  'El navegador solicitará permiso para enviar notificaciones',
  'Aceptar el permiso',
  'Las notificaciones quedarán activas para el dispositivo actual',
]

const categoriasNotificaciones = [
  { key: 'Acceso', value: 'Cuando se escanea un código QR asociado a su unidad (entrada/salida de visitas).' },
  { key: 'Anuncios', value: 'Nuevos comunicados publicados en la cartelera.' },
  { key: 'Incidencias', value: 'Actualizaciones de estado en incidencias reportadas o de su interés.' },
  { key: 'Votaciones', value: 'Nuevas votaciones abiertas o resultados disponibles.' },
  { key: 'Pánico', value: 'Alertas de emergencia activadas por cualquier usuario.' },
  { key: 'Finanzas', value: 'Nuevos cargos, abonos o informes financieros.' },
  { key: 'Chat', value: 'Nuevos mensajes en salas de chat.' },
]
</script>

<template>
  <DocsSection id="notificaciones" title="Notificaciones push">
    <DocsRoleBadges :roles="['admin', 'propietario', 'conserje', 'vigilancia']" />

    <p class="mt-3 text-sm leading-relaxed text-muted-foreground">
      ChanaDomus envía notificaciones push al navegador para mantener a los usuarios informados
      sobre eventos importantes, incluso cuando no están usando la aplicación activamente.
    </p>

    <DocsSubSection id="notificaciones-activar" title="Activar notificaciones">
      <DocsStepList :steps="stepsActivar" />

      <div class="mt-4">
        <DocsNote variant="warning">
          Las notificaciones se configuran por dispositivo. Si utiliza ChanaDomus en múltiples
          dispositivos (computadora y teléfono), debe activar las notificaciones en cada uno.
        </DocsNote>
      </div>
    </DocsSubSection>

    <DocsSubSection id="notificaciones-categorias" title="Categorías de notificaciones">
      <DocsKeyValue :items="categoriasNotificaciones" key-label="Categoría" value-label="Descripción" />

      <p class="mt-3 text-sm leading-relaxed text-muted-foreground">
        Cada categoría puede activarse o desactivarse individualmente desde la página de preferencias.
      </p>
    </DocsSubSection>

    <DocsSubSection id="notificaciones-preferencias" title="Administrar preferencias">
      <p class="text-sm leading-relaxed text-muted-foreground">
        Cada usuario decide qué tipo de notificaciones desea recibir. Los cambios se aplican de
        forma inmediata. La categoría "Pánico" está habilitada por defecto y se recomienda
        mantenerla activa.
      </p>

      <div class="mt-4">
        <DocsNote variant="danger">
          Desactivar la categoría "Pánico" significa que no recibirá alertas de emergencia.
          Se recomienda encarecidamente mantener esta categoría activa en todo momento.
        </DocsNote>
      </div>
    </DocsSubSection>
  </DocsSection>
</template>

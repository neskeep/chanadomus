<script setup lang="ts">
const stepsHistorial = [
  'Ir a Accesos (vigilancia) o Panel de administración (admin)',
  'El historial se muestra en orden cronológico, del más reciente al más antiguo',
  'Cada registro muestra: nombre del visitante, unidad, hora de entrada, tipo de acceso y resultado',
  'Los nuevos accesos aparecen automáticamente sin necesidad de recargar la página',
]

const infoRegistro = [
  { key: 'Nombre', value: 'Nombre del visitante o residente' },
  { key: 'Unidad', value: 'Vivienda de destino' },
  { key: 'Hora de entrada', value: 'Fecha y hora del acceso' },
  { key: 'Hora de salida', value: 'Fecha y hora de la salida (si se registró)' },
  { key: 'Tipo', value: 'Residente, Visitante, Miembro del hogar, Personal de servicio' },
  { key: 'Resultado', value: 'Permitido, Denegado, Expirado' },
  { key: 'Documento', value: 'Número de identificación del visitante' },
  { key: 'Vehículo', value: 'Placa del vehículo (si aplica) y cantidad de ocupantes' },
]
</script>

<template>
  <DocsSection id="accesos" title="Registro de accesos">
    <DocsRoleBadges :roles="['admin', 'vigilancia']" />

    <p class="mt-3 text-sm leading-relaxed text-muted-foreground">
      El registro de accesos es un historial en tiempo real de todas las entradas y salidas registradas
      en el condominio. Se actualiza automáticamente conforme se escanean códigos QR.
    </p>

    <DocsSubSection id="accesos-historial" title="Consultar el historial">
      <DocsStepList :steps="stepsHistorial" />
    </DocsSubSection>

    <DocsSubSection id="accesos-info" title="Información de cada registro">
      <DocsKeyValue :items="infoRegistro" key-label="Campo" value-label="Descripción" />
    </DocsSubSection>

    <DocsSubSection id="accesos-tiempo-real" title="Actualización en tiempo real">
      <p class="text-sm leading-relaxed text-muted-foreground">
        El registro de accesos se transmite en vivo vía WebSocket. El administrador y el personal de
        vigilancia ven los nuevos accesos al instante, sin necesidad de recargar la página.
      </p>

      <p class="mt-3 text-sm leading-relaxed text-muted-foreground">
        Un indicador de conexión muestra en todo momento si la transmisión en tiempo real está activa.
      </p>

      <div class="mt-4">
        <DocsNote variant="info">
          Si el indicador muestra "Desconectado", la página se reconectará automáticamente en unos
          segundos. Los registros pendientes se mostrarán al restablecer la conexión.
        </DocsNote>
      </div>
    </DocsSubSection>
  </DocsSection>
</template>

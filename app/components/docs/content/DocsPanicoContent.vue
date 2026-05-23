<script setup lang="ts">
const stepsActivar = [
  'El botón de pánico está siempre visible en la barra lateral (desktop) o en la parte inferior de la pantalla (móvil)',
  'Al presionarlo, se solicita confirmación para evitar activaciones accidentales',
  'Una vez confirmado, la alerta se envía de forma inmediata',
  'La pantalla del personal de vigilancia y administradores mostrará la alerta con una señal sonora',
]

const stepsResolver = [
  'Localizar la alerta activa en la sección de Alertas o en la notificación emergente',
  'Presionar "Resolver"',
  'Agregar una nota describiendo la situación y las acciones tomadas',
  'Confirmar la resolución',
]
</script>

<template>
  <DocsSection id="panico" title="Botón de pánico y alertas">
    <DocsRoleBadges :roles="['admin', 'propietario', 'conserje', 'vigilancia']" />

    <p class="mt-3 text-sm leading-relaxed text-muted-foreground">
      ChanaDomus incluye un botón de pánico accesible para todos los usuarios autenticados.
      Al activarlo, se envia una alerta de emergencia en tiempo real al personal de vigilancia
      y a los administradores.
    </p>

    <DocsSubSection id="panico-activar" title="¿Cómo activar el botón de pánico?">
      <DocsStepList :steps="stepsActivar" />

      <div class="mt-4">
        <DocsNote variant="danger">
          El botón de pánico está diseñado exclusivamente para situaciones de emergencia real.
          Su uso indebido puede generar falsas alarmas y afectar la capacidad de respuesta del
          equipo de seguridad.
        </DocsNote>
      </div>
    </DocsSubSection>

    <DocsSubSection id="panico-recepcion" title="Recepción de alertas">
      <ul class="mt-3 space-y-1.5 list-disc list-inside text-sm text-muted-foreground">
        <li>Las alertas se reciben en tiempo real mediante WebSocket</li>
        <li>Se activa una alarma sonora automática en los dispositivos del personal de seguridad</li>
        <li>La alerta muestra: nombre del usuario que la activó, unidad asociada (si aplica) y hora de activación</li>
        <li>Las alertas permanecen activas hasta que son resueltas manualmente</li>
      </ul>
    </DocsSubSection>

    <DocsSubSection id="panico-resolver" title="Resolver una alerta">
      <DocsStepList :steps="stepsResolver" />

      <p class="mt-3 text-sm leading-relaxed text-muted-foreground">
        Se registra quién resolvió la alerta, la hora y la nota de resolución.
      </p>

      <div class="mt-4">
        <DocsNote variant="info">
          Todas las alertas, tanto activas como resueltas, quedan registradas en el historial
          para consulta futura y seguimiento.
        </DocsNote>
      </div>
    </DocsSubSection>
  </DocsSection>
</template>

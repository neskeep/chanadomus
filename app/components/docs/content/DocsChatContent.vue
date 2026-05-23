<script setup lang="ts">
const salasChat = [
  { key: 'General', value: 'Sala abierta para todos los usuarios. Conversaciones de interés común.' },
  { key: 'Propietarios', value: 'Exclusiva para propietarios. Temas de gobernanza y comunidad.' },
  { key: 'Administración', value: 'Solo administradores. Coordinación interna del equipo.' },
  { key: 'Vigilancia', value: 'Personal de seguridad. Coordinación de turnos y eventos.' },
  { key: 'Conserjería', value: 'Personal de conserjería. Tareas y reportes del día.' },
  { key: 'Incidencias', value: 'Seguimiento comunitario de reportes y problemas.' },
  { key: 'Unidad', value: 'Conversación privada de cada unidad habitacional.' },
  { key: 'Mensaje directo', value: 'Conversaciones privadas entre dos usuarios.' },
]

const stepsEnviar = [
  'Ir a Chat desde el menu',
  'Seleccionar la sala de conversación',
  'Escribir el mensaje en el campo de texto',
  'Opcionalmente adjuntar una imagen o archivo',
  'Presionar "Enviar"',
  'El mensaje se entrega en tiempo real a todos los participantes de la sala',
]
</script>

<template>
  <DocsSection id="chat" title="Chat comunitario">
    <DocsRoleBadges :roles="['admin', 'propietario', 'conserje', 'vigilancia']" />

    <p class="mt-3 text-sm leading-relaxed text-muted-foreground">
      El chat comunitario es un sistema de mensajería en tiempo real que permite la comunicación
      entre los residentes y el equipo de administración del condominio. Las conversaciones están
      organizadas en salas temáticas.
    </p>

    <DocsSubSection id="chat-salas" title="Salas de chat">
      <DocsKeyValue :items="salasChat" key-label="Sala" value-label="Descripción" />

      <div class="mt-4">
        <DocsNote variant="info">
          Cada usuario solo ve las salas a las que tiene acceso según su rol.
          No es posible acceder a salas restringidas.
        </DocsNote>
      </div>
    </DocsSubSection>

    <DocsSubSection id="chat-enviar" title="Enviar mensajes">
      <DocsStepList :steps="stepsEnviar" />
    </DocsSubSection>

    <DocsSubSection id="chat-funciones" title="Funciones adicionales">
      <ul class="mt-3 space-y-1.5 list-disc list-inside text-sm text-muted-foreground">
        <li>Adjuntar imágenes y archivos (con vista previa)</li>
        <li>Indicador de mensajes no leídos por sala</li>
        <li>Historial completo de conversaciones</li>
        <li>Menciones de usuarios (escribir @ seguido del nombre)</li>
      </ul>
    </DocsSubSection>
  </DocsSection>
</template>

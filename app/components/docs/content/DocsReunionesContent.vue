<script setup lang="ts">
const stepsProgramar = [
  'Ir a Comunidad > Reuniones',
  'Presionar "Nueva reunión"',
  'Completar el título de la reunión',
  'Seleccionar el tipo: Ordinaria, Extraordinaria, Comité o Informativa',
  'Establecer la fecha y hora de inicio',
  'Opcionalmente establecer hora de finalización',
  'Indicar el lugar de la reunión',
  'Opcionalmente agregar un enlace de videoconferencia',
  'Redactar la agenda u orden del día',
  'Guardar',
]

const tiposReunion = [
  { key: 'Ordinaria', value: 'Reuniones regulares programadas según los estatutos del condominio (por ejemplo, asambleas trimestrales).' },
  { key: 'Extraordinaria', value: 'Convocadas para tratar asuntos urgentes o excepcionales fuera del calendario regular.' },
  { key: 'Comité', value: 'Reuniones de comités específicos (finanzas, seguridad, mantenimiento).' },
  { key: 'Informativa', value: 'Sesiones de comunicación sin carácter deliberativo. Para informar avances o resultados.' },
]

const estadosReunion = [
  { key: 'Programada', value: 'La reunión ha sido creada y está pendiente de realizarse.' },
  { key: 'En curso', value: 'La reunión se está llevando a cabo en este momento.' },
  { key: 'Completada', value: 'La reunión finalizó. Se pueden agregar las minutas o acta.' },
  { key: 'Cancelada', value: 'La reunión fue cancelada antes de su realización.' },
]
</script>

<template>
  <DocsSection id="reuniones" title="Reuniones y asambleas">
    <DocsRoleBadges :roles="['admin']" />

    <p class="mt-3 text-sm leading-relaxed text-muted-foreground">
      El módulo de reuniones permite programar, comunicar y documentar las asambleas y juntas del
      condominio. Todos los residentes pueden consultar las reuniones programadas.
    </p>

    <DocsSubSection id="reuniones-programar" title="Programar una reunión">
      <DocsStepList :steps="stepsProgramar" />
    </DocsSubSection>

    <DocsSubSection id="reuniones-tipos" title="Tipos de reunión">
      <DocsKeyValue :items="tiposReunion" key-label="Tipo" value-label="Descripción" />
    </DocsSubSection>

    <DocsSubSection id="reuniones-estados" title="Estados de una reunión">
      <DocsKeyValue :items="estadosReunion" key-label="Estado" value-label="Descripción" />
    </DocsSubSection>

    <DocsSubSection id="reuniones-documentacion" title="Documentación de la reunión">
      <ul class="mt-3 space-y-1.5 list-disc list-inside text-sm text-muted-foreground">
        <li>Después de realizada, el administrador puede agregar las minutas o acta de la reunión</li>
        <li>El campo de minutas permite documentar los acuerdos y puntos tratados</li>
        <li>Esta información queda disponible para consulta de todos los residentes</li>
      </ul>

      <div class="mt-4">
        <DocsNote variant="info">
          Documentar las minutas de cada reunión es una buena práctica de transparencia y gobernanza.
          Los propietarios pueden consultarlas en cualquier momento.
        </DocsNote>
      </div>
    </DocsSubSection>
  </DocsSection>
</template>

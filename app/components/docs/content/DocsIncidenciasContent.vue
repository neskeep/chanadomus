<script setup lang="ts">
const stepsReportar = [
  'Ir a Incidencias',
  'Presionar "Reportar incidencia" (o "Nueva incidencia")',
  'Escribir un título claro y descriptivo',
  'Redactar una descripción detallada del problema',
  'Seleccionar la prioridad: Baja, Media o Alta',
  'Opcionalmente adjuntar fotografías del problema',
  'Enviar el reporte',
]

const nivelesPrioridad = [
  { key: 'Baja', value: 'Situaciones que no representan urgencia. Ejemplo: pintura desgastada, luminaria fundida en área común.' },
  { key: 'Media', value: 'Problemas que requieren atención a corto plazo. Ejemplo: fuga menor de agua, bache en estacionamiento.' },
  { key: 'Alta', value: 'Situaciones urgentes que requieren atención inmediata. Ejemplo: fuga mayor, daño estructural, riesgo de seguridad.' },
]

const flujoEstados = [
  { key: 'Abierta', value: 'La incidencia ha sido reportada y está pendiente de revisión.' },
  { key: 'En progreso', value: 'El equipo de administración está trabajando en la solución.' },
  { key: 'Resuelta', value: 'El problema ha sido solucionado. Se registra la fecha de resolución.' },
  { key: 'Cerrada', value: 'La incidencia ha sido revisada y archivada definitivamente.' },
]

const stepsAdmin = [
  'Revisar las incidencias abiertas desde el panel de administración',
  'Cambiar el estado a "En progreso" cuando se inicie la atención',
  'Agregar notas de seguimiento con cada actualización',
  'Marcar como "Resuelta" al completar la solución',
  'El historial de cambios queda registrado automáticamente',
]
</script>

<template>
  <DocsSection id="incidencias" title="Gestión de incidencias">
    <DocsRoleBadges :roles="['admin', 'propietario', 'conserje', 'vigilancia']" />

    <p class="mt-3 text-sm leading-relaxed text-muted-foreground">
      El módulo de incidencias permite a cualquier usuario reportar problemas, daños o situaciones
      que requieran atención dentro del condominio. Los administradores gestionan y dan seguimiento
      a cada reporte.
    </p>

    <DocsSubSection id="incidencias-reportar" title="Reportar una incidencia">
      <DocsStepList :steps="stepsReportar" />

      <div class="mt-4">
        <DocsNote variant="info">
          Incluir fotografías mejora significativamente la capacidad del equipo de administración
          para evaluar y priorizar la incidencia.
        </DocsNote>
      </div>
    </DocsSubSection>

    <DocsSubSection id="incidencias-prioridad" title="Niveles de prioridad">
      <DocsKeyValue :items="nivelesPrioridad" key-label="Prioridad" value-label="Descripción" />
    </DocsSubSection>

    <DocsSubSection id="incidencias-estados" title="Flujo de estados">
      <DocsKeyValue :items="flujoEstados" key-label="Estado" value-label="Descripción" />

      <p class="mt-4 text-sm font-medium text-foreground">
        Gestión de incidencias (administrador):
      </p>
      <DocsStepList :steps="stepsAdmin" />
    </DocsSubSection>

    <DocsSubSection id="incidencias-historial" title="Historial de actualizaciones">
      <p class="text-sm leading-relaxed text-muted-foreground">
        Cada cambio de estado genera un registro automático. Se guarda:
      </p>
      <ul class="mt-3 space-y-1.5 list-disc list-inside text-sm text-muted-foreground">
        <li>Estado anterior y estado nuevo</li>
        <li>Nota del administrador</li>
        <li>Fecha y hora del cambio</li>
        <li>Quién realizó el cambio</li>
      </ul>
    </DocsSubSection>
  </DocsSection>
</template>

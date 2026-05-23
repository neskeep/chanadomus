<script setup lang="ts">
const stepsCrear = [
  'Ir a Comunidad > Votaciones',
  'Presionar "Nueva votación"',
  'Escribir el título de la consulta',
  'Agregar una descripción explicativa (opcional)',
  'Seleccionar el tipo: Opción única o Opción múltiple',
  'Agregar las opciones de respuesta (mínimo 2)',
  'Establecer la fecha límite para votar',
  'Publicar la votación o guardarla como borrador',
]

const estadosVotacion = [
  { key: 'Borrador', value: 'La votación existe pero no es visible para los propietarios.' },
  { key: 'Activa', value: 'La votación está abierta y los propietarios pueden emitir su voto.' },
  { key: 'Cerrada', value: 'La votación ha finalizado. Los resultados son definitivos y visibles para todos.' },
]
</script>

<template>
  <DocsSection id="votaciones" title="Votaciones y encuestas">
    <DocsRoleBadges :roles="['admin', 'propietario']" />

    <p class="mt-3 text-sm leading-relaxed text-muted-foreground">
      El módulo de votaciones permite al administrador crear consultas formales para que los
      propietarios participen en las decisiones del condominio. Cada unidad tiene derecho a un
      voto por votación.
    </p>

    <DocsSubSection id="votaciones-crear" title="Crear una votación">
      <DocsStepList :steps="stepsCrear" />

      <div class="mt-4">
        <DocsNote variant="info">
          Puede crear la votación como borrador para revisarla antes de hacerla visible a los
          propietarios.
        </DocsNote>
      </div>
    </DocsSubSection>

    <DocsSubSection id="votaciones-proceso" title="Proceso de votación">
      <ul class="mt-3 space-y-1.5 list-disc list-inside text-sm text-muted-foreground">
        <li>Solo los propietarios pueden emitir votos</li>
        <li>Cada unidad tiene derecho a un único voto por votación</li>
        <li>El voto es registrado y vinculado a la unidad (no al usuario individual)</li>
        <li>Los resultados se actualizan en tiempo real conforme se reciben votos</li>
      </ul>

      <div class="mt-4">
        <DocsNote variant="warning">
          Una vez emitido, el voto no puede modificarse. Asegúrese de informar esto a los
          propietarios antes de abrir la votación.
        </DocsNote>
      </div>
    </DocsSubSection>

    <DocsSubSection id="votaciones-estados" title="Estados de una votación">
      <DocsKeyValue :items="estadosVotacion" key-label="Estado" value-label="Descripción" />
    </DocsSubSection>

    <DocsSubSection id="votaciones-resultados" title="Resultados">
      <ul class="mt-3 space-y-1.5 list-disc list-inside text-sm text-muted-foreground">
        <li>Los resultados muestran cada opción con su cantidad de votos y porcentaje</li>
        <li>Barras de progreso visuales para facilitar la lectura</li>
        <li>El administrador puede cerrar la votación manualmente antes de la fecha límite si es necesario</li>
      </ul>
    </DocsSubSection>
  </DocsSection>
</template>

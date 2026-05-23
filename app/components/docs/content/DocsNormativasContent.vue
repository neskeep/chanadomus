<script setup lang="ts">
const stepsSubir = [
  'Ir a Comunidad > Normativas',
  'Presionar "Subir normativa"',
  'Escribir un título descriptivo para el documento',
  'Seleccionar el archivo en formato PDF',
  'Guardar',
]
</script>

<template>
  <DocsSection id="normativas" title="Normativas y reglamentos">
    <DocsRoleBadges :roles="['admin']" />

    <p class="mt-3 text-sm leading-relaxed text-muted-foreground">
      La sección de normativas permite al administrador publicar los documentos oficiales del
      condominio: reglamento interno, horarios, políticas de uso de áreas comunes y cualquier
      documento normativo vigente. Todos los residentes pueden consultar estos documentos.
    </p>

    <DocsSubSection id="normativas-subir" title="Subir una normativa">
      <DocsStepList :steps="stepsSubir" />

      <div class="mt-4">
        <DocsNote variant="info">
          Se recomienda utilizar títulos claros y descriptivos. Ejemplo: "Reglamento interno 2026"
          en lugar de "Documento 1".
        </DocsNote>
      </div>
    </DocsSubSection>

    <DocsSubSection id="normativas-gestion" title="Gestión de normativas">
      <ul class="mt-3 space-y-1.5 list-disc list-inside text-sm text-muted-foreground">
        <li>Los documentos publicados son visibles para todos los residentes en la sección comunitaria</li>
        <li>Se puede actualizar un documento subiendo una nueva versión</li>
        <li>Cada documento muestra: título, fecha de publicación y quién lo publicó</li>
        <li>Los residentes pueden descargar los documentos en formato PDF</li>
      </ul>

      <div class="mt-4">
        <DocsNote variant="warning">
          Al actualizar un documento normativo, la versión anterior se reemplaza. Si necesita mantener
          un historial de versiones, considere incluir la fecha en el título del documento.
        </DocsNote>
      </div>
    </DocsSubSection>
  </DocsSection>
</template>

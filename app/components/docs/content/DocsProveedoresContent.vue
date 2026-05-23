<script setup lang="ts">
const stepsRegistrar = [
  'Ir a Gestion > Proveedores',
  'Presionar "Nuevo proveedor"',
  'Completar nombre, teléfono, dirección y horario',
  'Seleccionar la categoría del servicio',
  'Describir los servicios que ofrece',
  'Indicar el costo aproximado (opcional)',
  'Opcionalmente subir una fotografía',
  'Guardar como Activo',
]

const categoriasProveedores = [
  { key: 'Plomería', value: 'Servicios de fontanería y reparación de tuberías.' },
  { key: 'Electricidad', value: 'Instalaciones y reparaciones eléctricas.' },
  { key: 'Jardinería', value: 'Mantenimiento de áreas verdes y jardines.' },
  { key: 'Cerrajería', value: 'Servicios de cerraduras y llaves.' },
  { key: 'Limpieza', value: 'Servicios de limpieza residencial o de áreas comunes.' },
  { key: 'Pintura', value: 'Trabajos de pintura interior y exterior.' },
  { key: 'Albañilería', value: 'Obras menores de construcción y reparación.' },
  { key: 'Seguridad', value: 'Servicios de vigilancia o instalación de cámaras.' },
  { key: 'Fumigación', value: 'Control de plagas y fumigación.' },
  { key: 'Otro', value: 'Servicios que no corresponden a las categorías anteriores.' },
]

const estadosProveedores = [
  { key: 'Activo', value: 'El proveedor está visible en el directorio comunitario.' },
  { key: 'Inactivo', value: 'El proveedor ha sido retirado del directorio pero sus datos se conservan.' },
  { key: 'Pendiente', value: 'El proveedor fue sugerido por un residente y está en espera de aprobación del administrador.' },
]
</script>

<template>
  <DocsSection id="proveedores" title="Directorio de proveedores">
    <DocsRoleBadges :roles="['admin', 'propietario', 'conserje', 'vigilancia']" />

    <p class="mt-3 text-sm leading-relaxed text-muted-foreground">
      El directorio de proveedores es un espacio comunitario donde se registran los servicios
      contratados o recomendados por los residentes. Los propietarios pueden sugerir proveedores
      y dejar reseñas.
    </p>

    <DocsSubSection id="proveedores-registrar" title="Registrar un proveedor">
      <DocsStepList :steps="stepsRegistrar" />

      <p class="mt-3 text-sm leading-relaxed text-muted-foreground">
        Los residentes pueden sugerir proveedores desde la seccion comunitaria. Las sugerencias
        quedan en estado "Pendiente" hasta que el administrador las apruebe.
      </p>
    </DocsSubSection>

    <DocsSubSection id="proveedores-categorias" title="Categorías de proveedores">
      <DocsKeyValue :items="categoriasProveedores" key-label="Categoría" value-label="Descripción" />
    </DocsSubSection>

    <DocsSubSection id="proveedores-resenas" title="Reseñas y calificaciones">
      <ul class="mt-3 space-y-1.5 list-disc list-inside text-sm text-muted-foreground">
        <li>Los residentes pueden dejar reseñas con calificación de 1 a 5 estrellas</li>
        <li>Cada reseña incluye un comentario escrito</li>
        <li>El promedio de calificación se muestra en el listado para orientar a otros residentes</li>
      </ul>

      <div class="mt-4">
        <DocsNote variant="info">
          Las reseñas son una herramienta valiosa para la comunidad. Animen a los residentes a
          compartir su experiencia con los proveedores que contraten.
        </DocsNote>
      </div>
    </DocsSubSection>

    <DocsSubSection id="proveedores-estados" title="Estados de proveedores">
      <DocsKeyValue :items="estadosProveedores" key-label="Estado" value-label="Descripción" />
    </DocsSubSection>
  </DocsSection>
</template>

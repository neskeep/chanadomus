<script setup lang="ts">
const relaciones = [
  { key: 'Propietario', value: 'Titular de la unidad.' },
  { key: 'Conyuge', value: 'Pareja del propietario.' },
  { key: 'Hijo/a', value: 'Descendiente directo del propietario.' },
  { key: 'Inquilino', value: 'Persona que renta la unidad o parte de ella.' },
  { key: 'Otro', value: 'Cualquier otra relación no contemplada anteriormente.' },
]

const stepsRegistrarAdmin = [
  'Ir a Gestión > Unidades.',
  'Seleccionar la unidad correspondiente.',
  'En la pestaña "Miembros", presionar "Agregar integrante".',
  'Completar nombre, documento de identidad, teléfono y relación.',
  'Guardar los cambios.',
]

const stepsRegistrarPropietario = [
  'Ir a Mi Unidad.',
  'En la pestaña "Integrantes", presionar "Agregar integrante".',
  'Completar los datos del miembro.',
  'Guardar los cambios.',
]
</script>

<template>
  <DocsSection id="miembros" title="Miembros del hogar">
    <DocsRoleBadges :roles="['admin', 'propietario']" />

    <p class="mt-3 text-sm leading-relaxed text-muted-foreground">
      Los miembros del hogar son las personas que residen en una unidad pero no necesariamente tienen
      cuenta en el sistema. Registrarlos permite generarles pases de acceso QR para ingresar al
      condominio.
    </p>

    <DocsSubSection id="miembros-relacion" title="Tipos de relación">
      <DocsKeyValue :items="relaciones" key-label="Relación" value-label="Descripción" />
    </DocsSubSection>

    <DocsSubSection id="miembros-registrar" title="Registrar un miembro">
      <p class="text-sm leading-relaxed text-muted-foreground">
        El proceso de registro varía según el rol del usuario.
      </p>

      <p class="mt-4 text-sm font-medium text-foreground">
        Como administrador:
      </p>
      <div class="mt-2">
        <DocsStepList :steps="stepsRegistrarAdmin" />
      </div>

      <p class="mt-6 text-sm font-medium text-foreground">
        Como propietario:
      </p>
      <div class="mt-2">
        <DocsStepList :steps="stepsRegistrarPropietario" />
      </div>
    </DocsSubSection>

    <DocsSubSection id="miembros-pases" title="Pases de acceso para miembros">
      <p class="text-sm leading-relaxed text-muted-foreground">
        Una vez registrado un miembro del hogar, es posible generar un pase QR para que pueda acceder
        al condominio sin necesidad de crear una visita cada vez. El pase puede configurarse con una
        fecha de expiración opcional.
      </p>

      <div class="mt-4">
        <DocsNote variant="info">
          Los miembros del hogar con pase activo aparecen en el directorio de residentes que consulta
          el personal de vigilancia.
        </DocsNote>
      </div>
    </DocsSubSection>
  </DocsSection>
</template>

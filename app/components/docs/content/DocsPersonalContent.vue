<script setup lang="ts">
const stepsCondominio = [
  'Ir a Gestion > Personal',
  'Presionar "Agregar personal"',
  'Completar nombre, documento de identidad, teléfono y correo electrónico',
  'Seleccionar el rol de servicio (del catálogo de roles)',
  'Indicar el turno de trabajo',
  'Opcionalmente subir una fotografía',
  'Si el trabajador necesita acceso al sistema, se puede vincular una cuenta de usuario',
  'Guardar',
]

const stepsUnidad = [
  'Ir a Mi Unidad',
  'Pestaña "Personal"',
  'Presionar "Agregar personal"',
  'Completar nombre, documento de identidad y teléfono',
  'Seleccionar el rol de servicio',
  'Guardar',
]

const stepsRoles = [
  'Ir a Gestion > Roles de Servicio',
  'Presionar "Crear rol"',
  'Ingresar nombre y descripción del rol',
  'Guardar',
]
</script>

<template>
  <DocsSection id="personal" title="Personal de servicio">
    <DocsRoleBadges :roles="['admin', 'propietario']" />

    <p class="mt-3 text-sm leading-relaxed text-muted-foreground">
      ChanaDomus distingue dos niveles de personal de servicio: el personal del condominio (gestionado
      por el administrador) y el personal de cada unidad (gestionado por el propietario).
    </p>

    <DocsSubSection id="personal-condominio" title="Personal del condominio">
      <p class="text-sm leading-relaxed text-muted-foreground">
        El administrador registra al personal que trabaja para todo el condominio.
      </p>

      <DocsStepList :steps="stepsCondominio" />

      <p class="mt-3 text-sm leading-relaxed text-muted-foreground">
        Se puede generar un código QR de acceso para cada miembro del personal.
      </p>
    </DocsSubSection>

    <DocsSubSection id="personal-unidad" title="Personal de la unidad">
      <p class="text-sm leading-relaxed text-muted-foreground">
        Cada propietario puede registrar personal de servicio exclusivo de su unidad (limpieza,
        jardinero, etc.).
      </p>

      <DocsStepList :steps="stepsUnidad" />

      <p class="mt-3 text-sm leading-relaxed text-muted-foreground">
        Se puede generar un pase de acceso QR para el personal de la unidad.
      </p>
    </DocsSubSection>

    <DocsSubSection id="personal-roles" title="Roles de servicio">
      <p class="text-sm leading-relaxed text-muted-foreground">
        Los roles de servicio son un catálogo personalizable definido por el administrador.
      </p>

      <DocsStepList :steps="stepsRoles" />

      <p class="mt-3 text-sm leading-relaxed text-muted-foreground">
        Ejemplos de roles: Conserje, Vigilancia, Mantenimiento, Jardinería, Limpieza.
      </p>

      <div class="mt-4">
        <DocsNote variant="info">
          Definir roles de servicio claros facilita la organización y el seguimiento del personal.
          Puede crear tantos roles como necesite.
        </DocsNote>
      </div>
    </DocsSubSection>
  </DocsSection>
</template>

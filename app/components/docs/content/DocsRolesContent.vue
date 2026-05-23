<script setup lang="ts">
const roles = [
  {
    key: 'Administrador',
    value: 'Acceso total al sistema. Gestiona usuarios, finanzas, unidades y toda la configuración del condominio.',
  },
  {
    key: 'Propietario',
    value: 'Gestiona su unidad, miembros del hogar, vehículos. Genera códigos QR para visitas. Consulta su estado de cuenta.',
  },
  {
    key: 'Conserje',
    value: 'Gestiona visitas y genera códigos QR de acceso. Reporta incidencias. Acceso a funciones comunitarias.',
  },
  {
    key: 'Vigilancia',
    value: 'Escanea códigos QR para control de acceso. Consulta directorio de residentes. Gestiona alertas de emergencia.',
  },
]

const permisos = [
  { key: 'Panel de administración', value: 'Solo administrador' },
  { key: 'Gestión de unidades', value: 'Solo administrador' },
  { key: 'Gestión de usuarios', value: 'Solo administrador' },
  { key: 'Finanzas', value: 'Administrador (gestión), Propietario (consulta)' },
  { key: 'Control de acceso QR', value: 'Administrador, Propietario, Conserje (generan), Vigilancia (escanea)' },
  { key: 'Incidencias', value: 'Todos los roles' },
  { key: 'Chat comunitario', value: 'Todos los roles' },
  { key: 'Cartelera', value: 'Administrador (publica), todos (leen)' },
  { key: 'Votaciones', value: 'Administrador (crea), Propietario (vota)' },
  { key: 'Reuniones', value: 'Administrador (programa), todos (consultan)' },
]
</script>

<template>
  <DocsSection id="roles" title="Roles y permisos">
    <p class="text-sm leading-relaxed text-muted-foreground">
      El sistema define cuatro roles con permisos diferenciados. Cada rol determina las secciones y
      funciones a las que el usuario tiene acceso.
    </p>

    <div class="mt-4">
      <DocsKeyValue :items="roles" key-label="Rol" value-label="Descripción" />
    </div>

    <DocsSubSection id="roles-asignacion" title="Asignación de roles">
      <p class="text-sm leading-relaxed text-muted-foreground">
        Solo el administrador puede asignar y modificar roles. Cada usuario tiene asignado exactamente
        un rol, el cual determina qué secciones y funciones del sistema puede ver y utilizar.
      </p>

      <div class="mt-4">
        <DocsNote variant="warning">
          Un usuario no puede cambiar su propio rol. Solo otro administrador puede modificar
          los roles asignados.
        </DocsNote>
      </div>
    </DocsSubSection>

    <DocsSubSection id="roles-permisos" title="Permisos por sección">
      <p class="text-sm leading-relaxed text-muted-foreground">
        La siguiente tabla muestra las secciones principales del sistema y los roles que tienen acceso
        a cada una.
      </p>

      <div class="mt-4">
        <DocsKeyValue :items="permisos" key-label="Sección" value-label="Acceso" />
      </div>
    </DocsSubSection>
  </DocsSection>
</template>

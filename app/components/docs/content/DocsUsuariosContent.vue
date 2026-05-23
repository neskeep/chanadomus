<script setup lang="ts">
const stepsCrear = [
  'Ir a Gestión > Usuarios en el menú lateral.',
  'Presionar el botón "Crear usuario".',
  'Completar los campos requeridos: nombre completo, correo electrónico y teléfono.',
  'Seleccionar el rol que corresponda al usuario.',
  'Si el usuario es propietario o conserje, asignar la unidad correspondiente.',
  'Guardar los cambios.',
]

const stepsEditar = [
  'Ir a Gestión > Usuarios.',
  'Localizar al usuario en la lista (puede usar el buscador).',
  'Hacer clic en el usuario para abrir su perfil.',
  'Modificar los campos necesarios.',
  'Guardar los cambios.',
]

const camposUsuario = [
  { key: 'Nombre', value: 'Nombre completo del usuario.' },
  { key: 'Correo electrónico', value: 'Dirección de email (se usa para iniciar sesión).' },
  { key: 'Teléfono', value: 'Número de contacto.' },
  { key: 'Rol', value: 'Administrador, Propietario, Conserje o Vigilancia.' },
  { key: 'Unidad', value: 'Vivienda asignada (requerida para propietarios y conserjes).' },
  { key: 'Estado', value: 'Activo o Suspendido.' },
]
</script>

<template>
  <DocsSection id="usuarios" title="Gestión de usuarios">
    <DocsRoleBadges :roles="['admin']" />

    <p class="mt-3 text-sm leading-relaxed text-muted-foreground">
      Este módulo permite crear y administrar las cuentas de acceso al sistema. Desde aquí puede
      registrar nuevos usuarios, asignarles un rol y gestionar su estado.
    </p>

    <DocsSubSection id="usuarios-crear" title="Crear un usuario">
      <DocsStepList :steps="stepsCrear" />

      <div class="mt-4">
        <DocsNote variant="info">
          El usuario recibirá un correo electrónico con sus credenciales de acceso.
        </DocsNote>
      </div>
    </DocsSubSection>

    <DocsSubSection id="usuarios-editar" title="Editar un usuario">
      <DocsStepList :steps="stepsEditar" />
    </DocsSubSection>

    <DocsSubSection id="usuarios-suspender" title="Suspender un usuario">
      <p class="text-sm leading-relaxed text-muted-foreground">
        Un usuario suspendido pierde la capacidad de iniciar sesión en el sistema. Al suspender una
        cuenta, es posible indicar el motivo de la suspensión y establecer una fecha de expiración,
        tras la cual el acceso se reactivará automáticamente.
      </p>

      <div class="mt-4">
        <DocsNote variant="danger">
          Suspender a un usuario cierra todas sus sesiones activas de forma inmediata.
        </DocsNote>
      </div>
    </DocsSubSection>

    <DocsSubSection id="usuarios-campos" title="Campos del usuario">
      <DocsKeyValue :items="camposUsuario" />
    </DocsSubSection>
  </DocsSection>
</template>

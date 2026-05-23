<script setup lang="ts">
const stepsEditar = [
  'Acceder al menú de usuario (esquina del sidebar o menú "Más" en móvil)',
  'Seleccionar "Mi Perfil"',
  'Modificar los campos deseados: nombre, correo electrónico o teléfono',
  'Guardar los cambios',
]

const stepsContrasena = [
  'Ir a Mi Perfil',
  'Localizar la sección "Cambiar contraseña"',
  'Ingresar la contraseña actual',
  'Ingresar la nueva contraseña',
  'Confirmar la nueva contraseña',
  'Guardar',
]
</script>

<template>
  <DocsSection id="perfil" title="Mi perfil y configuración">
    <DocsRoleBadges :roles="['admin', 'propietario', 'conserje', 'vigilancia']" />

    <p class="mt-3 text-sm leading-relaxed text-muted-foreground">
      Cada usuario puede gestionar su información personal y preferencias desde la sección
      "Mi Perfil", accesible desde el menú de usuario.
    </p>

    <DocsSubSection id="perfil-editar" title="Editar información personal">
      <DocsStepList :steps="stepsEditar" />

      <div class="mt-4">
        <DocsNote variant="info">
          El correo electrónico es también su nombre de usuario para iniciar sesión. Si lo cambia,
          deberá usar el nuevo correo para futuros inicios de sesión.
        </DocsNote>
      </div>
    </DocsSubSection>

    <DocsSubSection id="perfil-contrasena" title="Cambiar contraseña">
      <DocsStepList :steps="stepsContrasena" />

      <div class="mt-4">
        <DocsNote variant="warning">
          Por seguridad, se recomienda utilizar una contraseña de al menos 8 caracteres que combine
          letras, números y símbolos.
        </DocsNote>
      </div>
    </DocsSubSection>

    <DocsSubSection id="perfil-foto" title="Fotografía de perfil">
      <ul class="mt-3 space-y-1.5 list-disc list-inside text-sm text-muted-foreground">
        <li>Cada usuario puede subir una fotografía que se mostrará junto a su nombre en el sistema</li>
        <li>La imagen se optimiza automáticamente para no afectar el rendimiento</li>
        <li>Si no se sube una fotografía, se muestran las iniciales del nombre del usuario</li>
      </ul>
    </DocsSubSection>

    <DocsSubSection id="perfil-credenciales" title="Credenciales de acceso">
      <ul class="mt-3 space-y-1.5 list-disc list-inside text-sm text-muted-foreground">
        <li>Los propietarios y conserjes pueden descargar sus credenciales de acceso</li>
        <li>Las credenciales incluyen su codigo QR personal para acceso al condominio</li>
      </ul>

      <div class="mt-4">
        <DocsNote variant="info">
          Puede descargar sus credenciales para tenerlas disponibles sin conexión a internet. Esto
          es útil si necesita mostrar su QR en zonas con mala señal.
        </DocsNote>
      </div>
    </DocsSubSection>
  </DocsSection>
</template>

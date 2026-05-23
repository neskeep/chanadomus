<script setup lang="ts">
const stepsGenerar = [
  'Ir a Gestión > Unidades y seleccionar la unidad deseada.',
  'En el detalle de la unidad, abrir la pestaña "Invitaciones".',
  'Presionar "Generar enlace de invitación".',
  'Seleccionar el rol que tendrá el nuevo usuario (Propietario o Conserje).',
  'Confirmar la generación. Se creará un enlace único válido por 7 días.',
  'Copiar el enlace y compartirlo con la persona (por correo, WhatsApp, etc.).',
]

const stepsRegistro = [
  'La persona abre el enlace de invitación en su navegador.',
  'Se muestra un formulario de registro con el rol y unidad preasignados.',
  'Completa los campos: nombre, correo electrónico, teléfono (opcional) y contraseña.',
  'Al enviar el formulario, su cuenta queda creada y la invitación marcada como usada.',
  'La persona es redirigida a la pantalla de inicio de sesión para acceder al sistema.',
]

const estadosInvitacion = [
  { key: 'Pendiente', value: 'El enlace fue generado y aún no ha sido utilizado.' },
  { key: 'Usada', value: 'Un usuario se registró exitosamente con este enlace.' },
  { key: 'Expirada', value: 'Pasaron 7 días sin que el enlace fuera utilizado.' },
  { key: 'Revocada', value: 'El administrador canceló la invitación antes de ser usada.' },
]
</script>

<template>
  <DocsSection id="invitaciones" title="Invitaciones de registro">
    <DocsRoleBadges :roles="['admin']" />

    <p class="mt-3 text-sm leading-relaxed text-muted-foreground">
      El sistema de invitaciones permite que los propietarios y conserjes se registren por su cuenta
      en la aplicación. El administrador genera un enlace único asociado a una unidad y rol, y lo
      comparte con la persona interesada. De esta forma no es necesario crear la cuenta manualmente
      ni compartir contraseñas temporales.
    </p>

    <DocsSubSection id="invitaciones-generar" title="Generar una invitación">
      <DocsStepList :steps="stepsGenerar" />

      <div class="mt-4">
        <DocsNote variant="info">
          Cada enlace es de un solo uso. Si necesita invitar a varias personas para la misma unidad,
          genere un enlace por cada una.
        </DocsNote>
      </div>
    </DocsSubSection>

    <DocsSubSection id="invitaciones-registro" title="Registro del usuario invitado">
      <DocsStepList :steps="stepsRegistro" />

      <div class="mt-4">
        <DocsNote variant="info">
          El usuario registrado por invitación queda asociado automáticamente a la unidad y rol
          indicados. No requiere verificación de correo adicional.
        </DocsNote>
      </div>
    </DocsSubSection>

    <DocsSubSection id="invitaciones-revocar" title="Revocar una invitación">
      <p class="text-sm leading-relaxed text-muted-foreground">
        Si una invitación pendiente ya no es necesaria, el administrador puede revocarla desde la
        pestaña de invitaciones en el detalle de la unidad. Una vez revocada, el enlace deja de
        funcionar y la persona verá un mensaje indicando que la invitación fue cancelada.
      </p>

      <div class="mt-4">
        <DocsNote variant="warning">
          No es posible revocar invitaciones que ya fueron utilizadas. Si necesita desactivar al
          usuario que se registró, utilice la función de suspensión desde el módulo de usuarios.
        </DocsNote>
      </div>
    </DocsSubSection>

    <DocsSubSection id="invitaciones-estados" title="Estados de una invitación">
      <DocsKeyValue :items="estadosInvitacion" />
    </DocsSubSection>
  </DocsSection>
</template>

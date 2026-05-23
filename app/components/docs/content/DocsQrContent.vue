<script setup lang="ts">
const tiposQr = [
  { key: 'QR de Residente', value: 'Código permanente asignado a cada usuario con rol de propietario o conserje. Se usa para acceso diario al condominio. Se regenera bajo demanda.' },
  { key: 'QR de Visitante', value: 'Código temporal generado por un propietario o conserje para autorizar la entrada de un invitado o proveedor. Puede ser de uso único o tener fecha de expiración.' },
  { key: 'QR de Miembro del hogar', value: 'Código asignado a los miembros registrados en una unidad que no tienen cuenta en el sistema. Permite acceso recurrente sin generar visitas individuales.' },
  { key: 'QR de Personal de servicio', value: 'Código para empleados de servicio asignados a una unidad específica (por ejemplo, personal de limpieza o mantenimiento).' },
]

const stepsGenerarVisita = [
  'Ir a Mis Visitas (propietario) o Visitas (conserje)',
  'Presionar "Nueva visita"',
  'Completar los datos del visitante: nombre completo, documento de identidad',
  'Seleccionar el tipo de visita: Invitado o Proveedor',
  'Opcionalmente agregar la placa del vehículo y cantidad de ocupantes',
  'Establecer fecha límite de validez (opcional)',
  'Presionar "Generar código"',
  'El código QR se mostrará en pantalla listo para compartir',
]

const estadosQr = [
  { key: 'Activo', value: 'El código es válido y puede ser escaneado' },
  { key: 'Usado', value: 'El código ya fue utilizado (aplica solo a códigos de uso único)' },
  { key: 'Expirado', value: 'La fecha límite del código ha pasado' },
  { key: 'Inválido', value: 'El código fue desactivado manualmente o no se reconoce' },
]
</script>

<template>
  <DocsSection id="qr" title="Sistema de códigos QR">
    <DocsRoleBadges :roles="['admin', 'propietario', 'conserje', 'vigilancia']" />

    <p class="mt-3 text-sm leading-relaxed text-muted-foreground">
      ChanaDomus utiliza códigos QR como mecanismo principal de control de acceso. Cada código QR contiene
      un token único que se valida al momento del escaneo.
    </p>

    <DocsSubSection id="qr-tipos" title="Tipos de códigos QR">
      <DocsKeyValue :items="tiposQr" key-label="Tipo" value-label="Descripción" />
    </DocsSubSection>

    <DocsSubSection id="qr-generar-visita" title="Generar un QR de visita">
      <DocsStepList :steps="stepsGenerarVisita" />

      <div class="mt-4">
        <DocsNote variant="info">
          El código QR generado puede compartirse directamente con el visitante. Al escanearlo en la
          caseta de vigilancia, se autorizará su entrada.
        </DocsNote>
      </div>
    </DocsSubSection>

    <DocsSubSection id="qr-residente" title="QR de residente">
      <p class="text-sm leading-relaxed text-muted-foreground">
        Cada propietario y conserje tiene acceso a su QR personal desde la sección "Mi QR".
        El QR es permanente pero puede regenerarse si se compromete. Al escanear el QR de residente,
        el sistema registra la entrada o salida automáticamente.
      </p>

      <div class="mt-4">
        <DocsNote variant="warning">
          Si regenera su código QR, el código anterior quedará invalidado de forma inmediata.
          Cualquier copia previa dejará de funcionar.
        </DocsNote>
      </div>
    </DocsSubSection>

    <DocsSubSection id="qr-estados" title="Estados de un código QR">
      <DocsKeyValue :items="estadosQr" key-label="Estado" value-label="Descripción" />
    </DocsSubSection>
  </DocsSection>
</template>

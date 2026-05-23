<script setup lang="ts">
const stepsEscanear = [
  'Ir a Escanear en el menú principal',
  'La cámara se activará automáticamente',
  'Apuntar la cámara al código QR del visitante o residente',
  'El sistema procesará el código y mostrará el resultado',
  'Si el acceso es válido, se muestra la información del titular y la unidad destino',
  'Registrar la entrada o salida según corresponda',
]

const resultadosEscaneo = [
  { key: 'Acceso permitido', value: 'El código es válido. Se muestra el nombre del titular, tipo de acceso y unidad destino.' },
  { key: 'Acceso denegado', value: 'El código no es válido, ya fue usado o está expirado. Se muestra el motivo del rechazo.' },
  { key: 'Código no reconocido', value: 'El QR no pertenece al sistema de ChanaDomus.' },
]
</script>

<template>
  <DocsSection id="escaneo" title="Escaneo de códigos QR">
    <DocsRoleBadges :roles="['vigilancia']" />

    <p class="mt-3 text-sm leading-relaxed text-muted-foreground">
      El personal de vigilancia utiliza el escáner integrado en ChanaDomus para validar los códigos QR
      de visitantes y residentes. El escaneo se realiza directamente desde el navegador, usando la cámara
      del dispositivo.
    </p>

    <DocsSubSection id="escaneo-como" title="¿Cómo escanear?">
      <DocsStepList :steps="stepsEscanear" />

      <div class="mt-4">
        <DocsNote variant="info">
          El escáner funciona tanto con la cámara frontal como con la trasera. Puede alternar entre
          ambas según la posición del dispositivo.
        </DocsNote>
      </div>
    </DocsSubSection>

    <DocsSubSection id="escaneo-resultados" title="Resultados del escaneo">
      <DocsKeyValue :items="resultadosEscaneo" key-label="Resultado" value-label="Descripción" />

      <div class="mt-4">
        <DocsNote variant="danger">
          Ante un código rechazado, NO permita el acceso manualmente. Solicite al visitante que contacte
          al propietario para generar un nuevo código.
        </DocsNote>
      </div>
    </DocsSubSection>

    <DocsSubSection id="escaneo-registro" title="Registro automático">
      <p class="text-sm leading-relaxed text-muted-foreground">
        Cada escaneo genera automáticamente un registro en el historial de accesos. Se guarda la siguiente
        información:
      </p>

      <ul class="mt-3 space-y-1.5 list-disc list-inside text-sm text-muted-foreground">
        <li>Fecha y hora del escaneo</li>
        <li>Nombre del visitante o residente</li>
        <li>Unidad de destino</li>
        <li>Resultado del escaneo (permitido o denegado)</li>
        <li>Tipo de acceso</li>
      </ul>

      <p class="mt-3 text-sm leading-relaxed text-muted-foreground">
        Los registros son consultables en tiempo real desde la sección Accesos.
      </p>
    </DocsSubSection>
  </DocsSection>
</template>

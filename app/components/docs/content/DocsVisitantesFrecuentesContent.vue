<script setup lang="ts">
const stepsAgregar = [
  'Ir a Visitantes Frecuentes',
  'Presionar "Agregar visitante"',
  'Completar nombre y documento de identidad',
  'Seleccionar el tipo: Invitado o Proveedor',
  'Opcionalmente registrar la placa del vehículo',
  'Guardar',
]
</script>

<template>
  <DocsSection id="visitantes-frecuentes" title="Visitantes frecuentes">
    <DocsRoleBadges :roles="['propietario', 'conserje']" />

    <p class="mt-3 text-sm leading-relaxed text-muted-foreground">
      El directorio de visitantes frecuentes permite guardar los datos de personas que visitan el
      condominio de forma recurrente. Esto agiliza la generación de códigos QR, evitando ingresar
      los datos cada vez.
    </p>

    <DocsSubSection id="frecuentes-agregar" title="Agregar un visitante frecuente">
      <DocsStepList :steps="stepsAgregar" />
    </DocsSubSection>

    <DocsSubSection id="frecuentes-qr" title="Generar QR rápido">
      <p class="text-sm leading-relaxed text-muted-foreground">
        Desde la lista de visitantes frecuentes se puede generar un código QR con un solo clic. Los
        datos del visitante se prellenan automáticamente, por lo que solo es necesario confirmar o
        ajustar la fecha de validez antes de generar el código.
      </p>

      <div class="mt-4">
        <DocsNote variant="info">
          El sistema registra la cantidad de visitas y la fecha de la última visita de cada visitante
          frecuente, lo que facilita el seguimiento.
        </DocsNote>
      </div>
    </DocsSubSection>
  </DocsSection>
</template>

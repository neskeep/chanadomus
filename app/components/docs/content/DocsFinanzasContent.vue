<script setup lang="ts">
const stepsRegistrar = [
  'Ir a Finanzas',
  'Presionar "Registrar movimiento"',
  'Seleccionar el tipo de movimiento: Cargo (deuda) o Abono (pago)',
  'Seleccionar la unidad',
  'Ingresar el monto',
  'Escribir una descripción del concepto (ejemplo: "Cuota de mantenimiento - Mayo 2026")',
  'Seleccionar la fecha del movimiento',
  'Guardar',
]

const tiposMovimiento = [
  { key: 'Cargo', value: 'Representa una deuda o cuota que la unidad debe pagar. Aumenta el saldo pendiente.' },
  { key: 'Abono', value: 'Representa un pago realizado por la unidad. Reduce el saldo pendiente.' },
]

const stepsInforme = [
  'Ir a Finanzas',
  'Seleccionar la pestaña "Informes"',
  'Presionar "Subir informe"',
  'Seleccionar el año y mes del informe',
  'Subir el archivo PDF',
  'Guardar',
]

const indicadoresPanel = [
  { key: 'Total de cargos', value: 'Suma de todos los cargos registrados en el periodo.' },
  { key: 'Total de abonos', value: 'Suma de todos los pagos recibidos en el periodo.' },
  { key: 'Tasa de cobranza', value: 'Porcentaje de abonos respecto a los cargos. Indica la eficiencia de cobro.' },
  { key: 'Saldo pendiente', value: 'Monto total adeudado por todas las unidades.' },
  { key: 'Unidades en mora', value: 'Cantidad de unidades con saldo pendiente.' },
]
</script>

<template>
  <DocsSection id="finanzas" title="Gestión financiera">
    <DocsRoleBadges :roles="['admin', 'propietario']" />

    <p class="mt-3 text-sm leading-relaxed text-muted-foreground">
      El módulo financiero permite al administrador registrar cargos y abonos por unidad, generar
      estados de cuenta y publicar informes financieros. Los propietarios pueden consultar su saldo
      y movimientos.
    </p>

    <DocsSubSection id="finanzas-registrar" title="Registrar un movimiento">
      <DocsStepList :steps="stepsRegistrar" />

      <div class="mt-4">
        <DocsNote variant="info">
          Registre los movimientos con descripciones claras y consistentes. Esto facilita la consulta
          posterior y la generación de reportes.
        </DocsNote>
      </div>
    </DocsSubSection>

    <DocsSubSection id="finanzas-tipos" title="Tipos de movimiento">
      <DocsKeyValue :items="tiposMovimiento" key-label="Tipo" value-label="Descripción" />
    </DocsSubSection>

    <DocsSubSection id="finanzas-estado-cuenta" title="Estado de cuenta">
      <ul class="mt-3 space-y-1.5 list-disc list-inside text-sm text-muted-foreground">
        <li>Cada unidad tiene un estado de cuenta que refleja su saldo actual</li>
        <li>El saldo se calcula automáticamente: total de cargos menos total de abonos</li>
        <li>El administrador puede consultar el estado de cuenta de cualquier unidad desde Finanzas > Saldos</li>
        <li>Los propietarios consultan su propio estado de cuenta desde la sección "Estado de cuenta" en su menú</li>
      </ul>
    </DocsSubSection>

    <DocsSubSection id="finanzas-informes" title="Informes financieros">
      <p class="text-sm leading-relaxed text-muted-foreground">
        El administrador puede subir informes financieros periódicos en formato PDF.
      </p>

      <DocsStepList :steps="stepsInforme" />

      <p class="mt-3 text-sm leading-relaxed text-muted-foreground">
        Los propietarios pueden consultar y descargar los informes desde su seccion "Informes".
      </p>
    </DocsSubSection>

    <DocsSubSection id="finanzas-indicadores" title="Indicadores del panel">
      <DocsKeyValue :items="indicadoresPanel" key-label="Indicador" value-label="Descripción" />

      <div class="mt-4">
        <DocsNote variant="warning">
          Los indicadores financieros se calculan en tiempo real con base en los movimientos
          registrados. Asegúrese de mantener los registros actualizados para que los indicadores
          reflejen la situación real del condominio.
        </DocsNote>
      </div>
    </DocsSubSection>
  </DocsSection>
</template>

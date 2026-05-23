<script setup lang="ts">
const stepsRegistrarAdmin = [
  'Ir a Gestión > Unidades.',
  'Seleccionar la unidad correspondiente.',
  'En la pestaña "Vehículos", presionar "Agregar vehículo".',
  'Completar placa, marca, modelo y color.',
  'Opcionalmente, asociar el vehículo al miembro propietario.',
  'Guardar los cambios.',
]

const stepsRegistrarPropietario = [
  'Ir a Mi Unidad.',
  'Abrir la pestaña "Vehículos".',
  'Presionar "Agregar vehículo".',
  'Completar los datos del vehículo.',
  'Guardar los cambios.',
]

const camposVehiculo = [
  { key: 'Placa', value: 'Número de placa del vehículo (único en el sistema).' },
  { key: 'Marca', value: 'Fabricante del vehículo.' },
  { key: 'Modelo', value: 'Modelo específico del vehículo.' },
  { key: 'Color', value: 'Color del vehículo.' },
  { key: 'Propietario', value: 'Miembro del hogar al que pertenece (opcional).' },
]
</script>

<template>
  <DocsSection id="vehiculos" title="Vehículos">
    <DocsRoleBadges :roles="['admin', 'propietario']" />

    <p class="mt-3 text-sm leading-relaxed text-muted-foreground">
      Este módulo permite registrar los vehículos asociados a cada unidad del condominio. Los vehículos
      registrados pueden recibir pases QR vehiculares para el control de acceso.
    </p>

    <DocsSubSection id="vehiculos-registrar" title="Registrar un vehículo">
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

    <DocsSubSection id="vehiculos-campos" title="Campos del vehículo">
      <DocsKeyValue :items="camposVehiculo" />
    </DocsSubSection>

    <div class="mt-6">
      <DocsNote variant="warning">
        La placa del vehículo debe ser única. No es posible registrar dos vehículos con la misma
        placa, incluso en unidades diferentes.
      </DocsNote>
    </div>
  </DocsSection>
</template>

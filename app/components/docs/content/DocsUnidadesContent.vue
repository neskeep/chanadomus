<script setup lang="ts">
const stepsConsultar = [
  'Ir a Gestión > Unidades.',
  'Utilizar los filtros o el buscador para localizar la unidad.',
  'Hacer clic en la unidad para ver su detalle.',
  'En el detalle se muestran: miembros del hogar, vehículos registrados y personal de servicio.',
]
</script>

<template>
  <DocsSection id="unidades" title="Unidades y propiedades">
    <DocsRoleBadges :roles="['admin']" />

    <p class="mt-3 text-sm leading-relaxed text-muted-foreground">
      Cada vivienda del condominio está registrada como una unidad. Las unidades son la base de la
      organización: a cada una se le asignan propietarios, miembros del hogar, vehículos y personal
      de servicio.
    </p>

    <DocsSubSection id="unidades-tipos" title="Tipos de unidades">
      <p class="text-sm leading-relaxed text-muted-foreground">
        El sistema contempla dos clasificaciones de unidades:
      </p>
      <ul class="mt-3 space-y-1.5 list-disc list-inside text-sm text-muted-foreground">
        <li>
          <span class="font-medium text-foreground">Ranchos</span> — Viviendas principales del fraccionamiento.
        </li>
        <li>
          <span class="font-medium text-foreground">Parcelas</span> — Terrenos o lotes sin construcción.
        </li>
      </ul>
      <p class="mt-3 text-sm leading-relaxed text-muted-foreground">
        Cada unidad tiene un número único (por ejemplo, R-001) y puede tener un nombre descriptivo opcional.
      </p>
    </DocsSubSection>

    <DocsSubSection id="unidades-consultar" title="Consultar una unidad">
      <DocsStepList :steps="stepsConsultar" />
    </DocsSubSection>

    <DocsSubSection id="unidades-estado" title="Estado de la unidad">
      <p class="text-sm leading-relaxed text-muted-foreground">
        Las unidades pueden estar en estado activo o inactivo. Una unidad inactiva deja de aparecer
        en los selectores y asignaciones del sistema, pero sus datos históricos se conservan.
      </p>

      <div class="mt-4">
        <DocsNote variant="warning">
          Desactivar una unidad no elimina los datos asociados. Los miembros, vehículos y registros
          financieros se mantienen en el sistema.
        </DocsNote>
      </div>
    </DocsSubSection>
  </DocsSection>
</template>

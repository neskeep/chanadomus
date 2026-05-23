<script setup lang="ts">
const capacidades = [
  'Control de acceso con códigos QR para visitantes, residentes y personal',
  'Gestión financiera: cargos, abonos, estados de cuenta e informes',
  'Comunicación comunitaria: chat en tiempo real, cartelera y notificaciones',
  'Gestión de incidencias y reportes',
  'Votaciones y gobernanza comunitaria',
  'Directorio de proveedores con reseñas',
  'Botón de pánico para emergencias',
  'Notificaciones push en tiempo real',
]
</script>

<template>
  <DocsSection id="introduccion" title="Visión general">
    <p class="text-sm leading-relaxed text-muted-foreground">
      Bienvenido al manual de uso de ChanaDomus, la plataforma de gestión exclusiva de Ranchos de Chana.
    </p>

    <DocsSubSection id="introduccion-que-es" title="¿Qué es ChanaDomus?">
      <p class="text-sm leading-relaxed text-muted-foreground">
        ChanaDomus es la aplicación web progresiva (PWA) desarrollada exclusivamente para la gestión
        integral de Ranchos de Chana. Integra en un solo lugar todas las herramientas que la administración,
        los propietarios, el personal de vigilancia y el equipo de conserjería necesitan para la operación
        diaria del condominio.
      </p>
    </DocsSubSection>

    <DocsSubSection id="introduccion-dirigida" title="¿Para quién es esta guía?">
      <p class="text-sm leading-relaxed text-muted-foreground">
        Esta guía está dirigida a los administradores de Ranchos de Chana. Documenta cada módulo,
        proceso y funcionalidad del sistema para que pueda consultar cualquier aspecto de la plataforma
        en cualquier momento. Los propietarios, conserjes y personal de vigilancia también encontrarán
        información relevante sobre las funciones disponibles para su rol.
      </p>
    </DocsSubSection>

    <DocsSubSection id="introduccion-capacidades" title="Capacidades principales">
      <ul class="mt-3 space-y-1.5 list-disc list-inside text-sm text-muted-foreground">
        <li v-for="capacidad in capacidades" :key="capacidad">
          {{ capacidad }}
        </li>
      </ul>
    </DocsSubSection>

    <DocsSubSection id="introduccion-como-funciona" title="¿Cómo funciona?">
      <p class="text-sm leading-relaxed text-muted-foreground">
        ChanaDomus es accesible desde cualquier navegador web moderno. Además, puede instalarse como
        aplicación en dispositivos móviles para un acceso rápido y directo desde la pantalla de inicio.
        Las funciones básicas permanecen disponibles incluso sin conexión a internet.
      </p>

      <div class="mt-4">
        <DocsNote variant="info">
          ChanaDomus se actualiza automáticamente. Siempre tendrá acceso a las funciones más recientes
          sin necesidad de descargar actualizaciones.
        </DocsNote>
      </div>
    </DocsSubSection>
  </DocsSection>
</template>

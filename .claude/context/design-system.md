# Sistema de Diseno — ChanaDomus

## Preset shadcn-vue
- **Estilo**: reka-luma
- **Font**: Inter (Google Fonts, variable)
- **Base color**: taupe
- **CSS Variables**: habilitadas
- **Menu color**: default-translucent
- **Menu accent**: subtle
- **Border radius**: 0.625rem (--radius)
- **RTL**: deshabilitado

## Paleta de Colores (Light)
- **Primary**: oklch(0.511 0.096 186.391) — teal/verde azulado
- **Secondary**: oklch(0.967 0.001 286.375)
- **Destructive**: oklch(0.577 0.245 27.325)
- **Muted**: oklch(0.96 0.002 17.2)
- **Background**: oklch(1 0 0) — blanco
- **Foreground**: oklch(0.147 0.004 49.3) — casi negro

## Estrategia Responsive (Mobile-First)
ChanaDomus es PWA — el diseno movil es la experiencia principal.

| Rol | Dispositivo principal | Breakpoint foco |
|-----|----------------------|-----------------|
| Propietario | Movil | `sm` (default) |
| Vigilancia | Movil/Tablet | `sm` → `md` |
| Conserje | Tablet | `md` |
| Administrador | Desktop | `md` → `lg` |

Siempre disenar en orden: movil → tablet → desktop.

## Componentes Instalados
Ver `.claude/state/installed-components.md` para lista actualizada.

## Patrones UI Validados (Referencia: vigilancia/accesos.vue)

### Card Compacto (Feed/Listado)
- **Padding**: `px-3 py-2.5` — compacto pero tocable
- **Spacing entre cards**: `space-y-2`
- **Row 1**: Nombre (text-sm font-semibold truncate) + Badge unidad (text-[11px]) + Hora (text-[11px] tabular-nums)
- **Row 2**: Meta inline (text-[11px]) con separadores `·` (opacity-30), items con `gap-x-1`
- **Acciones inline**: Botones ghost `h-6 px-2 text-[11px]` al final de Row 2 — NUNCA en fila propia
- **Sin bordes coloreados** en cards — cards limpios del design system
- **Sin fondos de estado** en cards — el estado se indica con texto coloreado o dots externos

### Timeline (Feed cronologico)
- **Linea vertical**: `w-px bg-border` posicionada con `absolute left-[5px]`
- **Dots**: `size-2.5 rounded-full ring-2 ring-background` coloreados por estado
- **Colores dots**: primary (permitido/ok), destructive (denegado/error), amber-500 (warning)
- **Offset**: `pl-5` en container, dot posicionado con `absolute -left-5`

### Principios de Compactacion
1. **Maximo 2 filas** por card en feeds — nombre+badges arriba, meta+acciones abajo
2. **Acciones inline** — botones ghost pequeños al final de la meta line, nunca en fila separada
3. **Info que reemplaza accion** — cuando una accion se completa (ej: salida marcada), el resultado ocupa el mismo slot inline
4. **text-[11px]** para meta, **text-sm** para contenido principal, **text-base** para titulos
5. **tabular-nums** en todos los datos numericos/hora
6. **truncate** en nombres y textos largos para evitar wrap

### Topbar Actions
- Badge de estado (conectado/desconectado) via `useTopbarPortal()`
- Busqueda via `TopbarSearch` component
- Acciones secundarias como botones en la action zone

## Reglas de Uso
1. Usar SOLO componentes shadcn-vue del registro
2. Usar SOLO clases Tailwind para estilos
3. No `<style>` en componentes Vue
4. No archivos CSS adicionales (solo `main.css` generado por shadcn)
5. Para patrones no cubiertos por shadcn, preguntar antes de crear custom

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

## Reglas de Uso
1. Usar SOLO componentes shadcn-vue del registro
2. Usar SOLO clases Tailwind para estilos
3. No `<style>` en componentes Vue
4. No archivos CSS adicionales (solo `main.css` generado por shadcn)
5. Para patrones no cubiertos por shadcn, preguntar antes de crear custom

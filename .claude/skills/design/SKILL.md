---
name: design
description: Pre-carga todo el contexto de diseno UI y reglas visuales antes de trabajar en componentes o paginas. Usa /design <descripcion de lo que quieres hacer>.
---

# Contexto de Diseno — ChanaDomus

## 1. Lee estos archivos ANTES de hacer cualquier cosa

- `.impeccable.md` — Brand personality, direccion estetica, anti-references
- `.claude/context/design-system.md` — Paleta, patrones UI validados, card standards
- `.claude/context/skills-ui.md` — Workflow obligatorio y skills disponibles

## 2. Referencia Golden

El archivo `app/pages/vigilancia/accesos.vue` es el estandar validado para cards, feeds y listados. Consultarlo para padding, spacing, text sizes, acciones inline.

## 3. Herramientas disponibles

| Tipo | Herramienta | Cuando usar |
|------|-------------|-------------|
| Agente | `nuxt-ui` | Implementacion de componentes y paginas |
| Agente | `project-orchestrator` | Coordinacion multi-dominio |
| Skill | `frontend-design` | **OBLIGATORIO** antes de escribir codigo UI |
| Skill | `shadcn` | Buscar, agregar, gestionar componentes shadcn-vue |
| Skill | `/critique` | Diagnostico UX: heuristics score, anti-patterns |
| Skill | `/audit` | Auditoria tecnica: a11y, performance, responsive |
| Skill | `/polish` | **OBLIGATORIO** como paso final de todo cambio UI |
| Skill | `/animate` | Microinteracciones con proposito |
| Skill | `/adapt` | Adaptacion responsive multi-dispositivo |
| Skill | `/clarify` | Mejora de UX copy, labels, errores, empty states |
| Skill | `ui-ux-pro-max` | Revision general UX post-implementacion |

## 4. Reglas de UI

- **Solo shadcn-vue + Tailwind** — Cero CSS custom, cero `<style>`, cero archivos .css adicionales
- **Desktop-first** — Disenar primero para desktop, luego ajustar a tablet y mobile
- **Card compacto** — Maximo 2 filas por card en feeds, acciones inline como ghost buttons
- **Sin bordes coloreados** en cards — Estado se indica con texto coloreado o dots
- **Sin fondos de estado** en cards — Cards limpios del design system
- **Diagnostico antes de implementar** — `/critique` o `/audit` si el componente ya existe
- **`frontend-design` antes de codigo** — Disenar el componente/pagina antes de escribir Vue
- **`/polish` al final** — Siempre como ultimo paso despues de implementar
- **Si cambias patrones UI** → Actualizar `.claude/context/design-system.md`

## 5. Tarea

$ARGUMENTS

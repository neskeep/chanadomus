# /design — Comando de UI

Pre-carga contexto visual y delega al agente `nuxt-ui`.

## Instrucciones

1. **Lee contexto obligatorio:**
   - `.impeccable.md` — Brand personality, direccion estetica, anti-references
   - `.claude/context/design-system.md` — Patrones UI validados, card standards
   - `.claude/context/branding.md` — Paleta, tipografia, identidad visual
   - `.claude/context/skills-ui.md` — Workflow obligatorio y skills disponibles
   - `.claude/state/installed-components.md` — Componentes shadcn-vue disponibles

2. **Ejecuta el skill `frontend-design`** (o `impeccable` si el componente es complejo como dashboard, wizard, portal).

3. **Delega implementacion al agente `nuxt-ui`** con el spec generado.

4. **Referencia Golden:** `app/pages/vigilancia/accesos.vue` para cards, feeds y listados.

5. **Reglas no negociables:**
   - Solo clases de Tailwind, zero custom CSS, zero `<style>`
   - Componentes shadcn-vue donde aplique (zero elementos nativos del navegador)
   - Colores solo via tokens (nunca `text-[#hex]`, nunca `text-red-500`)
   - Desktop-first: disenar para lg, adaptar hacia abajo
   - Card compacto: max 2 filas, acciones inline ghost, sin bordes/fondos de estado

6. **Post-implementacion:** ejecuta `/critique` para evaluar calidad (score 0-40).

## Tarea

$ARGUMENTS

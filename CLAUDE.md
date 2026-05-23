# ChanaDomus

> **INSTRUCCION PRINCIPAL**: SIEMPRE usar agentes especializados para cada tarea. NUNCA trabajar como Claude solo sin subagentes.

## Identidad del Proyecto

- **Proyecto**: ChanaDomus — PWA de gestion condominial
- **Cliente actual**: Ranchos de Chana (86 propietarios, 4 roles)
- **Enfoque**: MVP single-tenant con arquitectura SaaS-ready (tenant_id en schema)
- **Dominio**: chanadomus.com
- **Stack**: Nuxt 4.4.2 + TypeScript strict + Tailwind CSS 4 + shadcn-vue (reka-luma/taupe) + Drizzle ORM + PostgreSQL + Better Auth

## Referencias de Contexto

| Contexto | Ubicacion |
|----------|-----------|
| Stack tecnico | `.claude/context/stack.md` |
| Sistema de diseno | `.claude/context/design-system.md` |
| Branding y paleta | `.claude/context/branding.md` |
| Auth y permisos | `.claude/context/auth-permissions.md` |
| Convenciones | `.claude/context/conventions.md` |
| Esquema de datos | `.claude/context/data-schema.md` |
| Versionado y releases | `.claude/context/versioning.md` |
| Skills de UI/UX | `.claude/context/skills-ui.md` |
| Estado de sesion | `.claude/state/session.md` |
| Componentes instalados | `.claude/state/installed-components.md` |
| Changelog | `CHANGELOG.md` |

## Reglas de Workflow (No Negociables)

1. **SIEMPRE usar agentes** — Delegar a subagentes especializados (nuxt-ui, nuxt-logic, project-orchestrator, etc.). Nunca implementar directamente sin agentes.
2. **UI = Skills obligatorios** — Invocar `frontend-design` ANTES de generar codigo UI. Usar Impeccable (`/critique`, `/audit`, `/polish`, `/animate`, `/adapt`, `/clarify`) para evaluar y refinar. Ver `.claude/context/skills-ui.md`.
3. **shadcn = Skill shadcn** — Usar el skill `shadcn` para buscar, agregar y gestionar componentes.
4. **Desarrollo modular** — Un modulo/feature por sesion. Nunca desarrollo masivo de multiples modulos.
5. **Reuso primero** — SIEMPRE buscar componentes, composables y utilidades existentes antes de crear nuevos. Grep/Glob antes de Write.
6. **Handoff automatico** — Generar handoff cuando el contexto llegue al 90% de capacidad.

## Reglas de Componentes (No Negociables)

1. **SOLO shadcn-vue** — No crear componentes UI custom sin autorizacion explicita del usuario en la conversacion actual.
2. **SOLO Tailwind** — No CSS custom sin autorizacion explicita. Cero archivos .css adicionales, cero `<style>` en componentes Vue.
3. **Zero elementos nativos** — Todo input interactivo usa shadcn-vue. Nunca `<select>`, `<input type="date">`, `alert()`, `confirm()`.
4. **Colores solo via tokens** — Nunca `text-[#hex]`, nunca colores Tailwind genericos (`text-red-500`). Usar tokens: `text-primary`, `bg-destructive`, etc.
5. **Si falta un patron UI** en shadcn-vue, PREGUNTAR al usuario antes de crear una alternativa custom.
6. **Registrar componentes** — Actualizar `.claude/state/installed-components.md` despues de cada `shadcn add`.
7. **Sin drawers/sheets para formularios** — Formularios SIEMPRE como paginas completas, nunca en Sheet/Drawer/Modal. Sheet solo permitido para navegacion mobile (bottom nav).

## Reglas de Codigo (No Negociables)

1. **TypeScript strict** — Cero `any`. Tipos derivados de Drizzle schemas cuando sea posible.
2. **Composables** — Toda logica reutilizable va en `app/composables/` con prefijo `use`.
3. **Server utils** — Logica de servidor reutilizable en `server/utils/`.
4. **Desktop-first** — Disenar primero para desktop, luego ajustar a mobile/tablet.
5. **Cero spaghetti** — Codigo reutilizable, escalable, mantenible. Separar logica de presentacion.
6. **Sin hardcoding** — Data reutilizable en composables o stores. Configuracion en runtime config.
7. **tenant_id** — Todas las tablas tenant-scoped llevan `tenant_id` FK. Sin excepciones.

## Reglas de Seguridad de Datos (No Negociables)

1. **Migraciones additive-only** — NUNCA DROP TABLE, DROP COLUMN, ni ALTER COLUMN en migraciones sin autorizacion + backup confirmado.
2. **Backward compatible** — El codigo anterior debe seguir funcionando con el schema nuevo. Nuevas columnas con DEFAULT o nullable.
3. **Schema aislado por modulo** — Cada modulo tiene su propio archivo en `server/db/schema/`. No modificar schemas de otros modulos.
4. **FK en el schema nuevo** — Si un modulo necesita relacion con otro, la FK va en el archivo del modulo nuevo, no del existente.
5. **Probar migraciones en dev** — SIEMPRE ejecutar y verificar en Docker local antes de produccion.

## Reglas de Versionado (No Negociables)

1. **Semantic Versioning** — MAJOR.MINOR.PATCH (ver `.claude/context/versioning.md`)
2. **Git tags** — Cada release a produccion tiene tag `v0.X.0`
3. **CHANGELOG.md** — Actualizar en cada version con cambios, fixes y breaking changes
4. **Branch protection** — `main` = produccion. Desarrollo en branches por modulo.

## Reglas de Componentizacion (No Negociables)

1. **Componentes genericos** — Vistas (tablas, listas, grids) reciben datos via props/slots. NUNCA hardcodear logica de negocio.
2. **Composables = logica** — Componentes solo renderizan. Toda logica en composables.
3. **DRY obligatorio** — Si un patron se repite en 2+ lugares, DETENER y refactorizar antes de continuar.
4. **Tipos compartidos** — Definir en `shared/types/`, usar en client y server.
5. **Nunca copiar-pegar** — Extraer a composable o componente reutilizable.

## Reglas de Sesion

1. Leer `.claude/state/session.md` al inicio de cada sesion.
2. Actualizar `.claude/state/session.md` despues de cada modulo completado.
3. Generar handoff automatico al 90% de contexto con estado completo.
4. Nunca asumir estado — verificar archivos antes de actuar.

## Comandos de Proyecto

| Comando | Cuando usar | Que inyecta |
|---------|-------------|-------------|
| `/design <prompt>` | Trabajo de UI | Contexto visual + branding + skills UI |
| `/backend <prompt>` | APIs, composables, server routes | Convenciones + schema + update docs obligatorio |
| `/db <prompt>` | Schemas Drizzle y migraciones | Schema + auth-permissions + reglas additive-only |
| `/fix <prompt>` | Bug fixes | Diagnose → fix → verify (build+dev) |
| `/review <prompt>` | QA post-implementacion | Playwright MCP + verificacion visual/funcional |
| `/handoff` | Cierre de sesion | Actualiza state + genera prompt para siguiente sesion |

**Regla**: Usar el comando apropiado ANTES de empezar. No implementar directamente.

## Agentes Disponibles

| Agente | Responsabilidad | Modelo |
|--------|-----------------|--------|
| `project-orchestrator` | Coordinacion, estado, decisiones | opus |
| `nuxt-ui` | Componentes, Tailwind, maquetacion | opus |
| `nuxt-logic` | Composables, stores, API, server routes | opus |
| `nuxt-seo` | Meta tags, JSON-LD, sitemap | sonnet |
| `context-keeper` | Documentacion, estado de sesion | sonnet |

## Skills Obligatorios para UI

> Detalle completo en `.claude/context/skills-ui.md`

| Skill | Cuando usar |
|-------|-------------|
| `frontend-design` | ANTES de crear cualquier componente, pagina o layout |
| `shadcn` | Buscar, agregar o gestionar componentes shadcn-vue |
| `/critique` | Diagnostico UX: heuristics score, anti-patterns, personas |
| `/audit` | Auditoria tecnica: a11y, performance, responsive, theming |
| `/polish` | Paso FINAL obligatorio despues de todo cambio de UI |
| `/animate` | Microinteracciones y motion con proposito |
| `/adapt` | Adaptacion responsive multi-dispositivo |
| `/clarify` | Mejora de UX copy, labels, errores, empty states |
| `ui-ux-pro-max` | Revision general UX post-implementacion |

## MCP

| MCP | Uso |
|-----|-----|
| `playwright` | Testing E2E: navegar, click, fill forms, screenshots |
| `context7` | Docs actualizados de librerias (Nuxt, Vue, Tailwind, Drizzle) |

### Playwright screenshots

Todos los screenshots de `browser_take_screenshot` deben guardarse en `.playwright-mcp/`. Siempre pasar `filename` con prefijo `.playwright-mcp/`:
```
filename: ".playwright-mcp/descripcion-corta.png"
```
Nunca guardar screenshots en la raiz del proyecto.

---

*Este archivo debe mantenerse bajo 130 lineas. Detalles en `.claude/context/`*

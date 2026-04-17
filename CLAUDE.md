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
| Convenciones | `.claude/context/conventions.md` |
| Esquema de datos | `.claude/context/data-schema.md` |
| Estado de sesion | `.claude/state/session.md` |
| Componentes instalados | `.claude/state/installed-components.md` |

## Reglas de Workflow (No Negociables)

1. **SIEMPRE usar agentes** — Delegar a subagentes especializados (nuxt-ui, nuxt-logic, project-orchestrator, etc.). Nunca implementar directamente sin agentes.
2. **UI = Skills obligatorios** — Invocar `frontend-design` y/o `ui-ux-pro-max` ANTES de generar cualquier codigo de UI. Sin excepcion.
3. **shadcn = Skill shadcn** — Usar el skill `shadcn` para buscar, agregar y gestionar componentes.
4. **Desarrollo modular** — Un modulo/feature por sesion. Nunca desarrollo masivo de multiples modulos.
5. **Reuso primero** — SIEMPRE buscar componentes, composables y utilidades existentes antes de crear nuevos. Grep/Glob antes de Write.
6. **Handoff automatico** — Generar handoff cuando el contexto llegue al 90% de capacidad.

## Reglas de Componentes (No Negociables)

1. **SOLO shadcn-vue** — No crear componentes UI custom sin autorizacion explicita del usuario en la conversacion actual.
2. **SOLO Tailwind** — No CSS custom sin autorizacion explicita. Cero archivos .css adicionales, cero `<style>` en componentes Vue.
3. **Si falta un patron UI** en shadcn-vue, PREGUNTAR al usuario antes de crear una alternativa custom.
4. **Registrar componentes** — Actualizar `.claude/state/installed-components.md` despues de cada `shadcn add`.

## Reglas de Codigo (No Negociables)

1. **TypeScript strict** — Cero `any`. Tipos derivados de Drizzle schemas cuando sea posible.
2. **Composables** — Toda logica reutilizable va en `app/composables/` con prefijo `use`.
3. **Server utils** — Logica de servidor reutilizable en `server/utils/`.
4. **Mobile-first** — Siempre disenar para movil primero. PWA es el producto.
5. **Cero spaghetti** — Codigo reutilizable, escalable, mantenible. Separar logica de presentacion.
6. **Sin hardcoding** — Data reutilizable en composables o stores. Configuracion en runtime config.
7. **tenant_id** — Todas las tablas tenant-scoped llevan `tenant_id` FK. Sin excepciones.

## Reglas de Sesion

1. Leer `.claude/state/session.md` al inicio de cada sesion.
2. Actualizar `.claude/state/session.md` despues de cada modulo completado.
3. Generar handoff automatico al 90% de contexto con estado completo.
4. Nunca asumir estado — verificar archivos antes de actuar.

## Agentes Disponibles

| Agente | Responsabilidad | Modelo |
|--------|-----------------|--------|
| `project-orchestrator` | Coordinacion, estado, decisiones | opus |
| `nuxt-ui` | Componentes, Tailwind, maquetacion | opus |
| `nuxt-logic` | Composables, stores, API, server routes | opus |
| `nuxt-seo` | Meta tags, JSON-LD, sitemap | sonnet |
| `context-keeper` | Documentacion, estado de sesion | sonnet |

## Skills Obligatorios para UI

| Skill | Cuando usar |
|-------|-------------|
| `frontend-design` | Antes de crear cualquier componente, pagina o layout |
| `ui-ux-pro-max` | Revision de UX post-implementacion (spacing, responsive, accesibilidad) |
| `shadcn` | Buscar, agregar o gestionar componentes shadcn-vue |

---

*Este archivo debe mantenerse bajo 100 lineas. Detalles en `.claude/context/`*

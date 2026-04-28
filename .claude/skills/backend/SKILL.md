---
name: backend
description: Pre-carga convenciones de codigo y esquema de datos antes de trabajar en APIs, composables, server routes o schemas. Usa /backend <descripcion de lo que quieres hacer>.
---

# Contexto Backend — ChanaDomus

## 1. Lee estos archivos ANTES de hacer cualquier cosa

- `.claude/context/conventions.md` — Naming, estructura de directorios, formato de API responses
- `.claude/context/data-schema.md` — Drizzle schemas, tenant_id, patron multi-tenant

## 2. Agente

Delegar implementacion al agente `nuxt-logic`. Pasarle el contexto de convenciones y schema.

## 3. Reglas de Backend

### TypeScript
- **Strict** — Cero `any`. Sin excepciones.
- Tipos derivados de Drizzle: `$inferSelect` / `$inferInsert`
- Tipos compartidos en `shared/types/`

### Base de Datos
- **`tenant_id`** en TODA tabla tenant-scoped. Sin excepciones.
- **Migraciones additive-only** — NUNCA `DROP TABLE`, `DROP COLUMN`, `ALTER COLUMN` sin autorizacion explicita del usuario + backup confirmado
- Nuevas columnas con `DEFAULT` o `nullable` para backward compatibility
- **Schema aislado por modulo** — Cada modulo tiene su archivo en `server/db/schema/`. No modificar schemas de otros modulos.
- Si un modulo nuevo necesita FK a otro, la FK va en el schema del modulo nuevo

### API Routes
- Naming: kebab-case con sufijo HTTP (`access-logs.get.ts`)
- Exito: `{ data: T }`
- Lista paginada: `{ data: T[], meta: { total, page, limit } }`
- Error: `createError()` de H3 con `statusCode` y `message`
- Validacion en el boundary (input de API), no en logica interna

### Composables y Utils
- Composables en `app/composables/` con prefijo `use`
- Server utils en `server/utils/`
- Logica reutilizable SIEMPRE en composable o util, nunca inline en componentes

## 4. Actualizacion de Contexto (OBLIGATORIO)

Si los cambios de esta tarea modifican:
- Estructura de datos (nuevas tablas, columnas, relaciones) → Actualizar `.claude/context/data-schema.md`
- Convenciones o patrones nuevos → Actualizar `.claude/context/conventions.md`
- Componentes instalados → Actualizar `.claude/state/installed-components.md`

No saltar este paso. Los docs de contexto deben reflejar el estado real del proyecto.

## 5. Tarea

$ARGUMENTS

# /db — Comando de migraciones Drizzle

Crea o modifica schemas Drizzle y genera migraciones con reglas de seguridad.

## Instrucciones

1. **Lee contexto obligatorio:**
   - `.claude/context/data-schema.md` — Schema actual completo
   - `.claude/context/auth-permissions.md` — Roles y permisos por endpoint
   - `.claude/context/conventions.md` — Naming de tablas y columnas

2. **Delega al agente `nuxt-logic`** con contexto de schema.

3. **Reglas de schema Drizzle:**
   - Schema aislado por modulo: `server/db/schema/<modulo>.ts`
   - `tenant_id` FK en TODA tabla tenant-scoped. Sin excepciones.
   - Nuevas columnas con `.default()` o `.notNull()` false para backward compatibility
   - Si un modulo nuevo necesita FK a otro, la FK va en el schema del modulo nuevo
   - Naming: tablas snake_case plural (`access_logs`), columnas snake_case (`created_at`)
   - Tipos derivados: exportar `$inferSelect` / `$inferInsert` de cada tabla

4. **Reglas de migracion (additive-only):**
   - NUNCA `DROP TABLE`, `DROP COLUMN`, `ALTER COLUMN` sin autorizacion explicita + backup
   - Generar con: `pnpm drizzle-kit generate`
   - Aplicar con: `pnpm drizzle-kit push` (dev) o `pnpm drizzle-kit migrate` (prod)
   - Verificar en Docker local ANTES de produccion

5. **Post-migracion (OBLIGATORIO):**
   - Actualizar `.claude/context/data-schema.md` con los cambios
   - Verificar que `requireRole()` cubre los nuevos endpoints
   - Si hay nuevos endpoints, documentar permisos en `.claude/context/auth-permissions.md`

## Tarea

$ARGUMENTS

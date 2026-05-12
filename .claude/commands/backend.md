# /backend — Comando de logica de negocio

Pre-carga contexto tecnico y delega al agente `nuxt-logic`.

## Instrucciones

1. **Lee contexto obligatorio:**
   - `.claude/context/conventions.md` — Naming, estructura, formato de API responses
   - `.claude/context/data-schema.md` — Drizzle schemas, tenant_id, patron multi-tenant
   - `.claude/context/auth-permissions.md` — Roles y permisos por endpoint

2. **Delega implementacion al agente `nuxt-logic`** con contexto completo.

3. **Reglas tecnicas:**
   - TypeScript strict, zero `any`
   - Tipos derivados de Drizzle: `$inferSelect` / `$inferInsert`
   - Tipos compartidos en `shared/types/`
   - `tenant_id` en TODA tabla tenant-scoped
   - Validacion en el boundary (input de API), no en logica interna
   - Logica separada de UI (composables, services, server routes)
   - `requireRole()` en cada endpoint protegido

4. **Actualizacion de contexto (OBLIGATORIO):**
   Si los cambios modifican:
   - Estructura de datos → Actualizar `.claude/context/data-schema.md`
   - Permisos de endpoints → Actualizar `.claude/context/auth-permissions.md`
   - Convenciones o patrones → Actualizar `.claude/context/conventions.md`
   - Componentes instalados → Actualizar `.claude/state/installed-components.md`

## Tarea

$ARGUMENTS

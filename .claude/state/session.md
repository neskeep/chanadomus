# Estado de Sesion — ChanaDomus

## Ultima Sesion
- **Fecha**: 2026-06-22
- **Sesion #**: 69
- **Branch**: `main`
- **Commit**: `b326eb3` (pusheado, deployed)
- **Estado**: Incompleta — 1 fix pendiente de commit+push

## Completado Sesion 69

### Verificacion visual en produccion (Playwright)
- Login y navegacion a /admin/finanzas OK
- 4 features verificadas: date presets, generar cuotas, export CSV, bulk checkboxes
- Todas funcionando correctamente en produccion

### Fixes de 4 issues reportados por Jordi
1. **Bulk POST 400**: Zod 4 `z.string().uuid()` rechaza UUIDs no-v4 (seeds locales) → cambiado a `z.string().min(1)` en 3 endpoints bulk
2. **UnitMultiSelect checkboxes no marcan**: `<label>` wrapping causaba conflicto con `<button>` de Reka UI → cambiado a `<div>` con `@click.stop`, computed `Set` para lookups
3. **Layout formulario generar-cuotas**: Monto+Fecha en fila (grid-cols-2), Descripcion full-width abajo
4. **Bulk select en tabla no reactivo**: `ref<Set>` no es reactivo en Vue 3 → reemplazado con `ref<string[]>([])` usando `.includes()/.splice()/.push()/.length`

### Fix adicional: columna cedula en DB local
- `ALTER TABLE "user" ADD COLUMN cedula TEXT` — faltaba en DB local, causaba error de login

### Contenedor Docker local corregido
- Nombre correcto: `chanadomus-db-1` (no `chanadomuscom-db-1`)
- Actualizado en session state y memoria

## PENDIENTE — NO COMMITEADO NI PUSHEADO
- **Bulk action bar invisible**: La barra flotante de acciones bulk (`fixed bottom-0`) no se ve porque el `SidebarProvider` tiene `overflow-hidden` que rompe `position: fixed`
- **Fix aplicado pero NO commiteado**: `<Teleport to="body">` + `z-50` en `app/pages/admin/finanzas/index.vue`
- **Accion requerida**: `git add app/pages/admin/finanzas/index.vue && git commit && git push`

## Archivos modificados (commiteados en b326eb3)
- `server/api/finance/records/bulk.post.ts` — UUID validation
- `server/api/finance/records/bulk-delete.post.ts` — UUID validation
- `server/api/finance/records/bulk.patch.ts` — UUID validation
- `app/components/UnitMultiSelect.vue` — checkbox visual + Set computed
- `app/pages/admin/finanzas/generar-cuotas.vue` — layout redistribuido
- `app/pages/admin/finanzas/index.vue` — Set→Array reactivity + Teleport (Teleport pendiente)

## Issues abiertos
- Tests `unit/` no corren en CI (zod import falla con frozen-lockfile)
- `pnpm db:migrate` falla en DB local limpia — usar `npx drizzle-kit push --force`
- DB local puede necesitar `ALTER TABLE "user" ADD COLUMN cedula TEXT` si no se corrió drizzle push

## DB local
- Docker `chanadomus-db-1` con datos de seed
- Usuarios seed con password `Yolo2026!`:
  - admin@chanadomus.com (admin)
  - propietario@chanadomus.com (propietario, R-001)
  - vigilante@chanadomus.com (vigilancia)
  - conserje@chanadomus.com (conserje, R-001 staff)

# Estado de Sesion — ChanaDomus

## Ultima Sesion
- **Fecha**: 2026-06-30
- **Sesion #**: 71
- **Branch**: `main`
- **Commit**: `e8f1a99` (ultimo commit pusheado)
- **Estado**: Completa — todos los cambios commiteados y pusheados

## Completado Sesion 71

### Commit y push de sesion 70 pendiente
- Commit `0c08d6c`: Fix #3 (saldo a favor), Fix #1B (historial accesos), breadcrumb vigilancia

### Fix #4: Filtro categorias omite proveedores (RESUELTO)
- **Commit**: `cffb2a8`
- **Archivo**: `server/api/my-unit/service-roles.get.ts`
- **Cambio**: Filtro cambiado de `appliesToStaff=true` a `appliesToStaff=true OR appliesToProviders=true`
- Ahora el dropdown del propietario muestra roles de staff Y proveedores

### Fix #2 mitigacion: Polling fallback para alarma de panico (IMPLEMENTADO)
- **Commit**: `e05c998`
- **Archivos**:
  - `server/api/panic/active.get.ts` (nuevo) — Endpoint ligero para polling, retorna solo alertas activas sin resolver (ultimos 30 min)
  - `app/composables/usePanicStream.ts` — Polling fallback: si WS no conecta en 10s, inicia polling HTTP cada 3s. Detecta nuevas alertas y dismissals. Se detiene automaticamente cuando WS reconecta.
  - `app/pages/vigilancia/alertas.vue` — Indicador de conexion con 3 estados: Conectado (verde), Polling (amber), Desconectado (rojo)

### Fix #6: Ordenamiento jerarquico en listados (IMPLEMENTADO)
- **Commit**: `e8f1a99`
- **Archivos**:
  - `server/api/my-unit/service-staff.get.ts` — ORDER BY displayOrder del rol, nombre del rol, nombre del staff
  - `server/api/staff/index.get.ts` — Misma logica
  - `server/api/units/[id]/service-staff.get.ts` — Misma logica
- Personal de servicio ahora se agrupa naturalmente por categoria/rol

## Incidencias pendientes (de 6 total)
- #1A: Registro como salida — necesita mas info del cliente (no reproducible)
- #2: Panico en Honor Play — ✅ mitigacion implementada (polling fallback)
- #5: PWA Honor Play — recomendacion operativa (usar Chrome)

## Issues abiertos (preexistentes)
- Tests `unit/` no corren en CI (zod import falla con frozen-lockfile)
- `pnpm db:migrate` falla en DB local limpia — usar `npx drizzle-kit push --force`

## DB local
- Docker `chanadomus-db-1` con datos de seed
- Usuarios seed con password `Yolo2026!`:
  - admin@chanadomus.com (admin)
  - propietario@chanadomus.com (propietario, R-001)
  - vigilante@chanadomus.com (vigilancia)
  - conserje@chanadomus.com (conserje, R-001 staff)

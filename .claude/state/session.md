# Estado de Sesion — ChanaDomus

## Ultima Sesion
- **Fecha**: 2026-05-25
- **Sesion #**: 56
- **Branch**: dev
- **Estado**: Completada — handoff por contexto agotado

## Completado Sesion 56

### Pases vehiculares — Pases temporales + QR + Detalle
- **Schema**: migración `0043_vehicle_pass_temporary.sql` — tipo `temporary` en enum, `vehicleId` nullable, campos `unitId` y `description`
- **Tipos**: `shared/types/vehicle-pass.ts` y `shared/types/qr.ts` actualizados para soportar nullables
- **API POST**: Soporta pases temporales sin vehículo (requiere description + expiresAt)
- **API GET list**: leftJoin + resolución de units en batch (sin COALESCE problemático)
- **API GET [id]**: Nuevo endpoint individual con join a usuario emisor
- **API QR validate**: leftJoin para pases sin vehículo, visitorName adaptado
- **UI formulario** (`nuevo.vue`): 3 tipos (Residente/Invitado/Temporal), UnitCombobox estándar, date picker custom (Calendar+Popover+hora)
- **UI lista** (`index.vue`): Badge temporal outline, filtro por tipo, botón QR con `useQrBadge`, cards clickables al detalle
- **UI detalle** (`[id].vue`): Página nueva — layout 2 columnas, info completa + QR + desactivar con confirmación
- **Migración aplicada** en dev con `drizzle-kit push`

### Normativas — Fix 404 en producción
- **Causa raíz**: Filesystem efímero en Docker, sin volumen persistente
- **Fix**: Volumen persistente `/data/chanadomus/uploads:/app/uploads` configurado en Coolify
- **Contenedor recreado** con `docker compose up -d --force-recreate`
- **Normativas re-subidas** por el cliente, funcionando correctamente

### Finanzas — Fix mobile
- **StatCard**: Texto de valor `text-lg md:text-2xl` (antes `text-2xl` fijo, se desbordaba con cifras grandes)
- **Registrar movimiento**: Reemplazado `<Input type="date">` nativo por Calendar+Popover custom

## Pendiente / No commiteado
- Todos los cambios están en branch `dev` sin commit
- La página de registrar finanzas también tiene `<Input type="date">` — ya corregido pero revisar otros formularios del proyecto que puedan tener inputs nativos
- Verificar que Coolify no sobreescriba el volumen en próximos deploys: configurar también desde panel Coolify → Storages

## Archivos creados/modificados
- `server/db/schema/vehicle-pass.ts` — enum + nullable + nuevos campos
- `server/db/migrations/0043_vehicle_pass_temporary.sql` — migración
- `server/db/migrations/meta/_journal.json` — entrada 43
- `shared/types/vehicle-pass.ts` — tipos actualizados
- `shared/types/qr.ts` — campos nullable
- `server/api/vehicle-passes/index.post.ts` — soporte temporal
- `server/api/vehicle-passes/index.get.ts` — leftJoin + batch units
- `server/api/vehicle-passes/[id].get.ts` — NUEVO endpoint
- `server/api/qr/validate.post.ts` — leftJoin pases sin vehículo
- `app/pages/admin/pases-vehiculares/nuevo.vue` — formulario temporal
- `app/pages/admin/pases-vehiculares/index.vue` — QR + clickable + temporal
- `app/pages/admin/pases-vehiculares/[id].vue` — NUEVA página detalle
- `app/composables/useVehiclePasses.ts` — fix tipo spread
- `app/components/StatCard.vue` — responsive text
- `app/pages/admin/finanzas/registrar.vue` — date picker custom

## Entorno
- Docker `chanadomus-db-1` corriendo
- VPS: volumen `/data/chanadomus/uploads` persistente configurado
- Branch dev, cambios sin commit
- Password de test: Yolo2026!

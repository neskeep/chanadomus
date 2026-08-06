# Estado de Sesion — ChanaDomus

## Ultima Sesion
- **Fecha**: 2026-08-05
- **Sesion #**: 76
- **Branch**: `main`
- **Estado**: Incompleta — Módulo de Eventos creado, requiere testing y bugfixing

## Completado Sesion 76

### Módulo de Eventos — Estructura completa creada
- **Schema**: `server/db/schema/event.ts` — tablas `events` y `event_guests` con relaciones
- **Migración**: `0057_careful_steel_serpent.sql` — aplicada en dev local (Docker)
- **Tipos**: `shared/types/event.ts` — EventSummary, EventDetail, EventGuest, CreateEvent, etc.
- **DB changes**: enum `evento` en `entry_type`, columna `event_id` en `access_logs`

### 14 API Endpoints creados (`server/api/events/`)
- CRUD eventos con aprobación admin
- Gestión de invitados + bulk import texto libre
- Check-in / Check-out (crea accessLog, broadcast a feed)
- Reporte post-evento
- Endpoint activos para vigilancia

### 4 Composables
- `useEvents` — CRUD + aprobación
- `useEventGuests` — gestión invitados
- `useEventCheckin` — check-in/out optimista para vigilancia
- `useEventBulkImport` — parser texto libre a nombres

### 10 Páginas Vue
- Admin: `/admin/eventos/` (index, crear, [id])
- Propietario: `/propietario/eventos/` (index, crear, [id])
- Vigilancia: `/vigilancia/eventos/` (index, [id] — interfaz check-in/check-out)
- Conserje: `/conserje/eventos/` (index, crear)

### Integración con sistema existente
- Navegación actualizada en 4 roles (icono PartyPopper)
- ColorMap con colores evento/invitado
- Vistas accesos existentes actualizadas para `entryType: 'evento'`

### Bugs corregidos durante sesión
- Subquery coalesce: `guestCountSq.total` → `"gc"."total"` (en active.get.ts e index.get.ts)
- Fecha serialization: `sql template` → `lte()/gte()` de Drizzle (en active.get.ts)
- UnitCombobox: faltaba prop `:units` en 5 páginas de eventos
- TypeScript: `@update:model-value` typing, CreateEvent.unitId en propietario

## Issues Abiertos — REQUIERE ACCIÓN

### Módulo de Eventos necesita testing completo
- **El usuario reportó "muchas inconsistencias en general"**
- Se debe hacer testing masivo con los 4 roles: admin, propietario, conserje, vigilancia
- Flujo completo: crear evento → agregar invitados → aprobar → check-in/check-out
- Propietario/conserje solo pueden crear para SU unidad (verificar que el server lo enforce)
- Admin puede asignar a cualquier unidad
- Verificar todos los endpoints con curl/browser por rol
- NO SE HA PUSHEADO A PRODUCCIÓN — solo está en dev local

### Decisiones de diseño confirmadas
1. Propietario/conserje crean → status `pendiente` → admin aprueba → `activo`
2. Admin crea directo en `activo`
3. Vigilancia solo ve eventos `activo`
4. Check-in/out sin QR, por nombre, con registro en accessLogs
5. Bulk import via textarea (un nombre por línea)
6. Cualquier guardia puede operar cualquier evento activo

### Issues previos (no resueltos)
- Push notifications desktop browser — no llegan
- WebSocket chat producción — Traefik proxy issue
- drizzle-kit push se cuelga (workaround: SQL directo)

## DB local
- Docker `chanadomus-db-1` (ID `ba772c0075b9`) con port mapping 5432:5432
- Tablas `events` y `event_guests` ya creadas en dev
- Usuarios (password: Yolo2026!):
  - admin@chanadomus.com (admin)
  - propietario@chanadomus.com (propietario, unitId vinculado)
  - vigilante@chanadomus.com (vigilancia)
  - conserje@chanadomus.com (conserje)
  - isenior@zunamicorp.com (admin + isSuperAdmin=true)

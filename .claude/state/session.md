# Estado de Sesion — ChanaDomus

## Ultima Sesion
- **Fecha**: 2026-06-01
- **Sesion #**: 64
- **Branch**: `main`
- **Commit**: pendiente
- **Estado**: Completada

## Completado Sesion 64

### Roles mezclados personal/proveedores (Issue #1 del cliente)
- Reemplazado catalogo compartido `serviceStaffRoles` con dos booleans: `appliesToStaff` + `appliesToProviders`
- Admin gestiona desde `/admin/roles-servicio` con switches por rol
- Migracion `0050_add_service_role_type.sql` con clasificacion de roles existentes
- API GET filtra por `appliesTo=staff|provider`, POST/PATCH aceptan los booleans
- Composables `useStaff` y `useServiceRoles` filtran automaticamente
- Endpoint `/api/my-unit/service-roles` filtra solo staff para propietarios

### Historial de accesos (Issue #6 del cliente — CRITICO LEGAL)
- Nuevo endpoint `GET /api/access/history` con filtros: rango de fechas, resultado, tipo entrada, busqueda nombre/cedula, paginacion offset
- Validacion Zod, max 90 dias de rango, count query optimizado
- Composable `useAccessHistory` con filtros reactivos, default ultimos 7 dias
- Pagina `/accesos/historial` compartida admin+vigilancia con tabla desktop + cards mobile
- Filtros en topbar: resultado, tipo entrada, rango fechas con Calendar picker
- Busqueda inline por nombre/cedula, paginacion, badge total registros
- Ruta `/accesos` agregada a `ROUTE_ROLE_MAP` para admin y vigilancia
- Nav links en sidebar admin ("Historial Accesos") y vigilancia ("Historial")

### Issues menores
- El Molino R-003: corregida fecha typo en abono `2025-03-05` → `2026-03-05` (data fix en DB)
- Samsara R-010: balance de $2.86 es por diferencia real en monto de pago ($347.14 vs $350), no es typo
- Flamboyant R-013: saldo -$3,000 en extraordinaria es por abonos sin cargo correspondiente. Requiere que el admin registre el cargo faltante. No es bug de codigo.

## Validacion puntos del cliente (8 issues de vigilancia)
- **TODOS RESUELTOS**: #1 roles, #2 orden votaciones, #3 agenda, #4 vehiculos, #5 duplicados, #6 historial, #7 personal admin

## Issues abiertos
- Ninguno pendiente de codigo

## DB local
- Docker `chanadomus-db-1` con dump de produccion
- Usuarios demo con password `Yolo2026!`:
  - admin@chanadomus.com (admin)
  - propietario@chanadomus.com (propietario, Rancho Demo)
  - conserje@chanadomus.com (conserje, Guayacan I via staff)
  - vigilante@chanadomus.com (vigilancia)

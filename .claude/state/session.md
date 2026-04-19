# Estado de Sesion — ChanaDomus

## Ultima Sesion
- **Fecha**: 2026-04-19
- **Sesion #**: 12
- **Fase**: Fichas de Viviendas y Base de Personal (v0.9.0)
- **Version**: v0.9.0
- **Branch**: feat/fichas-viviendas
- **Commit**: pendiente
- **Push**: Pendiente

## Resumen Session 12

### M2.4 Completado (5/5 tareas hub)
- Schema: server/db/schema/household.ts (household_members + enum household_relationship)
- Schema: server/db/schema/vehicle.ts (vehicles con unique tenant+plate)
- Schema: server/db/schema/staff.ts (staff + enum staff_role)
- Migracion 0009: CREATE TABLE household_members + vehicles + staff (additive-only)
- Tipos: HouseholdMember, Vehicle, Staff en shared/types/
- Endpoint: GET /api/units/directory (lista con conteos member/vehicle via LEFT JOIN)
- Endpoint: GET/POST /api/units/[id]/members (listar/crear miembros)
- Endpoint: PATCH/DELETE /api/members/[id] (actualizar/soft-delete miembro)
- Endpoint: GET/POST /api/units/[id]/vehicles (listar/crear vehiculos)
- Endpoint: PATCH/DELETE /api/vehicles/[id] (actualizar/hard-delete vehiculo)
- Endpoint: GET /api/vehicles (busqueda global por placa con ILIKE, JOIN unit)
- Endpoint: GET/POST /api/staff (listar con filtro rol/crear personal)
- Endpoint: PATCH/DELETE /api/staff/[id] (actualizar/soft-delete personal)
- Composable: useUnitMembers (CRUD miembros por unidad)
- Composable: useUnitVehicles (CRUD vehiculos por unidad)
- Composable: useStaff (CRUD personal con filtro por rol)
- Composable: useVehicleSearch (busqueda global por placa)
- Vista: app/pages/admin/unidades/index.vue (directorio con conteos, search)
- Vista: app/pages/admin/unidades/[id].vue (ficha con tabs Miembros/Vehiculos, CRUD)
- Vista: app/pages/admin/personal/index.vue (gestion personal, filtro rol, CRUD)
- Vista: app/pages/vigilancia/residentes/index.vue (directorio + busqueda placa)
- Vista: app/pages/vigilancia/residentes/[id].vue (ficha read-only)
- Navegacion: links Unidades y Personal (admin), Residentes (vigilancia)
- shadcn-vue: AlertDialog instalado

### Estado del Hub
- M1.1-M1.5: completed
- M1.6: pendiente (bloqueado VPS)
- M2.1-M2.3: completed
- M2.4: **completed** (5/5 tareas)

### Git
- Branch feat/fichas-viviendas creado desde dev
- Pendiente: commit, merge, tag, push

### Datos de prueba en DB local
- Admin: admin@chanadomus.com / Admin2026!
- Propietario: juan@chanadomus.com / Demo2026! → unidad R-001
- Tablas household_members, vehicles, staff creadas (vacias)

### Notas tecnicas
- Vehiculos: placa normalizada a uppercase, unique per tenant
- Staff: soft delete (isActive = false)
- Members: soft delete (isActive = false)
- Vehicles: hard delete
- Directory endpoint usa LEFT JOIN + COUNT DISTINCT para conteos
- Errores pre-existentes en typecheck: finance/reports (row undefined), nuxt.config (websocket flag)

## Proximo paso
- Commit feat + changelog
- Merge feat/fichas-viviendas → dev
- Tag v0.9.0
- Push a remote
- Siguiente: M3.1 — Chat Tiempo Real

# Estado de Sesion — ChanaDomus

## Ultima Sesion
- **Fecha**: 2026-05-22
- **Sesion #**: 50
- **Branch**: dev
- **Estado**: Completada

## Completado Sesion 50

### Commits realizados
1. `da4d0a3` fix(breadcrumbs): register all missing routes and convert vehicle sheet to pages
2. `c698487` feat(unidades): add isActive status, separate ranchos from parcelas

### Breadcrumbs corregidos
- 17 rutas registradas en `usePageInfo.ts` que caían al fallback "ChanaDomus"
- 6 rutas estáticas en PAGE_MAP (conserje: mi-qr, mis-visitas, nueva-visita, visitantes-frecuentes x2 + vigilancia/incidencias)
- 11 rutas dinámicas en DYNAMIC_ROUTES (admin: finanzas, proveedores, cartelera, normativas, votaciones, reuniones, personal [id] + vigilancia/incidencias [id] + propietario editar-miembro/vehiculo/personal [id])

### Drawer → Página (vehiculos)
- Creadas `admin/unidades/[id]/vehiculos/nuevo.vue` y `[vehicleId].vue`
- Eliminado Sheet del index de unidades, reemplazado con navegación a páginas
- Solo queda Sheet en `AppBottomNav.vue` (navegación mobile, uso válido)

### Regla no-drawers
- Agregada regla #7 en CLAUDE.md: "Sin drawers/sheets para formularios"

### Unidades: isActive + separación ranchos/parcelas
- Schema: `is_active` boolean en units (default true)
- Migración 0038: columna + 5 unidades inactivas (R-033, R-037, R-041, R-060, P-001)
- Seed actualizado para manejar entries excluidos
- API: expone isActive, ordena ranchos primero, parcelas al final
- UI: ranchos en grid principal, parcelas en sección separada compacta al fondo
- Inactivos: opacidad reducida + badge "Inactiva"
- Detalle: badge dinámico Activa/Inactiva (era hardcoded)

## Pendiente URGENTE para próxima sesión

### Responsive/Mobile — Auditoría completa
**Prioridad CRITICA**. La versión mobile es ineficiente — faltan acciones, filtros, búsqueda y utilidades que sí existen en desktop.

Revisar CADA página por CADA rol (admin, propietario, vigilancia, conserje):
1. **Acciones**: botones crear/editar/eliminar accesibles en mobile
2. **Búsqueda**: TopbarSearch no visible en mobile en muchas páginas
3. **Filtros**: filtros de tablas/listas inaccesibles en mobile
4. **Tablas vs Cards**: verificar que las tablas desktop tengan equivalente mobile card
5. **Navegación**: bottom nav, sidebar mobile, breadcrumbs mobile
6. **Topbar actions**: el portal de acciones desktop (Teleport to target) no tiene equivalente mobile consistente — TopbarMobileAction existe pero no todas las páginas lo usan
7. **Empty states**: verificar que empty states y loading states funcionen en mobile

Enfoque: usar desktop como referencia — TODA utilidad desktop debe existir en mobile de forma simple y accesible.

### Otros pendientes (menor prioridad)
- CRUD de unidades (crear/editar) — el admin no puede crear unidades desde la UI
- Push branch dev a origin (ahead by 13 commits)

## Decisiones del usuario (sesion 50)
- Parcelas visibles pero con prioridad MUY baja (sección separada al fondo)
- Ranchos inactivos (R-033, R-037, R-041, R-060) + P-001: marcados inactivos, visualmente deshabilitados
- Formularios SIEMPRE como páginas, nunca drawers (confirmado, regla en CLAUDE.md)
- CRUD de unidades puede esperar a otra sesión

## Entorno
- Docker `chanadomus-db-1` corriendo
- Migración 0038 aplicada en Docker
- Branch dev ahead of origin/dev by 13 commits (no pusheado)

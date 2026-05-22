# Estado de Sesion — ChanaDomus

## Ultima Sesion
- **Fecha**: 2026-05-22
- **Sesion #**: 49
- **Branch**: dev
- **Estado**: Completada

## Completado Sesion 49

### Commits realizados
1. `4e65477` feat(vigilancia): replace reuniones with incidencias module
2. `502611d` feat(finanzas): restructure dashboard with movements and balances tabs
3. `722d2d8` feat(unidades): improve ranchos UX with prominent names and smart counters
4. `f616352` feat(dashboards): redesign all 4 role dashboards with relevant data and actions
5. `6cea483` fix(nav): unify sidebar groups across all roles
6. `15e2e7d` refactor(normativas): remove categories, add edit page

### Dashboards rediseñados (4 roles)
- **Propietario**: hero financiero (saldo pendiente/al dia), Mi QR prominente, stats: incidencias+votaciones+visitas activas, quick actions: nueva visita, incidencia, estado cuenta, chat
- **Vigilancia**: hero accesos con desglose entradas/salidas, Escanear QR prominente, live feed ultimos 5 accesos (WebSocket), stats: incidencias+alertas pendientes
- **Conserje**: Mi QR prominente (son quienes mas entran/salen), stats: accesos+incidencias+proveedores, quick actions: incidencia, proveedores, acceso
- **Admin**: seccion "Requiere atencion" (incidencias abiertas + proveedores pendientes)
- Todos usan `useDashboard()` composable (eliminado `$fetch` inline)
- 6 campos nuevos en `/api/dashboard/stats`: todayEntryCount, todayExitCount, myBalance, myIsInDebt, myActiveVisits, unresolvedPanicCount

### Navegacion unificada
- Chat siempre en grupo "Comunidad" (antes conserje lo tenia en "Mi Rancho")
- Incidencias siempre en grupo "Principal"
- Conserje: "Mi Rancho" renombrado a "Gestiones"
- Vigilancia: eliminado grupo "Consultas" de 1 item, Residentes movido a Principal
- Vigilancia: agregados Normativas y Reuniones a Comunidad

### Normativas simplificadas
- Eliminadas categorias (normas/horarios/arquitectura) desde DB hasta UI
- Migracion 0037: DROP column category + DROP enum regulation_category (aplicada en Docker)
- Todas las paginas ahora muestran lista plana de documentos
- Nuevo: pagina de edicion `/admin/normativas/[id]` (editar titulo, reemplazar PDF)
- Nuevo: endpoint PATCH `/api/regulations/[id]`

## Pendiente para proxima sesion
1. **Breadcrumbs**: inspeccionar todas las paginas en todos los roles — hay breadcrumbs con "ChanaDomus" por default que necesitan corregirse
2. **Drawer → Pagina**: convertir drawer de añadir vehiculo a pagina individual + buscar otros drawers
3. **Agregar regla no-drawers al CLAUDE.md** (ya en memory pero falta en el repo)
4. **Parcelas**: decidir si ocultarlas de vista principal
5. **Ranchos sin nombre**: R-033, R-037, R-041 son "No incluir", decidir si eliminar

## Decisiones del usuario (sesion 49)
- Dashboards deben mostrar datos relevantes al rol, no stats genericas
- Mi QR prominente para propietario Y conserje (conserjes son quienes mas entran/salen)
- Sin saludos personalizados — ir directo a los datos
- Normativas = deposito plano, sin categorias
- Formularios SIEMPRE como paginas, nunca drawers

## Entorno
- Docker `chanadomus-db-1` corriendo
- `pnpm dev` para verificar
- Migraciones 22-36 no aplicadas en journal (pero si en DB) — investigar discrepancia
- Branch dev ahead of origin/dev by 10 commits (no pusheado)

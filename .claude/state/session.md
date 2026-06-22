# Estado de Sesion — ChanaDomus

## Ultima Sesion
- **Fecha**: 2026-06-19
- **Sesion #**: 68
- **Branch**: `main`
- **Commit**: `a7b49b7`
- **Estado**: Completada

## Completado Sesion 68

### Fix critico de fechas financieras (P0)
- Bug: timestamps en UTC midnight se mostraban como dia anterior en Venezuela (UTC-4)
- Creado `server/utils/finance-date.ts` — utilidad centralizada (parseFinanceDate, parseFilterFrom/To)
- Corregidos 6 endpoints server: records.post, records/[id].patch, movements, summary, unit-account, my-account
- Corregido `useFormatDate.ts` — toDate() extrae YYYY-MM-DD sin pasar por Date constructor
- Corregido `editar/[id].vue` — parsing de fecha sin timezone shift
- **Migracion produccion ejecutada**: 731 de 983 registros normalizados a noon
- Backup creado en `/tmp/chanadomus-backups/backup-pre-date-fix-20260619-194452.sql`

### Generacion masiva de cuotas
- Nueva pagina `/admin/finanzas/generar-cuotas` — 1 formulario crea registros para todas las unidades
- Componente `UnitMultiSelect.vue` — multi-select con busqueda, agrupacion R-/P-, select/deselect all
- API `POST /api/finance/records/bulk` con dedup batch y skipDuplicates

### Bulk select + acciones en tabla
- Checkboxes en tabla de movimientos (desktop) con select-all por pagina
- Barra flotante con "Cambiar fecha" (calendar picker) y "Eliminar" (con confirmacion)
- APIs: `PATCH /api/finance/records/bulk`, `POST /api/finance/records/bulk-delete`
- Composable `useFinanceBulk.ts` — bulkCreate, bulkUpdate, bulkDelete

### Export CSV
- API `GET /api/finance/export` — CSV con BOM UTF-8 para Excel, limit 10K rows
- Boton "Exportar" en topbar de finanzas

### Date presets
- Botones rapidos en filtros: "Este mes", "Mes pasado", "Trimestre", "Este año"

## Deploy
- 2 commits pusheados a main: `fde41a0` (fix fechas) + `a7b49b7` (bulk features)
- **VERIFICAR**: deploy completo en Coolify y que las features funcionan correctamente

## Pendiente proximo sesion
- Verificar visualmente las 4 features nuevas en produccion con Playwright
- El usuario quiere aclarar el nombre correcto del contenedor Docker en produccion (pregunto "chanadomus" pero el container actual es `ac0ps2fczh5cjspgcxj7w0ux` para PG y `jmz7axznjir3tr1841kalft0-*` para la app)
- Evaluar si las bulk operations necesitan ajustes post-feedback de Jordi

## Issues abiertos
- Tests `unit/` no corren en CI (zod import falla con frozen-lockfile)
- `pnpm db:migrate` falla en DB local limpia — usar `npx drizzle-kit push --force`

## DB local
- Docker `chanadomus-db-1` con datos de seed
- Usuarios seed con password `Yolo2026!`:
  - admin@chanadomus.com (admin)
  - propietario@chanadomus.com (propietario, R-001)
  - vigilante@chanadomus.com (vigilancia)
  - conserje@chanadomus.com (conserje, R-001 staff)

# Estado de Sesion — ChanaDomus

## Ultima Sesion
- **Fecha**: 2026-06-07
- **Sesion #**: 66
- **Branch**: `dev`
- **Commit**: `c3ff504`
- **Estado**: Completada

## Completado Sesion 66

### UX Finanzas — Informes como tab
- Layout 2 columnas eliminado, "Informes" agregado como 3er tab junto a Movimientos y Saldos por unidad
- Tablas usan ancho completo para mejor legibilidad

### CI/CD — Deploy trigger corregido
- Workflow cambiado de `branches: [dev]` a `branches: [main]`
- Flujo correcto: dev → merge a main → deploy automatico
- Webhook Coolify funciona pero requiere redeploy manual (pendiente investigar)

### Conserje — Fix QR y visibilidad en staff
- Insertado staff record para conserje demo (local + produccion)
- Endpoint `/api/my-unit/service-staff` ahora incluye conserjes de tabla `staff`
- Seed actualizado para crear staff record del conserje automaticamente

### Imagenes — Compresion client-side + HEIC
- Composable `useImageCompress`: todas las fotos se comprimen a WebP (max 1920px, q0.8)
- Soporte HEIC via `heic2any` (import dinamico para evitar SSR error)
- Aplicado en: incidencias (3 roles), avatares (perfil + admin personal)
- Server limit subido a 10MB como safety net

### Cartelera — Filtro de expiracion
- `GET /api/announcements` filtra items expirados para usuarios no-admin
- Admin/conserje siguen viendo todo para gestion

### Usuarios demo en produccion
- Creados/actualizados 4 usuarios demo en unidad `DEMO - Unidad Demo`
- admin@, propietario@, conserje@, vigilante@ @chanadomus.com
- Password: `Yolo2026!`

## Issues abiertos
- Webhook Coolify no redespliega automaticamente (requiere manual)
- Tests API no integrados en CI
- `pnpm db:migrate` falla en DB local limpia — usar `npx drizzle-kit push --force`

## DB local
- Docker `chanadomuscom-db-1` con datos de seed
- Usuarios seed con password `Yolo2026!`:
  - admin@chanadomus.com (admin)
  - propietario@chanadomus.com (propietario, R-001)
  - vigilante@chanadomus.com (vigilancia)
  - conserje@chanadomus.com (conserje, R-001 staff)

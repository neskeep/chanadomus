# Estado de Sesion — ChanaDomus

## Ultima Sesion
- **Fecha**: 2026-06-30
- **Sesion #**: 70
- **Branch**: `main`
- **Commit**: `a8053c0` (ultimo commit pusheado)
- **Estado**: Incompleta — cambios sin commit (3 fixes + 1 archivo nuevo)

## Completado Sesion 70

### Reporte de incidencias Jun 29 — Diagnostico y fixes parciales
Se analizaron 6 incidencias reportadas por el cliente. Se implementaron fixes para 2 de ellas y se diagnosticaron las 6.

### Fix #3: Saldos a favor muestran "Estas al dia" (RESUELTO)
- **Archivo**: `app/pages/propietario/index.vue`
- **Cambio**: Agregado tercer estado en hero financiero para saldo a favor (myBalance < 0)
- Card primary (teal) con "Saldo a favor" + monto con Math.abs()
- 3 estados: Deuda (amber) → Credito (primary) → Al dia (emerald)
- Typecheck OK

### Fix #1B: Mis Visitas no muestra registros manuales (RESUELTO)
- **Archivo creado**: `server/api/my-unit/access-history.get.ts`
  - Endpoint GET para propietario/admin/conserje
  - Consulta access_logs por unitId (ultimos 30 dias, max 30 registros)
  - JOIN con qr_codes para cubrir manuales y QR
- **Archivo modificado**: `app/pages/propietario/mis-visitas.vue`
  - Nueva seccion "Accesos registrados a tu vivienda" debajo de QR codes
  - Muestra tipo entrada (QR/Manual/Dispositivo), nombre, cedula, fecha, estado
- Typecheck OK

### Fix adicional: Breadcrumb registrar-acceso vigilancia
- **Archivo**: `app/composables/usePageInfo.ts`
- Agregada entrada `/vigilancia/registrar-acceso` en PAGE_MAP (faltaba, mostraba default)

### Diagnostico #1A: Registro manual se procesa como salida
- **NO reproducible desde codigo**: manual.post.ts siempre crea con exitAt=null, no llama checkOpenEntry()
- Pendiente: Pedir mas detalle al cliente sobre como reproducir

### Diagnostico #2: Alarma de panico inconsistente en Honor Play 10
- Problema de compatibilidad de dispositivo, no de codigo
- WebSocket/Web Audio API pueden no funcionar en navegador nativo Honor
- Mitigacion posible: polling fallback cuando WS no conecta
- Recomendacion: Usar Chrome en dispositivos Honor

### Diagnostico #4: Filtro categorias omite proveedores
- Endpoint /api/my-unit/service-roles filtra appliesToStaff=true, excluyendo proveedores
- Necesita clarificacion: que pantalla exacta del propietario tiene este filtro

### Diagnostico #5: PWA no instala en Honor Play 10
- Problema de dispositivo, no de codigo. PWA config correcta.
- Recomendacion: Usar Chrome, agregar banner manual de instalacion

### Diagnostico #6: Ordenamiento jerarquico en listados
- Feature request. Algunos listados ya tienen displayOrder configurable.
- Implementar agrupacion visual por categoria

## PENDIENTE — NO COMMITEADO NI PUSHEADO
- `app/pages/propietario/index.vue` — tercer estado saldo a favor
- `server/api/my-unit/access-history.get.ts` — nuevo endpoint (archivo nuevo)
- `app/pages/propietario/mis-visitas.vue` — seccion accesos registrados
- `app/composables/usePageInfo.ts` — breadcrumb vigilancia/registrar-acceso
- **Accion requerida**: `git add` de los 4 archivos + commit + push

## Incidencias pendientes (de 6 total)
- #1A: Registro como salida — necesita mas info del cliente
- #2: Panico en Honor Play — mitigacion opcional (polling fallback)
- #4: Filtro categorias — fix pendiente
- #5: PWA Honor Play — recomendacion operativa
- #6: Orden listados — feature request pendiente

## Issues abiertos (preexistentes)
- Tests `unit/` no corren en CI (zod import falla con frozen-lockfile)
- `pnpm db:migrate` falla en DB local limpia — usar `npx drizzle-kit push --force`
- Teleport fix de bulk action bar en finanzas (sesion 69, no commiteado)

## DB local
- Docker `chanadomus-db-1` con datos de seed
- Usuarios seed con password `Yolo2026!`:
  - admin@chanadomus.com (admin)
  - propietario@chanadomus.com (propietario, R-001)
  - vigilante@chanadomus.com (vigilancia)
  - conserje@chanadomus.com (conserje, R-001 staff)

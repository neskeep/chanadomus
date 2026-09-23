# Estado de Sesion — ChanaDomus

> **Actualización 2026-09-23 (cierre sesión 81):** v1.9.0 (#9a7ea3ea alertas de eventos) PUBLICADA y verificada en prod. Backup manual verificado vía API de Coolify antes de migrar (config de backups diarios creada: `ghti5s9fulmuwa0tpzd22o1x`); migración 0059 aplicada en el arranque. El webhook de GitHub Actions no disparó el deploy: se lanzó con `GET /api/v1/deploy?uuid=...`. Los 10 tickets de la auditoría están en estado "resuelto". Accesos de Coolify: ver `~/.claude/CLAUDE.md` y memoria `reference_accesos.md`.

## Ultima Sesion
- **Fecha**: 2026-09-23
- **Sesion #**: 81
- **Version**: v1.8.1 en prod (verificada). **Feature #9a7ea3ea CODIGO COMPLETO (sin commit, sin deploy)** → sera v1.9.0.
- **Branch**: `fix/eventos-votaciones-botones`
- **Estado**: 5 tickets reabiertos y publicados (v1.7.1 a v1.8.1), todos resueltos y verificados en prod. Pendiente: CIERRE de #9a7ea3ea (deploy + release v1.9.0). Detenido a proposito ANTES de tocar prod, esperando confirmacion de backup manual.

## Objetivo de la sesion 81
Auditoria de 10 tickets de soporte + documento del cliente "Correcciones Chana 20 agosto" (puntos 1,2,3,4,6). Reabrir y corregir 5 tickets marcados resueltos que seguian fallando, publicar y verificar en produccion.

## Completado Sesion 81 (2026-09-23)
Publicado y verificado en produccion:
- **v1.7.1** — Categorias de proveedores unificadas para todos los roles (#d8f9d63c)
- **v1.7.2** — Panel y accesos en hora de Caracas (helpers `tenant-time`/`zoned-date`) + filtro de categorias con buscador + busqueda sin acentos (#75463812)
- **v1.7.3** — Chat: salas General e Incidencias ocultas, matriz unica de acceso `shared/lib/chat-access.ts`, push por acceso (#e8415ba2)
- **v1.7.4** — Anti doble escaneo en accesos (90 s, `pg_advisory_xact_lock`) (#65f5a8b7)
- **v1.8.0** — Editar pases de visita + historial por rango + alcance de notificaciones en admin (#168fe738)
- **v1.8.1** — Eventos: ventana de vigilancia 24 h / entrada tardia 2 h / deshacer salida; votaciones cierran al fin del dia local; botones Filtros y Panico con texto; fechas con `appTimezone`; `vue-sonner/style.css` faltante (#0b8f2a84 #ea2a0d07 #015d0634, cubre tambien #6c7c4c8e)

Todos estos tickets quedaron en estado "resuelto" en produccion, con nota interna y changelog in-app.

## Dato de produccion (informativo)
Solo 23 de 204 usuarios (11,3 %) tienen notificaciones push activas; 3 de 74 propietarios. Recomendado un aviso general pidiendo activarlas.

## Deuda tecnica anotada (no bloqueante)
- `text-destructive-foreground` no existe como token (39 usos en el codigo)
- Colores genericos restantes en `useColorMap` (incidencias, cartelera, reuniones, votaciones) y botones Entrada/Salida de eventos (emerald/amber)
- Campos de fecha editables de eventos/reuniones usan hora del navegador, no `appTimezone`
- Filtros no visibles en movil en finanzas/reuniones/eventos/estado de cuenta
- `vue-tsc` no instalado (sin typecheck automatizado)
- Eventos antiguos "Desayuno" (20/09, 36 invitados sin salida) quedan como "dentro" — dato historico, no se toco
- Roles de proveedor duplicados ("Gas Recarga"/"Recarga Gas", "Repuestos Motos"/"Venta Repuesto Moto") pendientes de confirmar con el cliente

## Objetivo pendiente: #9a7ea3ea
Alerta visual+sonora al crear evento (admin) y aviso a vigilancia el dia del evento.

## Decisiones de producto (con el usuario, via AskUserQuestion)
1. **Aviso suave descartable** (chime corto de 1 nota + toast/banner), NO alarma persistente tipo panico.
2. Alerta a admin **solo para eventos pendientes** (los que crea propietario/conserje; los del admin nacen 'activo').
3. Aviso a vigilancia **el dia del evento** = lazy al abrir la app ese dia (sin cron). Columna nueva `notifiedVigilanceAt`.

## Completado Sesion 80 (#9a7ea3ea) — CODIGO COMPLETO, build OK, SIN commit
### Backend
- MOD `server/db/schema/event.ts`: + columna `notifiedVigilanceAt timestamp` (nullable).
- NUEVO `server/db/migrations/0059_last_wallflower.sql` (solo `ALTER TABLE events ADD COLUMN notified_vigilance_at timestamp;`) + meta 0059. Additive puro. Aplicada en LOCAL por ALTER directo (drizzle __migrations local desincronizada — igual que 0058).
- NUEVO `server/utils/notify-vigilance-events.ts`: `notifyVigilanceTodayEvents(tenantId)` — eventos activos que empiezan HOY (fecha Caracas nativa en SQL, verificada empiricamente: `(starts_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Caracas')::date = (now() AT TIME ZONE 'America/Caracas')::date`), notifica una sola vez, race-safe con `UPDATE ... WHERE notified_vigilance_at IS NULL ... RETURNING`, luego `sendPushToRole(vigilancia,...,'anuncio')`.
- MOD `server/api/events/active.get.ts`: llama `notifyVigilanceTodayEvents(session.tenantId)` al inicio (patron lazy como expireEvents).
- NUEVO `server/api/events/pending-count.get.ts` (solo admin): `{ count }` de eventos `pendiente`.

### Frontend
- NUEVO `app/composables/useAlertSound.ts`: `playChime()` (2 notas sine ascendentes, volumen bajo, one-shot). Best-effort (autoplay puede requerir gesto; lo visual siempre cubre).
- NUEVO `app/composables/useEventAlerts.ts`: singleton, polling 45s + refresco en visibilitychange. admin→`/api/events/pending-count` (chime+toast al aumentar, baseline -1 evita chime en 1a carga); vigilancia→`/api/events/active` (chime+toast en ids nuevos, seed inicial sin chime). Expone `pendingCount`, `todayCount`, `badgeCount`.
- MOD `app/components/layout/AppSidebar.vue` + `AppBottomNav.vue`: badge con `eventAlertCount` en item Eventos (`/admin/eventos` y `/vigilancia/eventos`); punto primary en boton "Mas".
- MOD `app/pages/vigilancia/index.vue`: banner suave descartable "N eventos hoy" (usa `todayCount`), link a `/vigilancia/eventos`.

## Issues Abiertos / Deuda
- **CIERRE NO EJECUTADO** (task #5): falta commit+push, backup prod, deploy, migrate:prod 0059, test E2E prod, ticket resuelto, changelog, tag v1.9.0, broadcast, Jordi.
- **/polish final de UI NO ejecutado** (opcional antes de commit).
- Verificacion E2E LOCAL no ejecutada (build OK; SQL del util validado directo en DB). Recomendable smoke test antes de prod.
- DB local: drizzle `db:migrate` falla por __migrations desincronizada; usar ALTER directo en local, `db:migrate:prod` en prod (sincronizado).

## CHECKLIST DE CIERRE (aplicar; regla: BACKUP prod ANTES de migrar)
1. commit y push.
2. **BACKUP DB prod** (no negociable) → deploy Coolify + `db:migrate:prod` (0059).
3. Test en PRODUCCION que quede resuelto (admin: crear evento como propietario → badge+chime+toast en admin; vigilancia: evento de hoy → push + banner + badge).
4. Ticket #9a7ea3ea → `resuelto` + nota interna. Changelog in-app (`/admin/changelog`).
5. Broadcast push (`POST /api/push/broadcast`).
6. Redactar mensaje para **Jordi** (sugerencia nueva: que hizo + como probar).

## Siguiente paso (accionable)
1. (Opcional) `/polish` UI + smoke test local de los 2 endpoints nuevos.
2. Ejecutar CHECKLIST DE CIERRE completo para #9a7ea3ea → release **v1.9.0**.
3. Enviar a **Jordi** mensaje pendiente de #168fe738 (v1.7.0) si aun no se envio.
4. (Futuro) #e8415ba2 chats unificacion: requiere sesion de definicion de producto.

## Entorno
- Docker `chanadomuscom-db-1` (postgres). `docker` NO en PATH → `export PATH="/usr/local/bin:$PATH"`.
- DB local: user/db `chanadomus`/`chanadomus`. Migrar en local por ALTER directo si `db:migrate` falla.
- `pnpm dev` en :3000 (log `/tmp/chana-dev.log`). `pnpm build` verificado exit 0.
- Acceso prod: memoria `reference_prod-access.md`. API autenticada con cookie admin en `/tmp/chana-cookies.txt`. Login prod `isenior@zunamicorp.com`/`Yolo2026!`.
- Ticket soporte via API prod: `GET/PATCH https://chanadomus.com/api/support/{id}`. #9a7ea3ea id completo: `9a7ea3ea-4fe7-4426-8999-2298a2bc69bc`.
- Usuarios dev (pass `Yolo2026!`): admin@, propietario@, vigilante@, conserje@chanadomus.com.

# Estado de Sesion — ChanaDomus

## Ultima Sesion
- **Fecha**: 2026-09-02
- **Sesion #**: 78
- **Version**: v1.6.2 (desplegada en prod, tag creado)
- **Branch**: `main`
- **Estado**: COMPLETADA — Tickets de soporte de prod (Eventos + Votaciones) resueltos, desplegados y cerrados

## Objetivo de la sesion
Validar, desplegar y cerrar los tickets de soporte de prod de Eventos+Votaciones iniciados en sesion 77 (RC-1/RC-2), y diagnosticar RC-3 (check-out masivo).

## Completado Sesion 78
### Deploy y cierre de tickets (v1.6.2)
- Commit `9165470`: `fix: auto-expire overdue events and polls via lazy expiration` (7 archivos, additive).
- Commit `66d99b8`: CHANGELOG [1.6.2]. Tag `v1.6.2` anotado + push a origin.
- Deploy Coolify OK (~2.7 min). Validado en prod: evento "Cena Rancho Paraguachi Republic" -> `completado`; 3 votaciones vencidas (15/06) -> `closed` con closedAt.
- 4 tickets cerrados como `resuelto` v1.6.2 via `PATCH /api/support/{id}/status` (con nota al cliente + push al reportero):
  - #6c7c4c8e (eventos vencidos) — RC-1
  - #015d0634 (votaciones vencidas) — RC-2
  - #0b8f2a84 (salidas no registradas) — RC-3
  - #ea2a0d07 ("marca a todos") — RC-3

### Validacion RC-1 / RC-2 / RC-3
- Migracion `events`/`event_guests` aplicada en DB local (SQL directo, migracion 0057). Seed evento vencido + invitados.
- RC-1 validado por HTTP y navegador: GET events transiciona `activo`->`completado`. Check-out en evento `completado` registra salida (guard ampliado OK).
- RC-3 reproducido en Playwright con escenario exacto del cliente (evento fin 23:00, salidas post-medianoche, 4 invitados dentro): **check-out es granular**, un click marca SOLO 1 invitado. "Marca a todos" NO reproduce en codigo actual. Sintoma real = bloqueo de salidas tardias (ya corregido por guard ampliado).

## Archivos del fix (ya commiteados/desplegados)
- NUEVO: `server/utils/expire-events.ts`, `server/utils/expire-polls.ts`
- MOD: `server/api/events/index.get.ts`, `server/api/events/[id].get.ts`, `server/api/events/[id]/checkout/[guestId].post.ts`, `server/api/polls/index.get.ts`, `server/api/polls/[id].get.ts`
- MOD: `CHANGELOG.md`

## Issues Abiertos / Deuda tecnica (no bloqueante)
- **Anti-patron `.sort()`** en `app/composables/useEventCheckin.ts:41`: muta `guests.value` in-place dentro de un computed. No causa bug reportado; fix de 1 linea (`[...list].sort()` o `list.toSorted()`). Dejado fuera del commit por acuerdo (higiene, no bug).
- **Check-IN exige `status='activo'`**: un evento recien auto-completado no admite llegadas tardias (el check-out si). Evaluar si vigilancia necesita check-in post-endsAt.
- **DB local**: quedaron migradas las tablas `events`/`event_guests` (0057). Seed de prueba eliminado. Nota: faltan otras tablas locales (`broadcasts`) — genera errores de consola en `/api/push/broadcast/latest`, ruido del entorno, no del modulo eventos.

## Tickets de prod restantes (no tocados esta sesion)
- #d8f9d63c Proveedores: busquedas filtradas incompletas (en_desarrollo)
- #168fe738 Mis visitas: presentacion no optima, pide filtro (en_revision)
- #e8415ba2 Chats: unificar en chat de vigilancia + alertas (en_revision)
- #9a7ea3ea Eventos: alerta visual/sonora al crear evento (nuevo)

## Siguiente paso (accionable)
1. Opcional: aplicar fix del anti-patron `.sort()` en `useEventCheckin.ts:41` (commit aparte de higiene).
2. Atacar siguiente ticket de prod (sugerido: #9a7ea3ea alerta al crear evento, o #168fe738 filtro Mis visitas).
3. Monitorear si el cliente reporta reaparicion de "marca a todos" (#ea2a0d07).

## Entorno
- Docker `chanadomuscom-db-1` (postgres healthy). `docker` NO esta en PATH → usar `export PATH="/usr/local/bin:$PATH"` antes.
- Dev server: `pnpm dev` (log `/tmp/chana-dev.log`). Puerto 3000.
- Playwright: si "Browser is already in use", matar Chrome huerfano con `user-data-dir=.playwright-profile` (NO el Chrome personal) y limpiar SingletonLock.
- Acceso prod (consultar/cerrar tickets): memoria `reference_prod-access.md`. Login `isenior@zunamicorp.com`/`Yolo2026!`.
- Usuarios dev (pass `Yolo2026!`): admin@, propietario@, vigilante@, conserje@chanadomus.com.

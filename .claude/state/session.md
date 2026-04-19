# Estado de Sesion — ChanaDomus

## Ultima Sesion
- **Fecha**: 2026-04-19
- **Sesion #**: 17
- **Fase**: Bugfix Chat WebSocket (sin version nueva)
- **Version**: v0.13.0 (pendiente merge + tag)
- **Branch**: feat/refinamiento-ux-movil (pending merge → dev)
- **Tag**: pendiente
- **Push**: pendiente

## Resumen Session 17

### Bugs corregidos en Chat WebSocket
1. **Input bloqueado**: `:disabled="!connected"` impedia focus en el input cuando WS no conectaba. Removido el disabled del Input, solo el boton Send queda bloqueado.
2. **Error no visible**: `error` del composable no estaba destructurado en la vista. Agregado al destructuring + banner muestra error real.
3. **Nitro no interceptaba WS**: `experimental.websocket` estaba a nivel Nuxt, no de Nitro. Movido a `nitro.experimental.websocket` en nuxt.config.ts.
4. **Cookie httpOnly**: El composable intentaba leer `better-auth.session_token` via `useCookie()` (client-side), pero es httpOnly. Eliminado token de URL, el servidor ahora lee cookies del upgrade request via `auth.api.getSession({ headers })`.
5. **Origin rechazado**: Better Auth rechazaba requests desde IP de red local (192.168.81.11). Agregado `trustedOrigins` configurable via env `BETTER_AUTH_TRUSTED_ORIGINS`.

### Archivos modificados
- `app/pages/mi-chana/chat/[roomId].vue` — input siempre habilitado, banner con error real, destructuring de `error`
- `app/composables/useChatRoom.ts` — removido token de URL, WS conecta sin query param token
- `server/routes/_ws/chat.ts` — auth via `auth.api.getSession({ headers })` en vez de query manual a DB
- `server/lib/auth.ts` — agregado `trustedOrigins` desde env
- `nuxt.config.ts` — movido websocket de `experimental` a `nitro.experimental`
- `.env` / `.env.example` — agregado `BETTER_AUTH_TRUSTED_ORIGINS`

### Usuario de prueba creado
- Joilen (joilen@chanadomus.com / Admin2026!) — propietario, R-002

### Notas tecnicas
- Chat probado con 2 usuarios simultaneos (admin + Joilen) en sala General — funciona estable
- El ECONNRESET era consecuencia del origin rechazado, no un bug aparte
- BETTER_AUTH_SECRET sigue corto (warning en logs) — cambiar antes de produccion

## Pendientes para Session 18
1. Merge feat/refinamiento-ux-movil → dev, tag v0.13.0, push
2. Comenzar Fase 4 — Servicios, Comunidad y Lanzamiento (M4.1: Directorio Proveedores)

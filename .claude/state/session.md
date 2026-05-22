# Estado de Sesion — ChanaDomus

## Ultima Sesion
- **Fecha**: 2026-05-22
- **Sesion #**: 47
- **Branch**: dev
- **Estado**: Completada — Chat reestructurado (Grupos + DMs) + DevRoleSwitcher

## Completado Sesion 47

### Chat: Reestructuración completa (Canales → Grupos + Mensajes Directos 1-a-1)
- **Renombrado** "Canales" → "Grupos" en toda la UI
- **Eliminados** chats de rancho (tipo `unit`) — confusos y no útiles
- **Nuevo tipo `direct`**: mensajería 1-a-1 entre usuarios como contactos
- **Nueva tabla `chat_room_members`**: membresía para rooms directos (migración 0036)
- **Nuevo endpoint `GET /api/chat/contacts`**: directorio filtrado por rol con `existingRoomId`
- **Nuevo endpoint `POST /api/chat/direct`**: crear/obtener DM idempotente
- **Sidebar reestructurado**: tabs Chat (Grupos + Conversaciones) | Contactos (directorio con búsqueda)
- **Header condicional**: avatar del contacto en DMs, icono de grupo en rooms grupales
- **Access control**: `userCanAccessRoom` soporta `direct` via membresía en `chatRoomMembers`
- **Seed actualizado**: ya no crea unit rooms, solo los 6 grupos predefinidos
- **Altura alineada**: tabs del sidebar coinciden con header del room

### DevRoleSwitcher (solo dev)
- **Componente flotante** `app/components/dev/DevRoleSwitcher.vue` — bottom-right
- **4 usuarios demo**: admin, propietario, conserje, vigilancia — click para switchear sesión
- **Solo en dev**: `import.meta.dev` en `app.vue`, tree-shaken en producción
- **Credenciales**: `Yolo2026!` para todos los demo users

### Archivos creados
- `server/db/migrations/0036_chat_direct_members.sql`
- `server/api/chat/contacts.get.ts`
- `server/api/chat/direct.post.ts`
- `app/composables/useChatContacts.ts`
- `app/components/dev/DevRoleSwitcher.vue`

### Archivos modificados
- `server/db/schema/chat.ts` — enum `direct` + tabla `chatRoomMembers`
- `shared/types/chat.ts` — `ChatRoomOtherUser`, `ChatContact`, `direct` en type
- `server/utils/ws-chat.ts` — case `direct` en access control
- `server/api/chat/rooms.get.ts` — elimina unit rooms, agrega direct rooms + otherUser
- `server/db/seed-chat.ts` — sin unit rooms
- `app/composables/useColorMap.ts` — color `direct`
- `app/composables/useChatRooms.ts` — `groupRooms` + `directRooms`
- `app/pages/mi-chana/chat.vue` — sidebar con tabs + Grupos + Conversaciones + Contactos
- `app/pages/mi-chana/chat/[roomId].vue` — header condicional DM/grupo
- `app/pages/mi-chana/chat/index.vue` — texto actualizado
- `app/app.vue` — DevRoleSwitcher condicional

## Pendiente
1. **QR: Selección manual entrada/salida** — diseño definido: seleccionar antes de escanear, reiniciar cada vez, roles vigilancia + admin
2. **Commit pendiente** — todos los cambios de sesión 47 sin commitear

## Decisiones tomadas (para próxima sesión)
### QR Entrada/Salida
- **Flujo**: seleccionar tipo (entrada/salida) ANTES de escanear
- **Persistencia**: reiniciar cada escaneo (no persiste el modo)
- **Roles**: vigilancia y admin pueden escanear
- **UX**: pantalla previa con 2 botones grandes, luego scanner, luego resultado

## Entorno
- Docker `chanadomus-db-1` es el contenedor correcto (NO `chanadomuscom-db-1`)
- `vamsi-db-1` está detenido (otro proyecto, mismo puerto 5432)
- Migración 0036 aplicada via SQL directo (DB usa `push`, no `migrate`)
- `pnpm dev` para verificar

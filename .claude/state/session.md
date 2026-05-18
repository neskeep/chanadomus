# Estado de Sesion — ChanaDomus

## Ultima Sesion
- **Fecha**: 2026-05-12
- **Sesion #**: 46
- **Branch**: dev
- **Estado**: Chat routing + imágenes PARCIAL — routing completo, upload pendiente test E2E

## Completado Sesion 46

### Chat Routing Completo (nested routes)
- **Página padre `chat.vue`**: sidebar + `<NuxtPage :transition="false" />` — SSR-safe sin useMediaQuery
- **`index.vue`** simplificado: solo empty state desktop
- **`[roomId].vue`** simplificado: header con icono/tipo + ChatConversation
- **Routing real**: URL se actualiza a `/mi-chana/chat/{roomId}` al seleccionar room (antes solo cambiaba ref)
- **Fix hydration**: eliminado `useMediaQuery`, usado CSS `md:!flex` + `:class` basado en route (SSR-safe)
- **Fix transición**: `<NuxtPage :transition="false" />` — la transición global `out-in` impedía render del hijo

### Sistema de Imágenes en Chat (backend completo, UI integrada, test E2E pendiente)
- **Schema**: `chat_attachments` tabla (messageId, filePath, width, height, fileSize) — migración 0027 ejecutada
- **Sharp processing**: `server/utils/image-processing.ts` — convierte cualquier formato a WebP optimizado (max 1920px, quality 80)
- **Upload API**: `POST /api/chat/upload` — multipart, max 5 imágenes, 10MB cada una, broadcast WS
- **Serve API**: `GET /api/chat/attachments/[filename]` — cache immutable
- **Messages API**: actualizado con JOIN a chat_attachments (batch query eficiente)
- **Tipos**: `ChatAttachment` interface + `attachments[]` en ChatMessage
- **Composable**: `sendImages()`, `validateImages()`, `isUploading` en useChatRoom
- **UI**: botón ImagePlus, preview strip pendientes, render imágenes en burbujas (clickables)

### Archivos creados
- `app/pages/mi-chana/chat.vue` — Página padre nested routing
- `server/utils/image-processing.ts` — Sharp WebP processing
- `server/api/chat/upload.post.ts` — Upload endpoint
- `server/api/chat/attachments/[filename].get.ts` — Serve endpoint
- `server/db/migrations/0027_chat_attachments.sql` — Migración

### Archivos modificados
- `app/pages/mi-chana/chat/index.vue` — Simplificado a empty state
- `app/pages/mi-chana/chat/[roomId].vue` — Simplificado, back button CSS md:hidden
- `app/components/chat/ChatConversation.vue` — Imágenes upload + render
- `app/composables/useChatRoom.ts` — sendImages, validateImages, isUploading
- `server/api/chat/[roomId]/messages.get.ts` — Incluye attachments
- `server/db/schema/chat.ts` — chatAttachments tabla
- `shared/types/chat.ts` — ChatAttachment interface
- `server/db/migrations/meta/_journal.json` — Entry 0027

## Pendiente
1. **Test E2E upload imagen**: Playwright file upload → verificar processing sharp → render en chat
2. **Test mobile viewport**: verificar sidebar oculto, back button visible
3. **Sistema de comandos/mentions**: `/incidencia:`, `/anuncio:`, `/reunion:`, `/votacion:`, `/proveedor:`, `/normativa:` + `@usuario`
4. **Mentions de usuarios**: `@nombre` con dropdown search

## Siguiente Paso
- Verificar upload de imagen E2E (sharp processing + render)
- Comenzar sistema de comandos/mentions interactivos con search contra DB
- Los comandos respetan permisos por rol

## Entorno
- Docker PostgreSQL corriendo
- `npx nuxi dev --port 3000` para dev
- Build verificado: `npx nuxi build` OK
- Migración 0027 aplicada en DB local
- sharp@0.34.5 instalado

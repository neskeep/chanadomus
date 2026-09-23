# Convenciones de Codigo — ChanaDomus

## Estructura de Directorios
```
app/
  pages/           — Rutas (kebab-case, organizadas por rol)
  components/      — Componentes Vue (PascalCase)
    ui/            — shadcn-vue auto-generados (NO tocar manualmente)
  composables/     — Logica reutilizable (camelCase, prefijo use)
  layouts/         — Layouts de pagina
  middleware/      — Route guards client-side
  assets/css/      — Solo main.css (shadcn/tailwind)
  lib/             — Utilidades (utils.ts de shadcn + custom)

server/
  api/             — API routes (kebab-case, sufijo .get/.post/.put/.delete)
  db/
    index.ts       — Conexion Drizzle
    schema/        — Schemas Drizzle por modulo (camelCase)
    migrations/    — Migraciones auto-generadas
  middleware/      — Server middleware (auth, etc.)
  utils/           — Utilidades de servidor

shared/
  types/           — Tipos compartidos client/server
```

## Naming
- **Componentes Vue**: PascalCase (`AccessLogTable.vue`)
- **Composables**: camelCase con prefijo `use` (`useAuth.ts`)
- **Server API routes**: kebab-case con sufijo HTTP (`access-logs.get.ts`)
- **Drizzle schemas**: camelCase singular (`tenant.ts`, `accessLog.ts`)
- **Columnas DB**: snake_case (`created_at`, `tenant_id`)
- **Tipos TypeScript**: PascalCase (`AccessLog`, `UserRole`)

## Imports
- `~/` — alias para `app/`
- `#imports` — auto-imports de Nuxt
- Preferir auto-imports de Nuxt/Vue sobre imports manuales

## API Responses
Formato estandarizado para todas las API routes:
```typescript
// Exito
{ data: T }

// Error (via createError de H3)
{ statusCode: number, message: string }

// Lista con paginacion
{ data: T[], meta: { total: number, page: number, limit: number } }
```

## Error Handling
- **Server**: `createError()` de H3 con statusCode y message
- **Client**: Toast de shadcn-vue para errores de usuario
- **Validacion**: En el boundary (API input), no en logica interna

## Estado
- `useState()` de Nuxt para estado reactivo simple
- Composables para logica de estado compleja
- Pinia solo si se justifica la necesidad (no por defecto)

## Fechas y hora (tenant timezone)
- `shared/lib/zoned-date.ts` — utilidades puras de fecha/hora por zona horaria del tenant (`zonedDateString`, `addDaysToDateString`, `isDateString`, `zonedDayStart`, `diffDateStrings`). Sin dependencias de servidor, usable en client y server.
- `server/utils/tenant-time.ts` — envoltorio de servidor sobre `zoned-date` (`localDateOf`, `localToday`) para comparar fechas SQL en hora de Caracas sin depender de la zona del dispositivo.
- `app/composables/useLocalDate.ts` — equivalente client-side para mostrar fechas en la zona del tenant.
- Regla: cualquier logica que compare "hoy" o vigencia de fechas (eventos, votaciones, pases) debe usar estos helpers, nunca `new Date()` crudo ni la zona del navegador/servidor.

## Acceso a chat (matriz de roles)
- `shared/lib/chat-access.ts` — unica fuente de verdad para que roles ven que salas de chat (`canAccessChatRoom`, `getVisibleGroupRoomTypes`, `computeChatPushRecipients`). Usado por server (`ws-chat.ts`, `api/chat/rooms.get.ts`) y debe reusarse si se agrega una sala nueva, no duplicar la matriz.

## Git
- Commits en ingles, formato: `type: description`
- Types: feat, fix, chore, refactor, docs, style, test
- Un commit por cambio logico, no por archivo

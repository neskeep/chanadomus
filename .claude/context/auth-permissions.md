# Auth y Permisos — ChanaDomus

## Sistema de Autenticacion

- **Libreria**: Better Auth 1.6.5 (JWT)
- **Middleware client**: `app/middleware/auth.global.ts` — verifica sesion en SSR y client navigation
- **Server util**: `server/utils/auth.ts` — `requireAuth()` y `requireRole()`
- **Tipos**: `shared/types/auth.ts` — roles, redirects, labels, route map

## Roles

| Rol | Slug | Redirect | Descripcion |
|-----|------|----------|-------------|
| Administrador | `admin` | `/admin` | Gestion total: usuarios, finanzas, configuracion |
| Propietario | `propietario` | `/propietario` | Dueño de unidad: pagos, incidencias, votaciones |
| Conserje | `conserje` | `/conserje` | Operaciones: accesos, proveedores, personal |
| Vigilancia | `vigilancia` | `/vigilancia` | Caseta: registro de accesos, escaneo QR |

## Permisos por Ruta (Client-side)

Definidos en `ROUTE_ROLE_MAP` (`shared/types/auth.ts`):

| Prefijo de ruta | Roles permitidos |
|-----------------|------------------|
| `/admin/*` | admin |
| `/propietario/*` | admin, propietario |
| `/conserje/*` | admin, conserje |
| `/vigilancia/*` | admin, vigilancia |

**Nota**: Admin tiene acceso a TODAS las rutas.

## Permisos por API (Server-side)

Usar `requireRole(event, roles[])` en cada endpoint. Patron actual:

| Dominio | Endpoint | Roles |
|---------|----------|-------|
| Accesos | `access/logs.get`, `access/manual.post` | admin, conserje, vigilancia |
| Finanzas | `finance/records.post` | admin |
| Incidencias | `incidents/index.post` | propietario |
| Incidencias | `incidents/[id]/status.patch` | admin |
| Proveedores | `providers/index.post`, `providers/[id].patch` | admin, conserje |
| Proveedores | `providers/[id].delete` | admin |
| Proveedores | `providers/suggestions.post`, `providers/[id]/reviews.post` | propietario |
| Personal | `staff/*` | admin |
| Reuniones | `meetings/index.post`, `meetings/[id].patch`, `meetings/[id].delete` | admin |
| Unidades | `units/[id]/members.post`, `units/[id]/vehicles.post` | admin |
| Miembros | `members/[id].patch`, `members/[id].delete` | admin |
| Vehiculos | `vehicles/[id].patch`, `vehicles/[id].delete` | admin |

## Rutas Publicas

Definidas en `PUBLIC_ROUTES`: `/login`, `/acceso`, `/offline`

## Reglas

1. **Siempre `requireRole()`** en endpoints protegidos — nunca confiar solo en middleware client
2. **Admin hereda todo** — incluir `'admin'` en el array de roles de todo endpoint
3. **tenant_id en queries** — filtrar por tenant en CADA query, no depender solo de auth
4. **Session via useState** — SSR transfiere session al client via `useState('auth-session')` para evitar re-fetch en hydration

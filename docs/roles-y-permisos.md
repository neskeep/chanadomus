# Roles y Permisos — ChanaDomus

## 4 Roles del Sistema

| Rol | Label | Home | Descripcion |
|-----|-------|------|-------------|
| `admin` | Administrador | `/admin` | Control total. Puede acceder a todas las secciones de cualquier rol. |
| `propietario` | Propietario | `/propietario` | Residente con unidad asignada. Gestiona su cuenta, visitas e incidencias. |
| `vigilancia` | Vigilancia | `/vigilancia` | Seguridad. Escanea QR, registra accesos, consulta residentes. |
| `conserje` | Conserje | `/conserje` | Personal operativo. Registra entradas y gestiona proveedores. |

**Definidos en**: `shared/types/auth.ts`

---

## Routing y Middleware

### Rutas publicas (sin autenticacion)

- `/login`
- `/acceso/[token]`
- `/offline`

### Proteccion por prefijo de ruta

| Prefijo | Roles permitidos |
|---------|-----------------|
| `/admin/*` | `admin` |
| `/propietario/*` | `admin`, `propietario` |
| `/conserje/*` | `admin`, `conserje` |
| `/vigilancia/*` | `admin`, `vigilancia` |
| `/mi-chana/*` | Cualquier usuario autenticado |

> **Nota**: Admin tiene acceso a todas las rutas gracias al `ROUTE_ROLE_MAP` en `shared/types/auth.ts`.

**Middleware cliente**: `app/middleware/auth.global.ts`
**Middleware servidor**: `server/middleware/auth.ts`

---

## Vistas por Rol

### Admin (`/admin`)

| Pagina | Accion |
|--------|--------|
| `/admin` | Dashboard con stats, trends, export CSV/PDF |
| `/admin/finanzas` | Summary, crear cargos/pagos, subir reportes |
| `/admin/incidencias` | Ver todas, cambiar status |
| `/admin/unidades` | CRUD de unidades, miembros, vehiculos |
| `/admin/unidades/[id]` | Detalle de unidad |
| `/admin/personal` | CRUD de personal/staff |
| `/admin/proveedores` | CRUD proveedores |
| `/admin/cartelera` | Crear/editar/eliminar anuncios (PDF + push) |
| `/admin/votaciones` | Crear/editar/eliminar encuestas |
| `/admin/reuniones` | Crear/editar/eliminar reuniones |
| + `/mi-chana/*` | Chat, cartelera, votaciones, reuniones |

### Propietario (`/propietario`)

| Pagina | Accion |
|--------|--------|
| `/propietario` | Dashboard personal |
| `/propietario/estado-cuenta` | Ver su estado de cuenta |
| `/propietario/informes` | Ver reportes financieros |
| `/propietario/mis-visitas` | Ver/gestionar QR de visitas |
| `/propietario/nueva-visita` | Generar QR para visitante |
| `/propietario/incidencias` | Ver sus incidencias |
| `/propietario/incidencias/nueva` | Reportar incidencia (con fotos) |
| `/mi-chana/chat` | Chat comunitario |
| `/mi-chana/cartelera` | Ver anuncios (solo lectura) |
| `/mi-chana/votaciones` | Votar (1 voto por unidad) |
| `/mi-chana/proveedores` | Ver + sugerir proveedores + dejar reviews |
| `/mi-chana/reuniones` | Ver reuniones (solo lectura) |

### Vigilancia (`/vigilancia`)

| Pagina | Accion |
|--------|--------|
| `/vigilancia` | Dashboard de seguridad |
| `/vigilancia/escanear` | Escanear QR de visitantes |
| `/vigilancia/accesos` | Registro de entradas/salidas |
| `/vigilancia/residentes` | Directorio de residentes |
| `/vigilancia/residentes/[id]` | Detalle de residente |
| `/mi-chana/chat` | Chat comunitario |
| `/mi-chana/cartelera` | Ver anuncios (solo lectura) |
| `/mi-chana/proveedores` | Ver proveedores (solo lectura) |
| `/mi-chana/reuniones` | Ver reuniones (solo lectura) |

### Conserje (`/conserje`)

| Pagina | Accion |
|--------|--------|
| `/conserje` | Dashboard de conserjeria |
| `/conserje/nueva-entrada` | Registrar entrada manual |
| `/mi-chana/chat` | Chat comunitario |
| `/mi-chana/cartelera` | Ver anuncios (solo lectura) |
| `/mi-chana/proveedores` | Gestionar proveedores (crear/editar) |
| `/mi-chana/reuniones` | Ver reuniones (solo lectura) |

---

## Matriz de Permisos por Feature

| Feature | Admin | Propietario | Vigilancia | Conserje |
|---------|:-----:|:-----------:|:----------:|:--------:|
| **Finanzas — gestionar** | ✅ | — | — | — |
| **Finanzas — ver propia** | ✅ | ✅ | — | — |
| **Anuncios — CRUD** | ✅ | — | — | — |
| **Anuncios — ver** | ✅ | ✅ | ✅ | ✅ |
| **Votaciones — CRUD** | ✅ | — | — | — |
| **Votaciones — votar** | — | ✅ | — | — |
| **Incidencias — reportar** | ✅ | ✅ | — | — |
| **Incidencias — cambiar status** | ✅ | — | — | — |
| **Accesos — ver logs** | ✅ | — | ✅ | ✅ |
| **Accesos — marcar salida** | ✅ | — | ✅ | ✅ |
| **QR — escanear** | — | — | ✅ | — |
| **QR — generar visita** | ✅ | ✅ | — | — |
| **Unidades — CRUD** | ✅ | — | — | — |
| **Personal/Staff — CRUD** | ✅ | — | — | — |
| **Proveedores — CRUD** | ✅ | — | — | ✅ |
| **Proveedores — review** | — | ✅ | — | — |
| **Reuniones — CRUD** | ✅ | — | — | — |
| **Reuniones — ver** | ✅ | ✅ | ✅ | ✅ |
| **Chat** | ✅ | ✅ | ✅ | ✅ |
| **Dashboard/exports** | ✅ | — | — | — |
| **User management (ban, roles)** | ✅ | — | — | — |

---

## Sistema de Proteccion (3 capas)

### 1. Cliente — Middleware de ruta

`app/middleware/auth.global.ts` valida el rol del usuario contra la ruta antes de permitir la navegacion. Redirige a `/login` si no esta autenticado, o al home del rol si intenta acceder a una seccion no autorizada.

### 2. API — Middleware de servidor

`server/middleware/auth.ts` protege todas las rutas `/api/*` excepto:
- `/api/auth/*` (autenticacion de Better Auth)
- `/api/qr/validate` (validacion publica de QR)
- `/api/webhook/*` (webhooks externos)

Cada endpoint usa `requireRole()` para validar permisos granulares.

### 3. RBAC — Better Auth Access Plugin

`shared/lib/permissions.ts` define permisos por recurso usando `better-auth/plugins/access`:

| Rol | Permisos sobre `user` |
|-----|-----------------------|
| `admin` | `create`, `read`, `update`, `delete`, `ban`, `impersonate`, `set-role` |
| `propietario` | `read` |
| `vigilancia` | `read` |
| `conserje` | `read` |

---

## API Endpoints por Modulo

### Finanzas (`/api/finance`)

| Endpoint | Metodo | Roles |
|----------|--------|-------|
| `/api/finance/my-account` | GET | `propietario`, `admin` |
| `/api/finance/summary` | GET | `admin` |
| `/api/finance/records` | POST | `admin` |
| `/api/finance/reports` | GET | `admin`, `propietario` |
| `/api/finance/reports/upload` | POST | `admin` |

### Accesos (`/api/access`)

| Endpoint | Metodo | Roles |
|----------|--------|-------|
| `/api/access/logs` | GET | `admin`, `vigilancia`, `conserje` |
| `/api/access/logs/[id]/exit` | PATCH | `admin`, `vigilancia`, `conserje` |
| `/api/access/manual` | POST | `admin`, `vigilancia`, `conserje` |

### QR (`/api/qr`)

| Endpoint | Metodo | Roles |
|----------|--------|-------|
| `/api/qr/generate` | POST | `propietario`, `admin` |
| `/api/qr/my-codes` | GET | `propietario`, `admin` |
| `/api/qr/validate` | POST | Publico (con auth token) |

### Incidencias (`/api/incidents`)

| Endpoint | Metodo | Roles |
|----------|--------|-------|
| `/api/incidents` | GET | Autenticado (ve las propias) |
| `/api/incidents` | POST | `propietario` |
| `/api/incidents/[id]/status` | PATCH | `admin` |

### Anuncios (`/api/announcements`)

| Endpoint | Metodo | Roles |
|----------|--------|-------|
| `/api/announcements` | GET | Autenticado |
| `/api/announcements` | POST | `admin` |
| `/api/announcements/[id]` | PATCH | `admin` |
| `/api/announcements/[id]` | DELETE | `admin` |

### Votaciones (`/api/polls`)

| Endpoint | Metodo | Roles |
|----------|--------|-------|
| `/api/polls` | GET | Autenticado |
| `/api/polls` | POST | `admin` |
| `/api/polls/[id]` | PATCH | `admin` |
| `/api/polls/[id]` | DELETE | `admin` |
| `/api/polls/[id]/vote` | POST | `propietario` |

### Proveedores (`/api/providers`)

| Endpoint | Metodo | Roles |
|----------|--------|-------|
| `/api/providers` | GET | Autenticado |
| `/api/providers` | POST | `admin`, `conserje` |
| `/api/providers/[id]` | PATCH | `admin`, `conserje` |
| `/api/providers/[id]` | DELETE | `admin` |
| `/api/providers/[id]/reviews` | POST | `propietario` |

### Reuniones (`/api/meetings`)

| Endpoint | Metodo | Roles |
|----------|--------|-------|
| `/api/meetings` | GET | Autenticado |
| `/api/meetings` | POST | `admin` |
| `/api/meetings/[id]` | PATCH | `admin` |
| `/api/meetings/[id]` | DELETE | `admin` |

### Personal (`/api/staff`)

| Endpoint | Metodo | Roles |
|----------|--------|-------|
| `/api/staff` | GET | `admin` |
| `/api/staff` | POST | `admin` |
| `/api/staff/[id]` | PATCH | `admin` |
| `/api/staff/[id]` | DELETE | `admin` |

### Unidades (`/api/units`)

| Endpoint | Metodo | Roles |
|----------|--------|-------|
| `/api/units` | GET | Autenticado |
| `/api/units/[id]/members` | POST | `admin` |
| `/api/units/[id]/vehicles` | POST | `admin` |

### Vehiculos (`/api/vehicles`)

| Endpoint | Metodo | Roles |
|----------|--------|-------|
| `/api/vehicles/[id]` | PATCH | `admin` |
| `/api/vehicles/[id]` | DELETE | `admin` |

### Miembros (`/api/members`)

| Endpoint | Metodo | Roles |
|----------|--------|-------|
| `/api/members/[id]` | PATCH | `admin` |
| `/api/members/[id]` | DELETE | `admin` |

### Dashboard (`/api/dashboard`)

| Endpoint | Metodo | Roles |
|----------|--------|-------|
| `/api/dashboard/stats` | GET | Autenticado |
| `/api/dashboard/trends` | GET | Autenticado |
| `/api/dashboard/export/csv` | GET | Autenticado |
| `/api/dashboard/export/pdf` | GET | Autenticado |

### Chat (`/api/chat`)

| Endpoint | Metodo | Roles |
|----------|--------|-------|
| `/api/chat/rooms` | GET | Autenticado |

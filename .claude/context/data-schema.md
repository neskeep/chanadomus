# Esquema de Datos — ChanaDomus

## Estrategia Multi-Tenancy
- **Enfoque**: Shared DB con `tenant_id` en todas las tablas scoped
- **Sin logica multi-tenant real en MVP** — solo estructura preparada
- Ranchos de Chana sera el unico tenant, creado por seed

## Tabla Global: tenants
```
tenants
  id: uuid (PK)
  name: text (NOT NULL)
  slug: text (UNIQUE, NOT NULL)
  config: jsonb (DEFAULT '{}') — branding, settings futuros
  status: text (DEFAULT 'active') — active, suspended
  created_at: timestamp (DEFAULT now())
  updated_at: timestamp (DEFAULT now())
```

## Patron para Tablas Tenant-Scoped
Todas las demas tablas DEBEN incluir:
```
tenant_id: uuid (FK -> tenants.id, NOT NULL)
```

## Schemas por Modulo (archivos en server/db/schema/)

| Archivo | Tablas | Modulo |
|---------|--------|--------|
| `tenant.ts` | tenants | Core |
| `auth.ts` | users, sessions, tenant_memberships | Auth |
| `unit.ts` | units, unit_residents, unit_vehicles | Viviendas |
| `access.ts` | qr_codes, access_logs, devices | Control de Acceso |
| `financial.ts` | financial_records, financial_reports | Finanzas |
| `incident.ts` | incidents, incident_updates | Incidencias |
| `communication.ts` | chat_channels, chat_messages, announcements, votes | Comunicacion |
| `provider.ts` | providers, provider_reviews | Proveedores |
| `meeting.ts` | meetings | Reuniones |
| `panic.ts` | panic_alerts | Panico |
| `notification.ts` | push_subscriptions | Notificaciones |

## Convenciones Drizzle
- Usar `pgTable()` de drizzle-orm/pg-core
- IDs: uuid con `defaultRandom()`
- Timestamps: `timestamp` con `defaultNow()`
- Enums: `pgEnum()` para tipos fijos (roles, status)
- FK: explicito con `references()`
- Indices: en columnas de busqueda frecuente + tenant_id

## Roles (enum)
```
user_role: 'admin' | 'propietario' | 'conserje' | 'vigilancia'
```

## Nota
Los schemas detallados de cada modulo se crean cuando se desarrolla ese modulo.
Solo `tenant.ts` se crea en el scaffolding inicial.

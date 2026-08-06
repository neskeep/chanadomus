# Versionado y Releases — ChanaDomus

## Estrategia: Semantic Versioning (SemVer)

Formato: `MAJOR.MINOR.PATCH`

- **MAJOR** (1.0.0, 2.0.0): Breaking changes, cambios incompatibles en API o schema
- **MINOR** (0.1.0, 0.2.0): Nuevo modulo o feature completo (backward compatible)
- **PATCH** (0.1.1, 0.1.2): Bug fixes, ajustes menores, hotfixes

## Version actual: v1.6.0

## Historial de Versiones

### Pre-release (v0.x — desarrollo)

| Version | Contenido |
|---------|-----------|
| v0.1.0 | Auth + roles + login |
| v0.2.0 | QR generation + access control |
| v0.3.0 | Webhook access + vigilancia panel |
| v0.4.0 | Push notifications + panic button |
| v0.6.0 | Financial schema + estado de cuenta |
| v0.7.0 | Panel financiero admin |
| v0.8.0 | Modulo de incidencias |
| v0.9.0 | Fichas de viviendas + personal |
| v0.10.0 | Chat en tiempo real |
| v0.11.0 | Cartelera de anuncios |
| v0.12.0 | Votaciones comunitarias |
| v0.13.0 | PWA + preferencias de notificaciones |
| v0.14.0 | Directorio de proveedores |
| v0.15.0 | Calendario de reuniones |
| v0.16.0 | Dashboard con metricas y exportaciones |
| v0.16.1 | Correcciones de calidad |

### Production (v1.x — en produccion con usuarios reales)

| Version | Tipo | Contenido | Fecha |
|---------|------|-----------|-------|
| v1.0.0 | MINOR | MVP completo — UI redesign + deploy produccion | 2026-04-29 |
| v1.0.1 | PATCH | Ajustes post-lanzamiento (QR, mobile, avatares) | 2026-04-30 |
| v1.1.0 | MINOR | Gestion usuarios, panico, chat, invitaciones | 2026-05-22 |
| v1.1.1 | PATCH | Correcciones de conserje y mobile | 2026-05-25 |
| v1.2.0 | MINOR | Pases vehiculares + categorias en finanzas | 2026-05-26 |
| v1.2.1 | PATCH | Correcciones de calculos y KPIs | 2026-05-30 |
| v1.3.0 | MINOR | Minutas de reuniones, QR de personal, historial accesos | 2026-06-01 |
| v1.3.1 | PATCH | Correccion fotos, conserje QR, duplicados, fechas | 2026-06-08 |
| v1.4.0 | MINOR | Operaciones masivas en finanzas + CSV export | 2026-06-19 |
| v1.4.1 | PATCH | Correcciones de interfaz (checkboxes, providers) | 2026-06-22 |
| v1.4.2 | PATCH | Hora accesos, QR vencidos, panic fallback | 2026-07-10 |
| v1.5.0 | MINOR | Soporte tecnico y novedades | 2026-07-12 |
| v1.5.1 | PATCH | Correcciones accesos, pases, calendario | 2026-08-05 |
| v1.6.0 | MINOR | Módulo de Eventos | 2026-08-06 |

### Criterio para versionar

- **MINOR (1.X.0)**: Feature nuevo que el usuario nota. Modulo nuevo, funcionalidad nueva.
- **PATCH (1.X.Y)**: Bug fixes, correcciones, ajustes visuales. El usuario no percibe algo nuevo.
- **MAJOR (X.0.0)**: Breaking changes, reestructuracion masiva. Reservado.

## Git Branching

```
main ─────────────────────────── produccion (tags: v0.1.0, v0.2.0, etc.)
  └── dev ────────────────────── integracion
        ├── feat/auth ────────── modulo auth
        ├── feat/qr-access ───── modulo QR
        ├── feat/financial ───── modulo financiero
        └── fix/xxx ──────────── hotfixes
```

### Flujo
1. Crear branch `feat/[modulo]` desde `dev`
2. Desarrollar modulo completo (schema → API → UI → verificacion)
3. Merge a `dev` con squash merge
4. Cuando dev esta estable, merge a `main`
5. Tag en `main`: `git tag v0.X.0`
6. Deploy a produccion desde `main`

## Reglas de Migraciones (Proteccion de Datos)

### PERMITIDO (sin autorizacion)
- Crear tabla nueva
- Agregar columna con DEFAULT o nullable
- Crear indices nuevos
- Agregar FK en tablas nuevas

### REQUIERE AUTORIZACION EXPLICITA
- Renombrar columna o tabla
- Cambiar tipo de dato de columna existente
- Agregar NOT NULL a columna existente (requiere migration en 2 pasos)
- Eliminar columna o tabla (requiere backup confirmado)

### PROHIBIDO
- DROP TABLE en produccion sin backup
- ALTER COLUMN que rompa datos existentes
- Modificar schemas de modulos que no son el modulo activo
- Migrations que no sean reversibles

## Checklist Pre-Deploy a Produccion

- [ ] Todas las migraciones probadas en Docker local
- [ ] Version bump en package.json
- [ ] CHANGELOG.md actualizado
- [ ] Tag de Git creado
- [ ] Tests pasando (cuando existan)
- [ ] Backup de DB produccion ANTES de migrar
- [ ] Migracion aplicada y verificada
- [ ] Funcionalidad anterior sigue operando

# Versionado y Releases — ChanaDomus

## Estrategia: Semantic Versioning (SemVer)

Formato: `MAJOR.MINOR.PATCH`

- **MAJOR** (1.0.0, 2.0.0): Breaking changes, cambios incompatibles en API o schema
- **MINOR** (0.1.0, 0.2.0): Nuevo modulo o feature completo (backward compatible)
- **PATCH** (0.1.1, 0.1.2): Bug fixes, ajustes menores, hotfixes

## Version actual: v0.0.0 (scaffolding)

## Flujo de Versiones Planificado

| Version | Contenido | Milestone Hub |
|---------|-----------|---------------|
| v0.0.0 | Scaffolding base | M1.1 |
| v0.1.0 | Auth + roles + login | M1.2 |
| v0.2.0 | QR generation + access control | M1.3-M1.4 |
| v0.3.0 | Panic button + push notifications | M1.5 |
| v0.4.0 | Announcements | M1.6 |
| v0.5.0 | Financial module | M2.1 |
| v0.6.0 | Incidents module | M2.2-M2.3 |
| v0.7.0 | Housing cards + staff | M2.4 |
| v0.8.0 | Chat real-time | M3.1-M3.2 |
| v0.9.0 | Voting + push refinement | M3.3-M3.4 |
| v0.10.0 | Providers directory | M4.1-M4.2 |
| v0.11.0 | Meetings + calendar | M4.3 |
| v0.12.0 | Admin dashboard | M4.4 |
| v1.0.0 | MVP completo — deploy produccion | M4.5 |

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

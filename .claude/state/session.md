# Estado de Sesion — ChanaDomus

## Ultima Sesion
- **Fecha**: 2026-04-19
- **Sesion #**: 11
- **Fase**: Modulo de Incidencias (v0.8.0)
- **Version**: v0.8.0
- **Branch**: feat/modulo-incidencias
- **Commit**: pendiente
- **Push**: Pendiente

## Resumen Session 11

### M2.3 Completado (5/5 tareas hub)
- Schema: server/db/schema/incident.ts (incidents, incident_photos, incident_updates)
- Enums PG: incident_status (open/in_progress/resolved/closed), incident_priority (low/medium/high)
- Migracion 0008: CREATE TABLE incidents + incident_photos + incident_updates (additive-only)
- Tipos: Incident, IncidentPhoto, IncidentUpdate, IncidentStatus, IncidentPriority en shared/types/incident.ts
- Endpoint: POST /api/incidents (crear con fotos multipart, solo propietario, push a admin)
- Endpoint: GET /api/incidents (listar paginado con filtros, JOIN user/unit)
- Endpoint: GET /api/incidents/[id] (detalle con fotos e historial)
- Endpoint: PATCH /api/incidents/[id]/status (cambiar estado, solo admin, push al propietario)
- Endpoint: GET /api/incidents/photos/[filename] (servir fotos, proteccion traversal, cache)
- Composable: useIncidents (fetchIncidents paginado/filtrado, createIncident multipart)
- Composable: useIncidentDetail (fetchIncident con fotos/updates, updateStatus)
- Vista: app/pages/propietario/incidencias/index.vue (cards con expand, status/priority badges, fotos, historial)
- Vista: app/pages/propietario/incidencias/nueva.vue (form con titulo, desc, prioridad, upload 3 fotos)
- Vista: app/pages/admin/incidencias.vue (tabla desktop / cards mobile, filtros, dialog detalle con cambio estado)
- Navegacion: links Incidencias para admin y propietario en bottom nav
- shadcn-vue: Textarea instalado

### Estado del Hub
- M1.1-M1.5: completed
- M1.6: pendiente (bloqueado VPS)
- M2.1-M2.2: completed
- M2.3: **completed** (5/5 tareas)

### Git
- Branch feat/modulo-incidencias creado desde dev
- Pendiente: commit, merge, tag, push

### Datos de prueba en DB local
- Admin: admin@chanadomus.com / Admin2026!
- Propietario: juan@chanadomus.com / Demo2026! → unidad R-001
- Tablas incidents, incident_photos, incident_updates creadas (vacias)

### Notas tecnicas
- Fotos almacenadas en uploads/incidents/ (disco local, .gitignore)
- Max 3 fotos por incidencia, 5MB cada una (JPEG/PNG/WebP)
- Push notifications: al crear incidencia → admins, al cambiar estado → propietario
- Directory traversal protection en endpoint de fotos
- Errores pre-existentes en typecheck: finance/reports (row undefined), nuxt.config (websocket)

## Proximo paso
- Commit feat + changelog
- Merge feat/modulo-incidencias → dev
- Tag v0.8.0
- Push a remote
- Actualizar hub: M2.3 tareas completed + milestone completed
- Siguiente: M2.4 — Fichas de Viviendas y Base de Personal

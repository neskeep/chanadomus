# Estado de Sesion — ChanaDomus

## Ultima Sesion
- **Fecha**: 2026-04-19
- **Sesion #**: 14
- **Fase**: Anuncios Avanzados (v0.11.0)
- **Version**: v0.11.0
- **Branch**: feat/anuncios-avanzados (merged → dev)
- **Commits**: 96f0a8b (feat)
- **Tag**: v0.11.0
- **Push**: Completado

## Resumen Session 14

### M3.2 Completado (1/2 tareas hub — segunda tarea no encontrada en busqueda)
- Schema: server/db/schema/announcement.ts (announcements + 2 enums: category 6 vals, status 3 vals)
- Migracion 0011: CREATE TABLE announcements con FKs e indices (additive-only)
- Tipos: shared/types/announcement.ts (Announcement, AnnouncementCategory, AnnouncementStatus)
- API GET /api/announcements: listado paginado, filtro categoria, visibilidad por rol
- API POST /api/announcements: crear con multipart (PDF max 10MB), push global al publicar
- API GET /api/announcements/[id]: detalle individual
- API PATCH /api/announcements/[id]: actualizar/publicar/archivar, push en primera publicacion
- API DELETE /api/announcements/[id]: eliminar con limpieza PDF
- API GET /api/announcements/attachments/[filename]: servir PDFs con proteccion traversal
- Composable: useAnnouncements (fetch, create, update, publish, archive, delete)
- Vista: app/pages/admin/cartelera/index.vue (tabla/cards, search, filtros, dialog crear/editar, acciones)
- Vista: app/pages/mi-chana/cartelera/index.vue (cards expandibles, badge "Nuevo" 24h, tabs categoria, PDF download)
- Navegacion: Cartelera link para todos los roles (admin → /admin/cartelera, otros → /mi-chana/cartelera)

### Estado del Hub
- M1.1-M1.5: completed
- M1.6: pendiente (bloqueado VPS)
- M2.1-M2.4: completed
- M3.1: completed (3/3 tareas)
- M3.2: **1/2 tareas completadas** (segunda tarea no localizada en hub)

### Datos de prueba en DB local
- Admin: admin@chanadomus.com / Admin2026!
- Propietario: juan@chanadomus.com / Demo2026! → unidad R-001
- 89 salas de chat creadas (General + Vigilancia + Admin + 86 unit rooms)
- Tabla announcements creada (vacia, lista para datos)

### Notas tecnicas
- PDFs se guardan en uploads/announcements/ (similar a uploads/incidents/)
- Push global usa sendPushToAll() al publicar anuncios
- SelectItem value="" fix aplicado (usa "all" en filtros)
- Errores pre-existentes: finance/reports (row undefined), useAppConfig duplicado (Nitro warning)

## Proximo paso
- M3.3 — Votaciones Comunitarias: Creacion, Resultados en Vivo y Push

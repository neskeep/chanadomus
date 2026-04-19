# Estado de Sesion — ChanaDomus

## Ultima Sesion
- **Fecha**: 2026-04-19
- **Sesion #**: 14
- **Fase**: Anuncios Avanzados (v0.11.0)
- **Version**: v0.11.0
- **Branch**: feat/anuncios-avanzados (merged → dev)
- **Commits**: 96f0a8b (feat), 0e8b0c4 (fix status/expires_at)
- **Tag**: v0.11.0
- **Push**: Completado

## Resumen Session 14

### M3.2 Completado
- Schema: server/db/schema/announcement.ts (announcements + 2 enums)
- Migracion 0011: CREATE TABLE announcements (additive-only)
- Tipos: shared/types/announcement.ts
- API: 6 endpoints CRUD + attachments + push global
- Composable: useAnnouncements.ts
- Vista Admin: app/pages/admin/cartelera/index.vue
- Vista Cartelera: app/pages/mi-chana/cartelera/index.vue
- Navegacion: Cartelera link para todos los roles

### Fix aplicado (0e8b0c4)
- FormData de creacion no enviaba `status` → siempre draft
- Campo `expiresAt` no coincidia con backend `expires_at`
- Agregado selector Estado (Borrador/Publicado) en dialog crear/editar

### Estado del Hub
- M1.1-M1.5: completed
- M1.6: pendiente (bloqueado VPS)
- M2.1-M2.4: completed
- M3.1: completed
- M3.2: 1/2 tareas completadas (segunda tarea no localizada)

### Datos de prueba en DB local
- Admin: admin@chanadomus.com / Admin2026!
- Propietario: juan@chanadomus.com / Demo2026! → unidad R-001
- 89 salas de chat, 1 anuncio publicado (Mantenimiento 1)

### Notas tecnicas
- Errores pre-existentes: finance/reports (row undefined), useAppConfig duplicado

## Proximo paso
- M3.3 — Votaciones Comunitarias: Creacion, Resultados en Vivo y Push

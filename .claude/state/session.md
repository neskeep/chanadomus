# Estado de Sesion — ChanaDomus

## Ultima Sesion
- **Fecha**: 2026-04-19
- **Sesion #**: 15
- **Fase**: Votaciones Comunitarias (v0.12.0)
- **Version**: v0.12.0
- **Branch**: feat/votaciones-comunitarias (pending merge → dev)
- **Commits**: a7b69c4 (feat)
- **Tag**: pendiente
- **Push**: pendiente

## Resumen Session 15

### M3.3 Completado
- Schema: server/db/schema/poll.ts (polls + poll_options + poll_votes + 2 enums)
- Migracion 0012: CREATE TABLE polls, poll_options, poll_votes (additive-only, unique index 1 voto por unidad)
- Tipos: shared/types/poll.ts (Poll, PollOption, PollVote, PollStatus, PollType)
- API: 7 endpoints (CRUD + vote + results) + push on publish/close
- Composable: usePolls.ts (fetch, create, update, publish, close, delete, vote)
- Vista Admin: app/pages/admin/votaciones/index.vue (tabla/cards, dialog CRUD con opciones dinámicas, progress bars)
- Vista Propietario: app/pages/mi-chana/votaciones/index.vue (radio buttons para votar, resultados con progress bars, tabs activas/cerradas)
- Navegacion: Votaciones link para admin y propietario en default.vue
- shadcn-vue: RadioGroup + Progress instalados

### Estado del Hub
- M1.1-M1.5: completed
- M1.6: pendiente (bloqueado VPS)
- M2.1-M2.4: completed
- M3.1: completed (3/3)
- M3.2: 1/2 tareas completadas (segunda tarea no localizada)
- M3.3: completed (3/3)

### Datos de prueba en DB local
- Admin: admin@chanadomus.com / Admin2026!
- Propietario: juan@chanadomus.com / Demo2026! → unidad R-001
- 89 salas de chat, 1 anuncio publicado (Mantenimiento 1)
- Tablas polls, poll_options, poll_votes creadas pero vacías

### Notas tecnicas
- Errores pre-existentes: finance/reports (row undefined), useAppConfig duplicado
- Votaciones MVP: solo type='single' soportado (enum 'multiple' reservado para futuro)
- Unique index poll_vote_unit_poll_idx enforce 1 voto por unidad por votacion

## Proximo paso
- Merge feat/votaciones-comunitarias → dev, tag v0.12.0
- M3.4 — Refinamiento UX Movil, Offline Parcial y Push Notifications Completo

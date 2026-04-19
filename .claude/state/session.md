# Estado de Sesion — ChanaDomus

## Ultima Sesion
- **Fecha**: 2026-04-19
- **Sesion #**: 9
- **Fase**: Schema Financiero y Estado de Cuenta Personal (v0.6.0)
- **Version**: v0.6.0
- **Branch**: feat/schema-financiero
- **Commit**: pendiente
- **Push**: Pendiente

## Resumen Session 9
- Schema: server/db/schema/financial.ts (financial_records + record_type enum)
- Migracion: 0005_flowery_alice.sql (additive-only: CREATE TYPE + CREATE TABLE + FKs + indices)
- Tipos: shared/types/financial.ts (RecordType, FinancialRecord, AccountStatement)
- Endpoint: GET /api/finance/my-account (movimientos por unidad + saldo calculado)
- Composable: app/composables/useMyAccount.ts (fetchStatement, balance, records, isInDebt)
- Vista: app/pages/propietario/estado-cuenta.vue (balance hero, movimientos, loading, empty state)
- DB index: server/db/index.ts actualizado con financialSchema
- CHANGELOG actualizado para v0.6.0
- Hub: 3/3 tareas de M2.1 completadas
- Build: exitoso sin errores nuevos

## Completado en esta sesion
- [x] Tarea 1: Schema Drizzle financial_records + migracion (hub: 65d55418)
- [x] Tarea 2: Endpoint GET /api/finance/my-account (hub: 68378422)
- [x] Tarea 3: Vista propietario estado-cuenta.vue (hub: 5210af74)

## Notas tecnicas
- user tabla NO tiene unitId — se extrae de session.user con cast (patron de panic.post.ts)
- amount es numeric(12,2) — viene como string de PG, parseado en endpoint
- Saldo = sum(abonos) - sum(cargos), calculado en el endpoint
- Error preexistente: websocket en experimental de nuxt.config (no afecta build)

## Pendiente M1.6 (bloqueado VPS)
- [ ] Migraciones en produccion + seed
- [ ] Prueba de humo E2E
- [ ] Pipeline Coolify
- [ ] Merge feat/pwa-deploy → dev + tag v0.5.0

## Proximo paso
- Merge feat/schema-financiero → dev + tag v0.6.0
- M2.2: Panel Financiero Admin (movimientos, saldos, PDFs)

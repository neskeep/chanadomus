# Changelog

All notable changes to ChanaDomus will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.7.0] - 2026-04-19

### Added
- Drizzle schema: `financial_reports` table with title, file_path, month, year, uploaded_by FK, tenant FK, 2 indices (M2.2)
- Migration 0007: CREATE TABLE financial_reports (additive-only)
- Shared types: UnitSummary, FinancialReport in shared/types/financial.ts
- API GET /api/finance/summary: returns all units with calculated balance and debt flag (admin only)
- API POST /api/finance/records: create cargo/abono records with validation (admin only)
- API POST /api/finance/reports/upload: multipart PDF upload with 10MB limit, file type validation (admin only)
- API GET /api/finance/reports: paginated list of financial reports (admin/propietario)
- API GET /api/finance/reports/[filename]: serve PDF files with directory traversal protection
- Composable useFinanceSummary: fetchSummary, summaries, totalUnits, totalInDebt
- Composable useFinanceRecords: createRecord with validation
- Composable useFinancialReports: fetchReports (paginated), uploadReport (multipart)
- Composable useUnits: fetchUnits for unit dropdown
- Vista admin Panel Financiero (/admin/finanzas): 3-tab layout (Resumen table with search/sort, Registrar Movimiento form, Informes upload + list)
- Vista propietario Informes Financieros (/propietario/informes): card-based report list with download, pagination, empty state
- Navigation: Finanzas link for admin, Informes link for propietario in bottom nav
- Sonner toast notifications integrated in app.vue
- shadcn-vue components: Table, Tabs, Skeleton, Sonner, Dialog

## [0.6.0] - 2026-04-19

### Added
- Drizzle schema: `financial_records` table with record_type enum (cargo/abono), numeric(12,2) amount, unit/user/tenant FKs, 4 indices (M2.1)
- Migration 0005: CREATE TYPE record_type + CREATE TABLE financial_records (additive-only)
- Shared types: FinancialRecord, AccountStatement, RecordType in shared/types/financial.ts
- API GET /api/finance/my-account: returns movements for authenticated propietario's unit, ordered by date desc, with calculated balance (abonos - cargos)
- Composable useMyAccount: fetchStatement, balance, records, isInDebt computed refs
- Vista propietario Estado de Cuenta (/propietario/estado-cuenta): balance hero card with al-dia/en-mora badge, movements list with cargo/abono color coding, loading skeletons, empty state

## [0.4.0] - 2026-04-19

### Added
- Web Push VAPID module (M1.5): push notifications, service worker, and panic button
- Dependency: web-push 3.6.7 for server-side VAPID push notifications
- Drizzle schema: `push_subscriptions` table (user_id, endpoint, p256dh, auth, role, tenant_id)
- Drizzle schema: `panic_events` table (user_id, unit_id, tenant_id)
- Migrations 0003 (push_subscriptions) and 0004 (panic_events)
- API POST /api/push/subscribe: upsert push subscription with endpoint deduplication
- API GET /api/push/vapid-key: exposes VAPID public key to client
- API POST /api/panic: registers panic event and sends push notification to all vigilancia subscribers
- Server util web-push.ts: sendPushToRole, sendPushToUser, sendPushToAll with auto-cleanup of expired subscriptions (410 Gone)
- Composable usePushNotifications: subscribe, checkSubscription, permission state management
- Service worker (sw.js): push event handler with JSON payload, native notification with vibrate/tag/renotify, notificationclick with route navigation
- Plugin sw-register.client.ts: automatic service worker registration
- Component PanicButton.vue: 2-second press & hold with SVG progress ring, loading/triggered/error states, auto-reset after 5s
- PanicButton integrated as floating element in default layout (above bottom nav on mobile)
- VAPID_SUBJECT added to .env.example

## [0.3.0] - 2026-04-19

### Added
- Webhook access module (M1.4): hardware integration, real-time monitoring, manual entry
- Drizzle schema: `devices` table with device_key_hash authentication and status enum
- Additive migration: 4 new nullable columns on `access_logs` (visitor_name, visitor_document, unit_id, device_id)
- API POST /api/webhook/access-scan: public webhook for hardware devices (QR/RFID/PIN), authenticated via X-Device-Key header with SHA-256 hash validation
- API POST /api/access/manual: conserje/admin manual visitor entry with authorization
- API GET /api/access/logs: tenant-scoped daily access log listing with COALESCE for visitor data
- Nitro WebSocket handler (/_ws/access): real-time broadcast of access events to connected clients
- Server util ws-access.ts: global peer management with broadcastAccessEvent
- Shared types in shared/types/access.ts (EntryType, AccessResult, ScanType, WebhookScanPayload, AccessEvent)
- Composable useAccessStream: WebSocket client with auto-reconnect, heartbeat, and initial load
- Composable useQrScanner: camera-based QR scanning with jsQR, token extraction from URLs, validation
- Page /vigilancia/accesos: real-time access feed with color-coded event cards, connection status badge
- Page /vigilancia/escanear: full-screen QR scanner with camera viewfinder, overlay corners, result cards
- Page /conserje/nueva-entrada: manual entry form with unit selector, visitor type toggle, authorize/deny buttons
- Documentation: docs/webhook-access-scan.md with endpoint specs, payload examples, hardware setup (ZKTeco/Hikvision)
- Dependency: jsqr 1.4.0 for client-side QR code scanning

## [0.2.0] - 2026-04-19

### Added
- QR Access module (M1.3): generation, validation, and WhatsApp sharing
- Drizzle schema: `units` table (86 ranchos), `qr_codes` and `access_logs` tables with enums (visitor_type, entry_type, access_result)
- API POST /api/qr/generate: session-protected QR code generation with UUID v4 tokens
- API POST /api/qr/validate: public endpoint for token validation (valid/expired/used/invalid)
- API GET /api/qr/my-codes: owner's QR history with dynamic status filtering
- API GET /api/units: tenant-scoped unit listing for form selects
- Shared types in shared/types/qr.ts (QrCodeRecord, GenerateQrInput, ValidationResult)
- Composable useQr: QR generation, listing, and unit fetching logic
- Page /propietario/nueva-visita: form with visitor data, unit select, QR rendering via `qrcode` library, Web Share API for WhatsApp with clipboard fallback
- Page /propietario/mis-visitas: QR history with status filters (all/active/used/expired), expandable QR view, share functionality
- Page /acceso/[token]: public standalone page showing QR validation status with visual states (green=valid, amber=expired, blue=used, red=invalid)
- shadcn-vue components: Select, Badge, Separator
- Database seed: 86 units (R-001 to R-086) for Ranchos de Chana tenant
- Public route support: /acceso/* excluded from auth middleware (client + server)

## [0.1.0] - 2026-04-17

### Added
- Better Auth integration with email/password authentication
- PostgreSQL auth schema: user, session, account, verification tables (all with tenant_id FK)
- Admin plugin with 4 roles: admin, propietario, conserje, vigilancia
- Role-based access control with permissions system (shared/lib/permissions.ts)
- SSR-safe global route middleware with role-based protection
- Auth client with Vue composable (useAuth) for session, signIn, signOut
- Login page with shadcn-vue components (Card, Button, Input, Label)
- Default layout with top bar, role badge, sign out, and mobile bottom nav
- Auth layout for login/public pages
- Placeholder pages for all 4 role dashboards
- Server middleware protecting /api/* routes (except /api/auth/*)
- Server utils: getServerSession, requireAuth, requireRole, requireTenant
- Database seed script with admin user (uses Better Auth crypto)
- Drizzle migrations with db:generate, db:migrate, db:seed scripts
- Auto-import config for shadcn-vue ui/ components (pathPrefix: false)

## [0.0.0] - 2026-04-17

### Added
- Nuxt 4.4.2 project scaffold (minimal template, SSR, TypeScript strict)
- Tailwind CSS 4.2.2 via @tailwindcss/vite
- shadcn-vue initialized with preset a6PDm8yA (reka-luma/taupe/inter)
- Drizzle ORM 0.45.2 + PostgreSQL driver
- Better Auth 1.6.5 dependency (not yet configured)
- VueUse 14.2.1
- Docker Compose for local PostgreSQL 16
- Base `tenants` table schema (SaaS-ready architecture)
- CLAUDE.md with strict development rules
- Project documentation in .claude/context/ and .claude/state/
- Directory structure for all planned modules

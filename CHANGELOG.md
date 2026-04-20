# Changelog

All notable changes to ChanaDomus will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.14.0] - 2026-04-19

### Added
- Drizzle schema: `providers` + `provider_reviews` tables with category/status enums (M4.1)
- Migration 0014: CREATE TYPE provider_category/provider_status, CREATE TABLE providers/provider_reviews (additive-only)
- Shared types: Provider, ProviderReview, CreateProvider, UpdateProvider, CreateReview, PROVIDER_CATEGORIES
- API GET /api/providers: list with filters (category, status, search), pagination, avg rating
- API POST /api/providers: create provider (admin, conserje)
- API GET /api/providers/[id]: detail with reviews and avg rating
- API PATCH /api/providers/[id]: update provider (admin, conserje)
- API DELETE /api/providers/[id]: delete with cascade (admin only)
- API GET /api/providers/[id]/reviews: paginated reviews for a provider
- API POST /api/providers/[id]/reviews: create review (propietario, 1 per user per provider)
- API POST /api/providers/suggestions: propietario suggests provider (status 'pending'), push to admins
- Composable `useProviders`: 7 functions (fetchProviders, fetchProvider, create, update, delete, submitReview, suggestProvider)
- Page `/mi-chana/proveedores/`: shared provider directory with search, category filter, cards with ratings
- Page `/mi-chana/proveedores/[id]`: provider detail with reviews, star rating selector, edit/delete for admin
- Page `/admin/proveedores/`: admin management with table/cards, stats, pending suggestions, status toggle
- Navigation: "Proveedores" (Wrench icon) added for all 4 roles

## [0.13.0] - 2026-04-19

### Added
- PWA manifest (`manifest.webmanifest`): name, icons, standalone display, portrait orientation, theme colors (M3.4)
- PWA icons: 192px and 512px placeholder PNGs in `/public/icons/`
- Offline fallback page (`/public/offline.html`): static HTML with ChanaDomus branding
- Service Worker offline caching: cache-first for static assets, network-first for API/pages, offline fallback (M3.4)
- Apple PWA meta tags: apple-touch-icon, apple-mobile-web-app-capable, theme-color
- Drizzle schema: `push_preferences` table with 7 boolean category columns, unique index per user+tenant (M3.4)
- Migration 0013: CREATE TABLE push_preferences (additive-only)
- Shared types: PushCategory, PushPreferences, PUSH_CATEGORIES constant with labels/descriptions
- API GET /api/me/push-preferences: get or create user preferences with all-enabled defaults
- API PATCH /api/me/push-preferences: partial update with validation, upsert logic
- Push preference filtering: sendPushToAll/sendPushToRole now respect per-user category preferences
- Category mapping for legacy push categories (announcement→anuncio, incident→incidencia, poll→votacion)
- Composable `usePushPreferences`: fetch, toggleCategory with optimistic updates
- Page `/mi-chana/notificaciones`: push subscription status, 7 category toggles with Switch components
- Bell icon in header for all roles linking to notification preferences
- shadcn-vue component: Switch

## [0.12.0] - 2026-04-19

### Added
- Drizzle schema: `polls`, `poll_options`, `poll_votes` tables with enums poll_status (3) and poll_type (2) (M3.3)
- Migration 0012: CREATE TABLE polls, poll_options, poll_votes with FKs, unique index for 1 vote per unit per poll (additive-only)
- Shared types: Poll, PollOption, PollVote, PollStatus, PollType
- API GET /api/polls: list with pagination, status filter, role-based visibility, options with vote counts, userVote tracking
- API POST /api/polls: create poll with options in transaction, push notification on publish
- API GET /api/polls/[id]: detail with options, vote counts, percentages, participation
- API PATCH /api/polls/[id]: update/publish/close with push on status changes
- API DELETE /api/polls/[id]: delete with cascade (blocks active polls)
- API POST /api/polls/[id]/vote: vote as propietario (1 vote per unit enforced by unique index)
- API GET /api/polls/[id]/results: results with vote counts, percentages, participation rate
- Composable `usePolls`: fetch, create, update, publish, close, delete, vote
- Page `/admin/votaciones`: admin panel with table/cards, search, status filter, create/edit dialog with dynamic options, results with progress bars
- Page `/mi-chana/votaciones`: propietario voting view with radio buttons, "Ya votaste" badge, results with progress bars, active/closed tabs
- Navigation: Votaciones link for admin and propietario roles
- shadcn-vue components: RadioGroup, Progress

## [0.11.0] - 2026-04-19

### Added
- Drizzle schema: `announcements` table with enums announcement_category (6) and announcement_status (3) (M3.2)
- Migration 0011: CREATE TABLE announcements with FKs, 4 indices (additive-only)
- Shared types: Announcement, AnnouncementCategory, AnnouncementStatus
- API GET /api/announcements: list with pagination, category filter, role-based visibility (admin sees all, others only published)
- API POST /api/announcements: create with multipart form data, PDF attachment (max 10MB), push notification on publish
- API GET /api/announcements/[id]: single announcement detail
- API PATCH /api/announcements/[id]: update/publish/archive with auto push on first publish
- API DELETE /api/announcements/[id]: delete with PDF cleanup
- API GET /api/announcements/attachments/[filename]: serve PDF files with directory traversal protection
- Composable `useAnnouncements`: fetch, create, update, publish, archive, delete
- Page `/admin/cartelera`: admin panel with table/cards, search, category filter, create/edit dialog, publish/archive/delete actions
- Page `/mi-chana/cartelera`: community bulletin board with expandable cards, "Nuevo" badge (24h), category tabs, PDF download
- Navigation: Cartelera link added for all roles (admin → /admin/cartelera, others → /mi-chana/cartelera)

## [0.10.0] - 2026-04-19

### Added
- Drizzle schema: `chat_rooms` and `messages` tables with enum chat_room_type (M3.1)
- Migration 0010: CREATE TABLE chat_rooms, messages with FKs, indices, unique constraint (additive-only)
- Shared types: ChatRoom, ChatMessage, ChatRoomType
- Seed script: seed-chat.ts creates General, Vigilancia, Admin rooms + 86 unit rooms
- WebSocket handler: `server/routes/_ws/chat.ts` with token auth, room access control, message broadcast
- Server util: `ws-chat.ts` with peer management per room, `userCanAccessRoom` access control
- API GET /api/chat/rooms: list accessible rooms filtered by user role
- API GET /api/chat/[roomId]/messages: cursor-based pagination (50 per page) with user JOIN
- Composable `useChatRooms`: fetch and filter rooms by type
- Composable `useChatRoom`: WebSocket connection, message history, auto-reconnect, keepalive ping
- Page `/mi-chana/chat/index.vue`: room list grouped by type with icons and badges
- Page `/mi-chana/chat/[roomId].vue`: full-screen chat with message grouping, auto-scroll, connection indicator
- Navigation: Chat link added for all roles (admin, propietario, vigilancia, conserje)

### Access Control
- General room: all authenticated users
- Unit rooms: admin + unit owner only
- Vigilancia room: admin + vigilancia + conserje
- Admin room: admin only

## [0.9.0] - 2026-04-19

### Added
- Drizzle schema: `household_members`, `vehicles`, `staff` tables with enums household_relationship and staff_role (M2.4)
- Migration 0009: CREATE TABLE household_members, vehicles, staff with FKs and indices (additive-only)
- Shared types: HouseholdMember, Vehicle, Staff with role/relationship type aliases
- API GET /api/units/directory: unit list with member/vehicle counts (LEFT JOIN + COUNT DISTINCT)
- API CRUD /api/units/[id]/members: GET (list), POST (create) — admin only for mutations
- API CRUD /api/members/[id]: PATCH (update), DELETE (soft delete) — admin only
- API CRUD /api/units/[id]/vehicles: GET (list), POST (create) — admin only for mutations
- API CRUD /api/vehicles/[id]: PATCH (update), DELETE (hard delete) — admin only
- API GET /api/vehicles: global search by plate with ILIKE, includes unit number (JOIN)
- API CRUD /api/staff: GET (list with role filter), POST (create) — admin only
- API CRUD /api/staff/[id]: PATCH (update), DELETE (soft delete) — admin only
- Composable useUnitMembers: CRUD operations for household members per unit
- Composable useUnitVehicles: CRUD operations for vehicles per unit
- Composable useStaff: CRUD operations for condominium staff with role filter
- Composable useVehicleSearch: global vehicle plate search for vigilancia
- Vista admin Directorio de Unidades (/admin/unidades): card grid with member/vehicle counts, search
- Vista admin Ficha de Unidad (/admin/unidades/[id]): tabs Miembros/Vehiculos, CRUD with Dialog/AlertDialog
- Vista admin Gestion de Personal (/admin/personal): table/cards with role filter, CRUD with Dialog/AlertDialog
- Vista vigilancia Directorio de Residentes (/vigilancia/residentes): unit list + plate search
- Vista vigilancia Detalle de Unidad (/vigilancia/residentes/[id]): read-only members and vehicles
- Navigation: Unidades and Personal links for admin, Residentes link for vigilancia
- shadcn-vue component: AlertDialog

## [0.8.0] - 2026-04-19

### Added
- Drizzle schema: `incidents`, `incident_photos`, `incident_updates` tables with enums incident_status and incident_priority (M2.3)
- Migration 0008: CREATE TABLE incidents, incident_photos, incident_updates with FKs and indices (additive-only)
- Shared types: Incident, IncidentPhoto, IncidentUpdate, IncidentStatus, IncidentPriority in shared/types/incident.ts
- API POST /api/incidents: create incident with up to 3 photos (multipart), propietario only, push to admin
- API GET /api/incidents: list with filters (status, priority, unit_id, mine), pagination, JOIN user/unit names
- API GET /api/incidents/[id]: detail with photos and status update history
- API PATCH /api/incidents/[id]/status: change status with optional note (admin only), push to owner
- API GET /api/incidents/photos/[filename]: serve photos with directory traversal protection, cache headers
- Composable useIncidents: fetchIncidents (paginated/filtered), createIncident (multipart)
- Composable useIncidentDetail: fetchIncident (detail with photos/updates), updateStatus
- Vista propietario Mis Incidencias (/propietario/incidencias): card list with expand detail, status/priority badges, photos gallery, status history
- Vista propietario Nueva Incidencia (/propietario/incidencias/nueva): form with title, description, priority select, photo upload (max 3 with preview)
- Vista admin Gestion de Incidencias (/admin/incidencias): table (desktop) / cards (mobile), filters, search, dialog detail with status update form
- Navigation: Incidencias link for admin and propietario in bottom nav
- shadcn-vue component: Textarea

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

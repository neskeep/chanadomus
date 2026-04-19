# Changelog

All notable changes to ChanaDomus will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

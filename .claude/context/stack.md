# Stack Tecnico — ChanaDomus

## Framework
- **Nuxt**: 4.4.2 (SSR habilitado)
- **Vue**: 3.5.32
- **Vue Router**: 5.0.4
- **TypeScript**: strict mode habilitado
- **Package Manager**: pnpm

## UI
- **shadcn-vue**: estilo `reka-luma`, font `inter`, baseColor `taupe`
- **Tailwind CSS**: 4.2.2 (via @tailwindcss/vite)
- **Iconos**: lucide (configurado en shadcn)
- **Dark mode**: soportado via clase `.dark`

## Base de Datos
- **ORM**: Drizzle ORM 0.45.2
- **Driver**: postgres 3.4.9
- **DB**: PostgreSQL 16 Alpine (Docker en dev, Coolify container en prod)
- **Migrations**: drizzle-kit 0.31.10

## Autenticacion
- **Better Auth**: 1.6.5 (JWT + 4 roles)
- **Roles**: Administrador, Propietario, Conserje, Vigilancia

## Utilidades
- **VueUse**: 14.2.1 (@vueuse/core + @vueuse/nuxt)

## Tiempo Real (futuro)
- **WebSockets**: Nitro experimental websockets (habilitado en config)
- **Push**: Web Push API + VAPID (sin Firebase)

## Infraestructura
- **Dev**: Docker Compose (PostgreSQL local)
- **Prod**: Vultr VPS (2 vCPU / 4 GB RAM / 80 GB NVMe) + Coolify + Traefik
- **Dominio**: chanadomus.com
- **SSL**: Via Traefik en Coolify

## Dependencias Adicionales (por instalar cuando se necesiten)
- `qrcode` — generacion QR client-side
- `jsqr` — escaneo QR via Camera API

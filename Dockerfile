FROM node:22-alpine AS builder

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

ENV NODE_OPTIONS="--max-old-space-size=2048"
RUN pnpm build

FROM node:22-alpine AS runner

# pg_dump for pre-deploy backups
RUN apk add --no-cache postgresql16-client

WORKDIR /app

# Nuxt server output
COPY --from=builder /app/.output .output

# Migration scripts and SQL files
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/server/db/migrations ./migrations

# postgres driver for standalone migrate script
COPY --from=builder /app/node_modules/postgres ./node_modules/postgres

RUN chmod +x /app/scripts/entrypoint.sh /app/scripts/backup.sh

# Backups volume (persisted via Coolify volume mount)
RUN mkdir -p /app/backups

ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

CMD ["sh", "/app/scripts/entrypoint.sh"]

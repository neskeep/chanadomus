#!/bin/sh
# Pre-deploy database backup (runs inside app container)
# Saves to host via shared volume or /tmp as fallback
set -e

BACKUP_DIR="${BACKUP_DIR:-/tmp/chanadomus-backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/pre_deploy_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[backup] Creando backup pre-deploy: ${BACKUP_FILE}"

# Extract connection parts from DATABASE_URL
DB_URL="$DATABASE_URL"
DB_HOST=$(echo "$DB_URL" | sed -E 's|.*@([^:]+):.*|\1|')
DB_PORT=$(echo "$DB_URL" | sed -E 's|.*:([0-9]+)/.*|\1|')
DB_USER=$(echo "$DB_URL" | sed -E 's|.*://([^:]+):.*|\1|')
DB_PASS=$(echo "$DB_URL" | sed -E 's|.*://[^:]+:([^@]+)@.*|\1|')
DB_NAME=$(echo "$DB_URL" | sed -E 's|.*/([^?]+).*|\1|')

PGPASSWORD="$DB_PASS" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[backup] Backup completado: ${BACKUP_FILE} (${SIZE})"

# Keep only last 5 pre-deploy backups (container storage is ephemeral)
ls -t "$BACKUP_DIR"/pre_deploy_*.sql.gz 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true

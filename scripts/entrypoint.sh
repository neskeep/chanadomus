#!/bin/sh
# Docker entrypoint: backup → migrate → start
set -e

echo "========================================="
echo " ChanaDomus — Deploy"
echo "========================================="

# 1. Pre-deploy backup
if [ -n "$DATABASE_URL" ]; then
  echo ""
  echo "[deploy] Paso 1/3: Backup de base de datos"
  sh /app/scripts/backup.sh || {
    echo "[deploy] ADVERTENCIA: Backup falló, pero continuando deploy..."
  }

  # 2. Run migrations
  echo ""
  echo "[deploy] Paso 2/3: Migraciones de base de datos"
  MIGRATIONS_DIR=/app/migrations node /app/scripts/migrate.mjs || {
    echo "[deploy] ERROR: Migraciones fallaron — abortando"
    exit 1
  }
else
  echo "[deploy] ADVERTENCIA: DATABASE_URL no definida — saltando backup y migraciones"
fi

# 3. Start the app
echo ""
echo "[deploy] Paso 3/3: Iniciando aplicación"
echo "========================================="
exec node /app/.output/server/index.mjs

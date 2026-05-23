/**
 * Standalone migration script for production containers.
 * Compatible with drizzle-kit's migration tracking table.
 *
 * Reads SQL files from the migrations directory and applies them in order,
 * tracking progress in `drizzle.__drizzle_migrations` (same table drizzle-kit uses).
 *
 * Usage: MIGRATIONS_DIR=./migrations node scripts/migrate.mjs
 * Requires: DATABASE_URL environment variable
 */

import postgres from 'postgres'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('[migrate] ERROR: DATABASE_URL no está definida')
  process.exit(1)
}

const MIGRATIONS_DIR = process.env.MIGRATIONS_DIR || './migrations'

const sql = postgres(DATABASE_URL, { max: 1, onnotice: () => {} })

async function run() {
  // Create schema and tracking table (same as drizzle-kit)
  await sql`CREATE SCHEMA IF NOT EXISTS drizzle`
  await sql`
    CREATE TABLE IF NOT EXISTS drizzle."__drizzle_migrations" (
      id SERIAL PRIMARY KEY,
      hash TEXT NOT NULL,
      created_at BIGINT
    )
  `

  // Get the latest applied migration timestamp
  const rows = await sql`
    SELECT id, hash, created_at
    FROM drizzle."__drizzle_migrations"
    ORDER BY created_at DESC
    LIMIT 1
  `
  const lastApplied = rows.length > 0 ? Number(rows[0].created_at) : 0

  // Read journal
  const journalPath = join(MIGRATIONS_DIR, 'meta', '_journal.json')
  if (!existsSync(journalPath)) {
    console.error(`[migrate] ERROR: No se encontró ${journalPath}`)
    process.exit(1)
  }

  const journal = JSON.parse(readFileSync(journalPath, 'utf-8'))
  const entries = journal.entries

  // Filter to only pending migrations (same logic as drizzle-kit)
  const pending = entries.filter(e => e.when > lastApplied)

  if (pending.length === 0) {
    console.log('[migrate] Base de datos actualizada — sin migraciones pendientes')
    await sql.end()
    return
  }

  console.log(`[migrate] ${pending.length} migración(es) pendiente(s)`)

  for (const entry of pending) {
    const sqlFile = join(MIGRATIONS_DIR, `${entry.tag}.sql`)
    if (!existsSync(sqlFile)) {
      console.error(`[migrate] ERROR: Archivo no encontrado: ${sqlFile}`)
      process.exit(1)
    }

    const content = readFileSync(sqlFile, 'utf-8')
    const hash = createHash('sha256').update(content).digest('hex')

    console.log(`[migrate] Aplicando: ${entry.tag}`)

    // Handle ALTER TYPE ADD VALUE (cannot run inside transaction in PostgreSQL)
    const enumStatements = []
    const regularStatements = []

    const statements = content
      .split('--> statement-breakpoint')
      .flatMap(block =>
        block.split(/;(?=\s*(?:--|$|\n|ALTER|CREATE|DROP|INSERT|UPDATE|DELETE))/i)
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'))
      )

    for (const stmt of statements) {
      if (/ALTER\s+TYPE.*ADD\s+VALUE/i.test(stmt)) {
        enumStatements.push(stmt)
      }
      else {
        regularStatements.push(stmt)
      }
    }

    try {
      // Run enum additions outside transaction first (PostgreSQL requirement)
      for (const stmt of enumStatements) {
        await sql.unsafe(stmt)
      }

      // Run regular statements in a transaction
      await sql.begin(async (tx) => {
        for (const stmt of regularStatements) {
          await tx.unsafe(stmt)
        }
        // Record migration as applied
        await tx`
          INSERT INTO drizzle."__drizzle_migrations" (hash, created_at)
          VALUES (${hash}, ${entry.when})
        `
      })
    }
    catch (err) {
      console.error(`[migrate] ERROR en migración ${entry.tag}:`, err.message || err)
      await sql.end()
      process.exit(1)
    }
  }

  console.log(`[migrate] ${pending.length} migración(es) aplicada(s) correctamente`)
  await sql.end()
}

run().catch((err) => {
  console.error('[migrate] Error fatal:', err)
  process.exit(1)
})

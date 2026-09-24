import type { H3Event } from 'h3'

/**
 * CSV para descargas (mismo formato que finance/export.get.ts):
 * separador coma, BOM UTF-8 para que Excel lea los acentos, y escape RFC 4180.
 */

export type CsvCell = string | number | boolean | null | undefined

/** Escapa un campo: comillas si contiene coma, comillas o saltos de línea. */
export function csvField(value: CsvCell): string {
  if (value === null || value === undefined) return ''
  const text = String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** Documento CSV con BOM a partir de cabecera y filas. */
export function buildCsv(header: readonly string[], rows: ReadonlyArray<readonly CsvCell[]>): string {
  const lines = [header, ...rows].map(row => row.map(csvField).join(','))
  return '﻿' + lines.join('\n')
}

/** Cabeceras de descarga y cuerpo CSV. `filename` sin extensión. */
export function sendCsv(event: H3Event, filename: string, csv: string): string {
  setResponseHeaders(event, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="${filename.replace(/[^\w.-]/g, '_')}.csv"`,
  })
  return csv
}

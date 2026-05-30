import { db } from '~~/server/db'
import { financialReports } from '~~/server/db/schema/financial-report'
import { readMultipartFormData } from 'h3'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import type { FinancialReport } from '~~/shared/types/financial'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export default defineEventHandler(async (event) => {
  const session = await requireTenant(event)
  await requireRole(event, ['admin'])

  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, message: 'No se recibieron datos del formulario' })
  }

  // Extract fields from multipart data
  let file: { filename?: string; data: Buffer; type?: string } | null = null
  let title = ''
  let monthStr = ''
  let yearStr = ''

  for (const part of formData) {
    if (part.name === 'file') {
      file = { filename: part.filename, data: part.data, type: part.type }
    } else if (part.name === 'title') {
      title = part.data.toString('utf-8').trim()
    } else if (part.name === 'month') {
      monthStr = part.data.toString('utf-8').trim()
    } else if (part.name === 'year') {
      yearStr = part.data.toString('utf-8').trim()
    }
  }

  // Validate file
  if (!file || !file.data || file.data.length === 0) {
    throw createError({ statusCode: 400, message: 'El archivo PDF es requerido' })
  }

  if (file.type !== 'application/pdf') {
    throw createError({ statusCode: 415, message: 'Solo se permiten archivos PDF' })
  }

  if (file.data.length > MAX_FILE_SIZE) {
    throw createError({ statusCode: 413, message: 'El archivo excede el limite de 10MB' })
  }

  // Validate title
  if (!title) {
    throw createError({ statusCode: 400, message: 'El titulo es requerido' })
  }

  // Validate month
  const month = parseInt(monthStr, 10)
  if (isNaN(month) || month < 1 || month > 12) {
    throw createError({ statusCode: 400, message: 'El mes debe ser un numero entre 1 y 12' })
  }

  // Validate year
  const year = parseInt(yearStr, 10)
  if (isNaN(year) || year < 2020 || year > 2100) {
    throw createError({ statusCode: 400, message: 'El ano debe ser un numero entre 2020 y 2100' })
  }

  // Sanitize filename and save to disk
  const originalName = file.filename ?? 'report.pdf'
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storedFileName = `${Date.now()}-${sanitizedName}`

  const uploadsDir = join(process.cwd(), 'uploads', 'reports')
  await mkdir(uploadsDir, { recursive: true })
  await writeFile(join(uploadsDir, storedFileName), file.data)

  // Insert into database
  const [row] = await db
    .insert(financialReports)
    .values({
      title,
      filePath: storedFileName,
      month,
      year,
      uploadedById: session.user.id,
      tenantId: session.tenantId,
    })
    .returning()

  if (!row) throw createError({ statusCode: 500, message: 'Error al crear reporte' })

  const report: FinancialReport = {
    id: row.id,
    title: row.title,
    filePath: row.filePath,
    month: row.month,
    year: row.year,
    uploadedById: row.uploadedById,
    createdAt: row.createdAt.toISOString(),
  }

  return { data: report }
})

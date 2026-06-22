import { db } from '~~/server/db'
import { user } from '~~/server/db/schema/auth'
import { staff } from '~~/server/db/schema/staff'
import { providers } from '~~/server/db/schema/provider'
import { serviceStaffRoles } from '~~/server/db/schema/service-staff-role'
import { householdMembers } from '~~/server/db/schema/household'
import { eq, and } from 'drizzle-orm'

const PARTICLES = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y', 'e', 'o', 'a', 'en', 'con'])

const ACCENT_MAP: Record<string, string> = {
  domestico: 'doméstico',
  domestica: 'doméstica',
  electrico: 'eléctrico',
  electricos: 'eléctricos',
  electrica: 'eléctrica',
  electricas: 'eléctricas',
  jardineria: 'jardinería',
  plomeria: 'plomería',
  albanileria: 'albañilería',
  fumigacion: 'fumigación',
  carpinteria: 'carpintería',
  cerrajeria: 'cerrajería',
  mamposteria: 'mampostería',
  fontaneria: 'fontanería',
  mecanica: 'mecánica',
  mecanico: 'mecánico',
  tecnico: 'técnico',
  tecnica: 'técnica',
  hidraulica: 'hidráulica',
  hidraulico: 'hidráulico',
  telefono: 'teléfono',
  telefonico: 'telefónico',
  telefonica: 'telefónica',
  automatico: 'automático',
  automatica: 'automática',
  numero: 'número',
  deposito: 'depósito',
  vehiculo: 'vehículo',
  vehiculos: 'vehículos',
  perez: 'pérez',
  gonzalez: 'gonzález',
  gomez: 'gómez',
  lopez: 'lópez',
  martinez: 'martínez',
  rodriguez: 'rodríguez',
  hernandez: 'hernández',
  ramirez: 'ramírez',
  jimenez: 'jiménez',
  sanchez: 'sánchez',
  diaz: 'díaz',
  garcia: 'garcía',
  alvarez: 'álvarez',
  fernandez: 'fernández',
  suarez: 'suárez',
  vazquez: 'vázquez',
  benitez: 'benítez',
  gutierrez: 'gutiérrez',
  dominguez: 'domínguez',
  marquez: 'márquez',
  bermudez: 'bermúdez',
  nunez: 'núñez',
  maria: 'maría',
  jose: 'josé',
  angel: 'ángel',
  andres: 'andrés',
  jesus: 'jesús',
  moises: 'moisés',
  cesar: 'césar',
  melida: 'mélida',
  nestor: 'néstor',
  hector: 'héctor',
  oscar: 'óscar',
  felix: 'félix',
  ramon: 'ramón',
  german: 'germán',
  adrian: 'adrián',
  sebastian: 'sebastián',
  joaquin: 'joaquín',
  martin: 'martín',
  benjamin: 'benjamín',
  cristobal: 'cristóbal',
  tomas: 'tomás',
  nicolas: 'nicolás',
  maximo: 'máximo',
  simon: 'simón',
  ines: 'inés',
  lucia: 'lucía',
  sofia: 'sofía',
  monica: 'mónica',
  veronica: 'verónica',
  barbara: 'bárbara',
}

function fixAccent(word: string): string {
  const lower = word.toLowerCase()
  const corrected = ACCENT_MAP[lower]
  if (!corrected) return word
  if (word[0] === word[0].toUpperCase()) {
    return corrected.charAt(0).toUpperCase() + corrected.slice(1)
  }
  return corrected
}

function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      const cased = (index > 0 && PARTICLES.has(word))
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1)
      return fixAccent(cased)
    })
    .join(' ')
}

export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin'])
  const { tenantId } = await requireTenant(event)

  const results = { users: 0, staff: 0, providers: 0, serviceRoles: 0, householdMembers: 0 }

  // 1. Users
  const users = await db.select({ id: user.id, name: user.name }).from(user).where(eq(user.tenantId, tenantId))
  for (const u of users) {
    const corrected = normalizeName(u.name)
    if (corrected !== u.name) {
      await db.update(user).set({ name: corrected, updatedAt: new Date() }).where(and(eq(user.id, u.id), eq(user.tenantId, tenantId)))
      results.users++
    }
  }

  // 2. Staff
  const staffList = await db.select({ id: staff.id, name: staff.name }).from(staff).where(eq(staff.tenantId, tenantId))
  for (const s of staffList) {
    const corrected = normalizeName(s.name)
    if (corrected !== s.name) {
      await db.update(staff).set({ name: corrected }).where(and(eq(staff.id, s.id), eq(staff.tenantId, tenantId)))
      results.staff++
    }
  }

  // 3. Providers
  const providerList = await db.select({ id: providers.id, name: providers.name }).from(providers).where(eq(providers.tenantId, tenantId))
  for (const p of providerList) {
    const corrected = normalizeName(p.name)
    if (corrected !== p.name) {
      await db.update(providers).set({ name: corrected, updatedAt: new Date() }).where(and(eq(providers.id, p.id), eq(providers.tenantId, tenantId)))
      results.providers++
    }
  }

  // 4. Service Roles
  const roles = await db.select({ id: serviceStaffRoles.id, name: serviceStaffRoles.name }).from(serviceStaffRoles).where(eq(serviceStaffRoles.tenantId, tenantId))
  for (const r of roles) {
    const corrected = normalizeName(r.name)
    if (corrected !== r.name) {
      await db.update(serviceStaffRoles).set({ name: corrected }).where(and(eq(serviceStaffRoles.id, r.id), eq(serviceStaffRoles.tenantId, tenantId)))
      results.serviceRoles++
    }
  }

  // 5. Household Members
  const members = await db.select({ id: householdMembers.id, name: householdMembers.name }).from(householdMembers).where(eq(householdMembers.tenantId, tenantId))
  for (const m of members) {
    const corrected = normalizeName(m.name)
    if (corrected !== m.name) {
      await db.update(householdMembers).set({ name: corrected }).where(and(eq(householdMembers.id, m.id), eq(householdMembers.tenantId, tenantId)))
      results.householdMembers++
    }
  }

  const total = Object.values(results).reduce((sum, n) => sum + n, 0)

  return {
    message: `${total} nombres corregidos`,
    results,
  }
})

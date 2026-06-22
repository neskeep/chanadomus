import { db } from '~~/server/db'
import { user } from '~~/server/db/schema/auth'
import { staff } from '~~/server/db/schema/staff'
import { providers } from '~~/server/db/schema/provider'
import { serviceStaffRoles } from '~~/server/db/schema/service-staff-role'
import { householdMembers } from '~~/server/db/schema/household'
import { eq } from 'drizzle-orm'

const PARTICLES = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y', 'e', 'o', 'a', 'en', 'con'])

/** Mapa de palabras sin acento → con acento (lowercase) */
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
  gaspar: 'gaspar',
  ines: 'inés',
  lucia: 'lucía',
  sofia: 'sofía',
  monica: 'mónica',
  veronica: 'verónica',
  cecilia: 'cecilia',
  natalia: 'natalia',
  barbara: 'bárbara',
  valeria: 'valeria',
}

function fixAccent(word: string): string {
  const lower = word.toLowerCase()
  const corrected = ACCENT_MAP[lower]
  if (!corrected) return word

  // Preserve the original casing pattern (Title Case or lowercase)
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
      // Title case: capitalize unless particle in non-first position
      const cased = (index > 0 && PARTICLES.has(word))
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1)
      // Fix accents
      return fixAccent(cased)
    })
    .join(' ')
}

interface NameChange {
  id: string
  current: string
  corrected: string
}

export default defineEventHandler(async (event) => {
  await requireRole(event, ['admin'])
  const { tenantId } = await requireTenant(event)

  const [users, staffList, providerList, roles, members] = await Promise.all([
    db.select({ id: user.id, name: user.name }).from(user).where(eq(user.tenantId, tenantId)),
    db.select({ id: staff.id, name: staff.name }).from(staff).where(eq(staff.tenantId, tenantId)),
    db.select({ id: providers.id, name: providers.name }).from(providers).where(eq(providers.tenantId, tenantId)),
    db.select({ id: serviceStaffRoles.id, name: serviceStaffRoles.name }).from(serviceStaffRoles).where(eq(serviceStaffRoles.tenantId, tenantId)),
    db.select({ id: householdMembers.id, name: householdMembers.name }).from(householdMembers).where(eq(householdMembers.tenantId, tenantId)),
  ])

  const findChanges = (items: { id: string; name: string }[]): NameChange[] => {
    return items
      .map(item => ({
        id: item.id,
        current: item.name,
        corrected: normalizeName(item.name),
      }))
      .filter(c => c.current !== c.corrected)
  }

  const changes = {
    users: findChanges(users),
    staff: findChanges(staffList),
    providers: findChanges(providerList),
    serviceRoles: findChanges(roles),
    householdMembers: findChanges(members),
  }

  const totalChanges = Object.values(changes).reduce((sum, arr) => sum + arr.length, 0)

  return {
    totalChanges,
    changes,
  }
})

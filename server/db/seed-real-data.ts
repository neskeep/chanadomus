import { eq, and } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { hashPassword } from 'better-auth/crypto'
import { tenants } from './schema/tenant'
import { user, account } from './schema/auth'
import { units } from './schema/unit'
import { householdMembers } from './schema/household'

const connectionString = process.env.DATABASE_URL!
const client = postgres(connectionString)
const db = drizzle(client)

// ============================================================
// DATA FROM CSV: Ranchos de Chana - Listado Completo
// ADDITIVE ONLY — no deletes, no drops
// ============================================================

interface CsvEntry {
  type: 'rancho' | 'parcela'
  number: number
  lotCode: string | null
  name: string | null
  owner: string
  phone: string | null
  email: string | null
  include: boolean
  notes: string | null
}

const CSV_DATA: CsvEntry[] = [
  // Ranchos
  { type: 'rancho', number: 1, lotCode: null, name: 'Cariaquito Morao', owner: 'Ginett Briceño', phone: '0414 372 8442', email: 'ginettrodriguez@gmail.com', include: true, notes: null },
  { type: 'rancho', number: 2, lotCode: null, name: 'Autana', owner: 'Ricardo Cuscos', phone: '0414 7898412', email: 'ranchoahutana@gmail.com', include: true, notes: null },
  { type: 'rancho', number: 3, lotCode: null, name: 'El Molino', owner: 'Salas Romer', phone: '0414 2348200', email: 'flaquiby@gmail.com', include: true, notes: null },
  { type: 'rancho', number: 4, lotCode: null, name: 'Tamarindo', owner: 'Dubraska de Colmenares', phone: '0416 6432947', email: 'nenadusanka@hotmail.com', include: true, notes: null },
  { type: 'rancho', number: 5, lotCode: null, name: 'Guayacán 1', owner: 'Ana Cisneros', phone: '0412 3214252', email: null, include: true, notes: null },
  { type: 'rancho', number: 6, lotCode: null, name: 'Kigua', owner: 'Germán Ortega', phone: '0424 4342552', email: null, include: true, notes: null },
  { type: 'rancho', number: 7, lotCode: null, name: 'Yemanja', owner: 'María Celeste González', phone: null, email: null, include: true, notes: 'Sin teléfono ni email' },
  { type: 'rancho', number: 8, lotCode: null, name: 'Huachafita', owner: 'Fernando Scull', phone: '0414 2463940', email: 'Fscull50@gmail.com', include: true, notes: null },
  { type: 'rancho', number: 9, lotCode: null, name: 'Perinola', owner: 'Gonzalo Tejera', phone: '0424 6205654', email: 'gtejerap@gmail.com', include: true, notes: null },
  { type: 'rancho', number: 10, lotCode: null, name: 'Samsara', owner: 'Gerald Taverna', phone: '0412 3581140', email: 'Samsara2010@gmail.com', include: true, notes: null },
  { type: 'rancho', number: 11, lotCode: null, name: 'Guayacán 2', owner: 'Ana Cristina Massa', phone: '0412 3214252', email: null, include: true, notes: null },
  { type: 'rancho', number: 12, lotCode: null, name: 'Costanera', owner: 'Nelmar del Pilar Salazar', phone: '0424 8130696', email: null, include: true, notes: null },
  { type: 'rancho', number: 13, lotCode: null, name: 'Flamboyant', owner: 'Luis Azmouz', phone: '+1 9546296629', email: null, include: true, notes: null },
  { type: 'rancho', number: 14, lotCode: null, name: 'Paraguachi Republik', owner: 'Luz Marina Rodríguez', phone: '0412 4522286', email: 'jordiespin@hotmail.com', include: true, notes: null },
  { type: 'rancho', number: 15, lotCode: null, name: 'Huachamakari', owner: 'Marion Cisneros', phone: '+34 639303509', email: 'mcmpccs@gmail.com', include: true, notes: null },
  { type: 'rancho', number: 16, lotCode: null, name: 'Siboney', owner: 'Carolina Oteyza', phone: '0412 3229929', email: 'oteyzasilvia@gmail.com', include: true, notes: null },
  { type: 'rancho', number: 17, lotCode: null, name: 'Moraleja', owner: 'Leonardo Brea', phone: '0412 2387101', email: 'Ebrea2012@gmail.com', include: true, notes: null },
  { type: 'rancho', number: 18, lotCode: null, name: 'Cerro de Humo', owner: 'Patricia Velásquez', phone: '0424 8691977', email: 'cerrodehumomgt@gmail.com', include: true, notes: null },
  { type: 'rancho', number: 19, lotCode: null, name: 'Casa Blanca', owner: 'Fredy de Alessandria', phone: '0414 1197697', email: 'Mundojardin1@gmail.com', include: true, notes: null },
  { type: 'rancho', number: 20, lotCode: null, name: 'María del Mar', owner: 'Miguel Guareschi', phone: '0412 2328277', email: 'kmartinez@vinzoca.com', include: true, notes: null },
  { type: 'rancho', number: 21, lotCode: null, name: 'Agua e Luna', owner: 'Miguel Guareschi', phone: '0412 2328277', email: 'kmartinez@vinzoca.com', include: true, notes: null },
  { type: 'rancho', number: 22, lotCode: null, name: 'Barro Salao', owner: 'Mari Luz Alemán', phone: '0414 3401881', email: 'Zoraya_rodriguez@hotmail.com', include: true, notes: null },
  { type: 'rancho', number: 23, lotCode: null, name: 'Chabono', owner: 'Juan Guillermo Alamo', phone: '0414 1294622', email: 'Genara_rojas@hotmail.com', include: true, notes: null },
  { type: 'rancho', number: 24, lotCode: null, name: 'Papapa', owner: 'Yussef Abou Nassif', phone: null, email: null, include: true, notes: 'Sin teléfono ni email' },
  { type: 'rancho', number: 25, lotCode: null, name: 'Kakao', owner: 'Juan Carlos Briket', phone: '0424 1772585', email: 'jcbriket@bridansc.com', include: true, notes: null },
  { type: 'rancho', number: 26, lotCode: null, name: 'Akuena', owner: 'Mónica de Briceño', phone: '0414 1210188', email: 'Yv1805@gmail.com', include: true, notes: 'Vendido, propietario actual desconocido' },
  { type: 'rancho', number: 27, lotCode: null, name: 'La Maru', owner: 'Luis Arcia', phone: '0414 2369555', email: 'malarcia@icloud.com', include: true, notes: null },
  { type: 'rancho', number: 28, lotCode: null, name: 'Guarapita', owner: 'Pedro Lara', phone: '0414 3375560', email: 'mirvenelar@hotmail.com', include: true, notes: null },
  { type: 'rancho', number: 29, lotCode: null, name: 'Considero', owner: 'Juan Sauce', phone: '0414 1288888', email: 'jsauce@gmail.com', include: true, notes: null },
  { type: 'rancho', number: 30, lotCode: null, name: 'Carambola', owner: 'Lawrence Victor Manes', phone: '0416 8958603', email: 'lvmanes@gmail.com', include: true, notes: null },
  { type: 'rancho', number: 31, lotCode: null, name: 'Madrugada', owner: 'Luigi Ferraro', phone: '+39 3356939675', email: 'luigifca@gmail.com', include: true, notes: null },
  { type: 'rancho', number: 32, lotCode: null, name: 'Mariposa', owner: 'Luis José Arcia', phone: '0414 2369555', email: 'malarcia@icloud.com', include: true, notes: null },
  { type: 'rancho', number: 33, lotCode: null, name: 'Paraulata', owner: 'Arq. Juliana González', phone: '0426 5960525', email: null, include: false, notes: 'Marcado NO INCLUIR' },
  { type: 'rancho', number: 34, lotCode: null, name: 'Pachakuncha', owner: 'Mario Ordóñez', phone: '+1 9546834375', email: null, include: true, notes: null },
  { type: 'rancho', number: 35, lotCode: null, name: 'Vista Clara', owner: 'Julio Brillenburg', phone: '0412 8009496', email: 'pbrillenburg@gmail.com', include: true, notes: null },
  { type: 'rancho', number: 36, lotCode: null, name: 'Cotoperis', owner: 'Víctor Rodríguez', phone: '+1 561 3606973', email: 'Victor.r7m@gmail.com', include: true, notes: null },
  { type: 'rancho', number: 37, lotCode: null, name: 'Pavita', owner: 'Patrick Bougnon', phone: null, email: null, include: false, notes: 'Marcado NO INCLUIR' },
  { type: 'rancho', number: 38, lotCode: null, name: 'Perla Salina', owner: 'Franco Rubartelli', phone: '0412 2346070', email: 'francoiserubartelli@gmail.com', include: true, notes: null },
  { type: 'rancho', number: 39, lotCode: null, name: 'Vendaval', owner: 'Bibiana Rodríguez', phone: '+57 3003503568', email: null, include: true, notes: null },
  { type: 'rancho', number: 40, lotCode: null, name: 'Churuame', owner: 'María Fernanda González', phone: '0414 2789606', email: 'mananabatik@gmail.com', include: true, notes: null },
  { type: 'rancho', number: 41, lotCode: null, name: 'Rancho Fino', owner: 'DGCIM (confiscado)', phone: null, email: null, include: false, notes: 'Confiscado DGCIM' },
  { type: 'rancho', number: 42, lotCode: null, name: 'Bora Bora', owner: 'Carlos Ramírez', phone: '0414 4237748', email: 'jdurvelle@gmail.com', include: true, notes: null },
  { type: 'rancho', number: 43, lotCode: null, name: 'Kimbombo', owner: 'Arlene de Benaserraf', phone: '0424 1332799', email: 'Coro1401@gmail.com', include: true, notes: null },
  { type: 'rancho', number: 44, lotCode: null, name: 'Datilera', owner: 'Francisco Santana', phone: '0412 4426438', email: 'kikosantanal@gmail.com', include: true, notes: null },
  { type: 'rancho', number: 45, lotCode: null, name: 'Guamache', owner: 'Raúl Delgado', phone: '0414 1823485', email: 'rauldelgadososa@gmail.com', include: true, notes: null },
  { type: 'rancho', number: 46, lotCode: null, name: 'Manantial', owner: 'José Antonio González', phone: '0414 3955734', email: 'finanzas@materialesmanzanillo.com', include: true, notes: null },
  { type: 'rancho', number: 47, lotCode: null, name: 'Sherezade', owner: 'Faruk Beirutty', phone: '0424 2244060', email: null, include: true, notes: null },
  { type: 'rancho', number: 48, lotCode: null, name: 'Cala Margarita', owner: 'Jimmy Bellirtti', phone: '0424 8444353', email: null, include: true, notes: null },
  { type: 'rancho', number: 49, lotCode: null, name: 'Rancho Azul', owner: 'Tito Salomón Mishaan', phone: '+1 3057905919', email: 'chisasi@gmail.com', include: true, notes: null },
  { type: 'rancho', number: 50, lotCode: null, name: 'Barlovento', owner: 'Carlos Villanueva', phone: '0412 2229989', email: 'carlorsrvs@yahoo.com', include: true, notes: null },
  { type: 'rancho', number: 51, lotCode: null, name: 'Kala', owner: 'Antonio Nava Díaz', phone: null, email: 'vickyalvarezkite@gmail.com', include: true, notes: null },
  { type: 'rancho', number: 52, lotCode: null, name: 'Araguaney', owner: 'Leonardo Ferrer', phone: '0414 7652668', email: null, include: true, notes: null },
  { type: 'rancho', number: 53, lotCode: null, name: 'Cocuiza', owner: 'Carlos Consalvi', phone: '0414 7560176', email: null, include: true, notes: null },
  { type: 'rancho', number: 54, lotCode: null, name: 'Los Abuelos', owner: 'Ahmed Maled Mustafa', phone: '0422 2914707', email: null, include: true, notes: null },
  { type: 'rancho', number: 55, lotCode: null, name: 'Agua e Panela', owner: 'Ahmed Maled Mustafa', phone: null, email: null, include: true, notes: 'Mismo propietario que Los Abuelos' },
  { type: 'rancho', number: 56, lotCode: null, name: 'Guayamurina', owner: 'Andrés Kauffmann', phone: '0412 9052923', email: 'zekauf@gmail.com', include: true, notes: null },
  { type: 'rancho', number: 57, lotCode: null, name: 'Pochito', owner: 'Ángel Hurtado', phone: '0412 3589512', email: null, include: true, notes: null },
  { type: 'rancho', number: 58, lotCode: null, name: 'Aria', owner: 'Maryeska Fallone', phone: '0412 2232411', email: 'maryeska@gmail.com', include: true, notes: null },
  { type: 'rancho', number: 59, lotCode: null, name: 'Er Melao', owner: 'Fernando Tamayo', phone: '0414 2434144', email: 'freddytorres@gmail.com', include: true, notes: null },
  { type: 'rancho', number: 60, lotCode: null, name: 'Catalufa', owner: 'DGCIM (confiscado)', phone: null, email: null, include: false, notes: 'Confiscado DGCIM' },
  { type: 'rancho', number: 61, lotCode: null, name: 'Kumakaru', owner: 'Oragni Velázquez', phone: null, email: 'ygonzalez.niane@gmail.com', include: true, notes: null },
  { type: 'rancho', number: 62, lotCode: null, name: 'Guaykirima', owner: 'Javier Franceschi', phone: '0414 8018023', email: 'javierfranceschi@gmail.com', include: true, notes: null },
  { type: 'rancho', number: 63, lotCode: null, name: 'Clavo e Canela', owner: 'Roberto Cohimbra', phone: '0412 6279358', email: 'bobbycohimbra@yahoo.com', include: true, notes: null },
  { type: 'rancho', number: 64, lotCode: null, name: 'Victorio', owner: 'María Elena Colmenares', phone: '0416 6333736', email: 'victorio@ranchovictorio.com', include: true, notes: null },
  { type: 'rancho', number: 65, lotCode: null, name: 'Guayate', owner: 'Rafael Blanco', phone: '0414 2512301', email: null, include: true, notes: null },
  { type: 'rancho', number: 66, lotCode: null, name: 'Marusa', owner: 'María Eugenia Angulo', phone: '+1 7862536375', email: null, include: true, notes: null },
  { type: 'rancho', number: 67, lotCode: null, name: 'Rompemar', owner: 'Fabián Bubat', phone: '0414 1311515', email: null, include: true, notes: null },
  { type: 'rancho', number: 68, lotCode: null, name: 'Embajador', owner: 'Iván Núñez Burgo', phone: null, email: null, include: true, notes: 'Sin teléfono ni email' },
  { type: 'rancho', number: 69, lotCode: null, name: 'Casares', owner: 'Ana Clemencia Fox', phone: '+1 9178471702', email: 'Doralvys.romero@sigosa.com', include: true, notes: null },
  { type: 'rancho', number: 70, lotCode: null, name: 'Guayamate', owner: 'Margarita Zingg', phone: '0412 3270468', email: 'marzingg@gmail.com', include: true, notes: null },
  { type: 'rancho', number: 71, lotCode: null, name: 'Kapalua', owner: 'Marcus Petrus', phone: '0426 7880279', email: null, include: true, notes: null },
  { type: 'rancho', number: 72, lotCode: null, name: 'Los Frailes', owner: 'Milton Martínez', phone: '0412 2816007', email: 'Milton.martinez@sigosa.com', include: true, notes: null },
  { type: 'rancho', number: 73, lotCode: null, name: 'Chiloé', owner: 'Marcela Segura', phone: '0414 1823485', email: 'msegura@contrat.cl', include: true, notes: null },
  { type: 'rancho', number: 74, lotCode: null, name: 'Meraki', owner: 'Lázaro Ochoa', phone: '0412 0174380', email: 'lazaroochoa@hotmail.com', include: true, notes: null },

  // Parcelas
  { type: 'parcela', number: 1, lotCode: 'S14-C8', name: null, owner: 'María Estela Molina', phone: null, email: 'rfigueirag@gmail.com', include: false, notes: 'Sin construir - NO INCLUIR' },
  { type: 'parcela', number: 2, lotCode: 'S14', name: null, owner: 'Alessandro Pastura', phone: '0412 9794837', email: 'mgas62@hotmail.com', include: true, notes: null },
  { type: 'parcela', number: 3, lotCode: 'S12', name: null, owner: 'Leonardo Domínguez', phone: '0416 680 5955', email: 'cdominguez@ponce_benzo.com', include: true, notes: 'Sobrino: Andrés Domínguez' },
  { type: 'parcela', number: 4, lotCode: null, name: null, owner: 'Salomón Belilty', phone: null, email: null, include: true, notes: 'Sin código/lote indicado' },
  { type: 'parcela', number: 5, lotCode: null, name: null, owner: 'Pedro Delgado', phone: '0414 3287414', email: null, include: true, notes: null },
  { type: 'parcela', number: 6, lotCode: null, name: null, owner: 'Ana González', phone: '0412 3595558', email: null, include: true, notes: null },
  { type: 'parcela', number: 7, lotCode: 'L65', name: null, owner: 'Marion Cisneros', phone: null, email: null, include: true, notes: 'Inversiones Lanebla' },
  { type: 'parcela', number: 8, lotCode: 'L64E', name: null, owner: 'Marion Cisneros', phone: null, email: null, include: true, notes: 'Mismo código L64E que parcela 12' },
  { type: 'parcela', number: 9, lotCode: 'L64B', name: null, owner: 'Pascual Tufano', phone: null, email: null, include: true, notes: null },
  { type: 'parcela', number: 10, lotCode: 'L64C', name: null, owner: 'Francesco Lobaglio', phone: '0414 2795998', email: null, include: true, notes: null },
  { type: 'parcela', number: 11, lotCode: 'L64D', name: null, owner: 'Armando Pulgar', phone: null, email: null, include: true, notes: null },
  { type: 'parcela', number: 12, lotCode: 'L64E', name: null, owner: 'Inversiones Lanebla', phone: null, email: null, include: true, notes: 'Mismo código L64E que parcela 8' },
  { type: 'parcela', number: 13, lotCode: 'L6B', name: null, owner: 'José Morillo', phone: '0414 2820359', email: null, include: true, notes: 'Distribuidora Kuenta' },
  { type: 'parcela', number: 14, lotCode: 'L10B', name: null, owner: 'Tania de Brillembourt', phone: '0414 2540363', email: null, include: true, notes: 'Apoderado: Gonzalo Salima' },
  { type: 'parcela', number: 15, lotCode: 'L7', name: null, owner: 'Arturo Brillembourt', phone: '0414 2540363', email: null, include: true, notes: 'Apoderado: Gonzalo Salima' },
  { type: 'parcela', number: 16, lotCode: 'L63', name: null, owner: 'Alberto Cohen', phone: null, email: null, include: true, notes: null },
  { type: 'parcela', number: 17, lotCode: null, name: null, owner: 'Pancho Villarrubia', phone: null, email: null, include: true, notes: 'Sin código/lote indicado' },
  { type: 'parcela', number: 18, lotCode: 'L56', name: null, owner: 'Vicente Avella', phone: null, email: 'lomasdecaiza@gmail.com', include: true, notes: null },
  { type: 'parcela', number: 19, lotCode: null, name: null, owner: 'No identificado', phone: null, email: null, include: true, notes: 'Parcela pequeña no identificada' },
  { type: 'parcela', number: 20, lotCode: 'L12A', name: null, owner: 'Alicia Wilson', phone: null, email: 'miladypereiraq@gmail.com', include: true, notes: null },
  { type: 'parcela', number: 21, lotCode: 'L15-B1', name: null, owner: 'La Plana', phone: '0414 3491577', email: 'laplanacontable@gmail.com', include: true, notes: null },
  { type: 'parcela', number: 22, lotCode: 'L15-B2', name: null, owner: 'Sin propietario', phone: null, email: null, include: true, notes: 'Sin información de propietario' },
  { type: 'parcela', number: 23, lotCode: 'L15-B3', name: null, owner: 'Sin propietario', phone: null, email: null, include: true, notes: 'Sin información de propietario' },
  { type: 'parcela', number: 24, lotCode: 'L15-B4', name: null, owner: 'Sin propietario', phone: null, email: null, include: true, notes: 'Sin información de propietario' },
  { type: 'parcela', number: 25, lotCode: 'L15-B5', name: null, owner: 'Sin propietario', phone: null, email: null, include: true, notes: 'Sin información de propietario' },
  { type: 'parcela', number: 26, lotCode: 'L14A', name: null, owner: 'Patrick Bougnon', phone: '0412 2651858', email: null, include: true, notes: null },
  { type: 'parcela', number: 27, lotCode: 'L14B', name: null, owner: 'Patrick Bougnon', phone: null, email: null, include: true, notes: null },
  { type: 'parcela', number: 28, lotCode: 'L55', name: null, owner: 'Flavio de Sordo', phone: '0416 6238266', email: 'aguadecocos@hotmail.com', include: true, notes: null },
  { type: 'parcela', number: 29, lotCode: 'L17C', name: null, owner: 'José Vidal', phone: null, email: 'cvidal@en_linea.com', include: true, notes: null },
  { type: 'parcela', number: 30, lotCode: 'L17D', name: null, owner: 'Luis Vidal', phone: '0414 3113968', email: null, include: true, notes: null },
  { type: 'parcela', number: 31, lotCode: 'L24', name: null, owner: 'Hernán Graziani', phone: '0412 2766942', email: 'hagraziani@yahoo.com', include: true, notes: null },
  { type: 'parcela', number: 32, lotCode: 'L19', name: null, owner: 'Toni Zuccar', phone: '0424 8553337', email: null, include: true, notes: null },
  { type: 'parcela', number: 33, lotCode: 'L28', name: null, owner: 'Luis Zubillaga', phone: null, email: 'zubillagadiana@gmail.com', include: true, notes: null },
  { type: 'parcela', number: 34, lotCode: 'L17B', name: null, owner: 'María Isabel Espinosa Marturet', phone: null, email: null, include: true, notes: null },
  { type: 'parcela', number: 35, lotCode: 'L29', name: null, owner: 'Fernando Castro', phone: '+1 517158324', email: 'gloriacastro@gmail.com', include: true, notes: null },
  { type: 'parcela', number: 36, lotCode: 'L32', name: null, owner: 'Francisco Pérez', phone: null, email: 'n.perez17@hotmail.com', include: true, notes: null },
  { type: 'parcela', number: 37, lotCode: 'L33', name: null, owner: 'Caridad Velázquez', phone: null, email: 'gloria_mena@tamayo.com.ve', include: true, notes: null },
  { type: 'parcela', number: 38, lotCode: 'L34', name: null, owner: 'Samuel Quiroz', phone: null, email: null, include: true, notes: null },
  { type: 'parcela', number: 39, lotCode: 'L30-1', name: null, owner: 'Gustavo Mato', phone: null, email: null, include: true, notes: null },
  { type: 'parcela', number: 40, lotCode: 'L30B', name: null, owner: 'Michael Rondón', phone: '0424 1632545', email: null, include: true, notes: null },
  { type: 'parcela', number: 41, lotCode: 'L38', name: null, owner: 'Belén Velutinni', phone: null, email: 'belenbrigida@yahoo.com', include: true, notes: null },
  { type: 'parcela', number: 42, lotCode: 'L42', name: null, owner: 'Luis Hinestrosa', phone: '0422 7088032', email: 'luishinestrosapocaterra@gmail.com', include: true, notes: null },
  { type: 'parcela', number: 43, lotCode: 'L66', name: null, owner: 'José Belloso', phone: '0414 2319500', email: 'jbelloso2005@cantv.net', include: true, notes: null },
]

// ============================================================
// HELPERS
// ============================================================

function normalizePhone(phone: string | null): string | null {
  if (!phone) return null
  return phone.replace(/\s+/g, '').trim()
}

function generateEmail(owner: string, type: string, number: number): string {
  const slug = owner
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
  return `${slug}.${type}${number}@chanadomus.local`
}

function isSpecialOwner(owner: string): boolean {
  return ['DGCIM (confiscado)', 'No identificado', 'Sin propietario'].includes(owner)
}

// ============================================================
// MAIN SEED — ADDITIVE ONLY
// ============================================================

async function seedRealData() {
  console.log('=== SEED REAL DATA (ADDITIVE) : Ranchos de Chana ===\n')

  // 1. Get existing tenant
  const existingTenants = await db.select().from(tenants).where(eq(tenants.slug, 'ranchos-de-chana'))
  const tenant = existingTenants[0]

  if (!tenant) {
    console.error('ERROR: Tenant "ranchos-de-chana" no existe. Ejecuta seed.ts primero.')
    await client.end()
    process.exit(1)
  }
  console.log(`✓ Tenant: ${tenant.name} (${tenant.id})`)

  // 2. Load existing units
  const existingUnits = await db.select().from(units).where(eq(units.tenantId, tenant.id))
  console.log(`  Unidades existentes: ${existingUnits.length}`)

  // 3. Load existing users
  const existingUsers = await db.select().from(user).where(eq(user.tenantId, tenant.id))
  console.log(`  Usuarios existentes: ${existingUsers.length}`)

  const hashedPassword = await hashPassword('Yolo2026!')
  const now = new Date()
  const includedEntries = CSV_DATA.filter(e => e.include)
  const excludedEntries = CSV_DATA.filter(e => !e.include)

  // ============================================================
  // STEP A: Update existing rancho labels + create new units
  // ============================================================
  console.log('\n--- Unidades ---')

  // Map of existing units by number
  const existingUnitByNumber = new Map(existingUnits.map(u => [u.number, u]))

  let unitsUpdated = 0
  let unitsCreated = 0
  let unitsInactive = 0
  const unitMap = new Map<string, string>() // "rancho-1" -> unitId

  for (const entry of includedEntries) {
    const prefix = entry.type === 'rancho' ? 'R' : 'P'
    const unitNumber = `${prefix}-${String(entry.number).padStart(3, '0')}`

    let label: string
    if (entry.type === 'rancho' && entry.name) {
      label = entry.name
    } else if (entry.lotCode) {
      label = `Parcela ${entry.lotCode}`
    } else {
      label = `Parcela ${entry.number}`
    }

    const existing = existingUnitByNumber.get(unitNumber)

    if (existing) {
      // Update label with real name if it was generic
      if (existing.label !== label) {
        await db.update(units)
          .set({ label, updatedAt: now })
          .where(eq(units.id, existing.id))
        unitsUpdated++
      }
      unitMap.set(`${entry.type}-${entry.number}`, existing.id)
    } else {
      // Create new unit (parcelas mostly)
      const rows = await db.insert(units).values({
        number: unitNumber,
        label,
        tenantId: tenant.id,
      }).returning()
      unitMap.set(`${entry.type}-${entry.number}`, rows[0]!.id)
      unitsCreated++
    }
  }

  // Insert excluded units as inactive
  for (const entry of excludedEntries) {
    const prefix = entry.type === 'rancho' ? 'R' : 'P'
    const unitNumber = `${prefix}-${String(entry.number).padStart(3, '0')}`

    let label: string
    if (entry.type === 'rancho' && entry.name) {
      label = entry.name
    } else if (entry.lotCode) {
      label = `Parcela ${entry.lotCode}`
    } else {
      label = `Parcela ${entry.number}`
    }

    const existing = existingUnitByNumber.get(unitNumber)

    if (existing) {
      // Ensure it's marked inactive with correct label
      await db.update(units)
        .set({ label, isActive: false, updatedAt: now })
        .where(eq(units.id, existing.id))
    } else {
      await db.insert(units).values({
        number: unitNumber,
        label,
        isActive: false,
        tenantId: tenant.id,
      })
    }
    unitsInactive++
  }

  console.log(`  ✓ ${unitsUpdated} unidades actualizadas (nombre real)`)
  console.log(`  ✓ ${unitsCreated} unidades nuevas creadas`)
  console.log(`  ✓ ${unitsInactive} unidades marcadas inactivas`)

  // ============================================================
  // STEP B: Create propietario users (skip existing)
  // ============================================================
  console.log('\n--- Propietarios ---')

  // Build owner dedup map
  interface OwnerData {
    name: string
    email: string
    phone: string | null
    unitKeys: string[]
  }

  const ownerMap = new Map<string, OwnerData>()

  for (const entry of includedEntries) {
    if (isSpecialOwner(entry.owner)) continue

    const ownerName = entry.owner
      .replace(' – Inversiones Lanebla', '')
      .replace(' (administradora)', '')
      .trim()

    const email = entry.email?.toLowerCase() ?? null
    const key = email ?? ownerName.toLowerCase()

    const existing = ownerMap.get(key)
    if (existing) {
      existing.unitKeys.push(`${entry.type}-${entry.number}`)
      if (!existing.phone && entry.phone) {
        existing.phone = normalizePhone(entry.phone)
      }
    } else {
      ownerMap.set(key, {
        name: ownerName,
        email: email ?? generateEmail(ownerName, entry.type.charAt(0), entry.number),
        phone: normalizePhone(entry.phone),
        unitKeys: [`${entry.type}-${entry.number}`],
      })
    }
  }

  // Existing user emails for fast lookup
  const existingEmailSet = new Set(existingUsers.map(u => u.email.toLowerCase()))

  let usersCreated = 0
  let usersSkipped = 0
  let usersLinked = 0

  for (const [, ownerData] of ownerMap) {
    if (existingEmailSet.has(ownerData.email.toLowerCase())) {
      // User exists — just ensure they have a unit assigned
      const existingUser = existingUsers.find(u => u.email.toLowerCase() === ownerData.email.toLowerCase())
      if (existingUser && !existingUser.unitId) {
        const unitId = unitMap.get(ownerData.unitKeys[0]!)
        if (unitId) {
          await db.update(user).set({ unitId }).where(eq(user.id, existingUser.id))
          usersLinked++
        }
      }
      usersSkipped++
      continue
    }

    const userId = crypto.randomUUID()
    const primaryUnitId = unitMap.get(ownerData.unitKeys[0]!) ?? null

    await db.insert(user).values({
      id: userId,
      name: ownerData.name,
      email: ownerData.email,
      emailVerified: true,
      role: 'propietario',
      tenantId: tenant.id,
      unitId: primaryUnitId,
      phone: ownerData.phone,
      createdAt: now,
      updatedAt: now,
    })

    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: userId,
      providerId: 'credential',
      userId,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    })

    usersCreated++
  }

  console.log(`  ✓ ${usersCreated} propietarios creados`)
  console.log(`  ⏭ ${usersSkipped} ya existían (no tocados)`)
  if (usersLinked > 0) {
    console.log(`  🔗 ${usersLinked} usuarios existentes vinculados a unidad`)
  }

  // ============================================================
  // STEP C: Create household members (owner per unit)
  // ============================================================
  console.log('\n--- Household Members (residentes) ---')

  // Load existing household members to avoid duplicates
  const existingMembers = await db.select({
    unitId: householdMembers.unitId,
    name: householdMembers.name,
  }).from(householdMembers).where(eq(householdMembers.tenantId, tenant.id))

  const existingMemberKeys = new Set(
    existingMembers.map(m => `${m.unitId}::${m.name.toLowerCase()}`)
  )

  let membersCreated = 0
  let membersSkipped = 0

  for (const entry of includedEntries) {
    if (isSpecialOwner(entry.owner)) continue

    const ownerName = entry.owner
      .replace(' – Inversiones Lanebla', '')
      .replace(' (administradora)', '')
      .trim()

    // Get all unit IDs for this entry
    const unitId = unitMap.get(`${entry.type}-${entry.number}`)
    if (!unitId) continue

    const memberKey = `${unitId}::${ownerName.toLowerCase()}`
    if (existingMemberKeys.has(memberKey)) {
      membersSkipped++
      continue
    }

    await db.insert(householdMembers).values({
      unitId,
      name: ownerName,
      relationship: 'owner',
      phone: normalizePhone(entry.phone),
      isActive: true,
      tenantId: tenant.id,
    })

    existingMemberKeys.add(memberKey) // prevent dups within same run (multi-property)
    membersCreated++
  }

  console.log(`  ✓ ${membersCreated} residentes (owner) creados`)
  if (membersSkipped > 0) {
    console.log(`  ⏭ ${membersSkipped} ya existían`)
  }

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log('\n=== RESUMEN ===')
  console.log(`Unidades: ${unitsUpdated} actualizadas, ${unitsCreated} nuevas`)
  console.log(`Propietarios: ${usersCreated} nuevos, ${usersSkipped} existentes`)
  console.log(`Password default para nuevos: Yolo2026!`)

  // Excluded entries
  const excluded = CSV_DATA.filter(e => !e.include)
  if (excluded.length > 0) {
    console.log(`\nExcluidos (${excluded.length}):`)
    for (const e of excluded) {
      console.log(`  - ${e.type} ${e.number}: ${e.name ?? e.owner} — ${e.notes}`)
    }
  }

  // Multi-property owners
  const multiOwners = [...ownerMap.values()].filter(o => o.unitKeys.length > 1)
  if (multiOwners.length > 0) {
    console.log(`\nPropietarios multi-propiedad (${multiOwners.length}):`)
    for (const o of multiOwners) {
      console.log(`  - ${o.name}: ${o.unitKeys.join(', ')}`)
    }
  }

  // Owners with placeholder email
  const noEmailOwners = [...ownerMap.values()].filter(o => o.email.endsWith('@chanadomus.local'))
  if (noEmailOwners.length > 0) {
    console.log(`\nSin email real (${noEmailOwners.length}) — placeholder @chanadomus.local:`)
    for (const o of noEmailOwners) {
      console.log(`  - ${o.name}: ${o.email}`)
    }
  }

  console.log('\n=== SEED COMPLETADO ===')
  await client.end()
}

seedRealData().catch((e) => {
  console.error('Seed failed:', e)
  process.exit(1)
})

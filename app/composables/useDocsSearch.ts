interface DocsSearchEntry {
  id: string
  title: string
  group: string
  keywords: string[]
  description: string
}

const SEARCH_INDEX: DocsSearchEntry[] = [
  // Introduccion
  {
    id: 'introduccion',
    title: 'Visión general',
    group: 'Introducción',
    keywords: ['inicio', 'bienvenida', 'que es', 'plataforma', 'sistema', 'condominio', 'residencial', 'administración', 'chanadomus', 'guía', 'ayuda', 'manual'],
    description: 'Descripción general de ChanaDomus y sus capacidades principales',
  },
  {
    id: 'roles',
    title: 'Roles y permisos',
    group: 'Introducción',
    keywords: ['admin', 'administrador', 'propietario', 'vigilancia', 'conserje', 'permisos', 'acceso', 'rol', 'privilegios', 'capacidades', 'qué puedo hacer'],
    description: 'Los cuatro roles del sistema y sus capacidades',
  },

  // Gestion de Residentes
  {
    id: 'usuarios',
    title: 'Usuarios',
    group: 'Gestión de Residentes',
    keywords: ['usuario', 'cuenta', 'registro', 'crear usuario', 'invitar', 'residente', 'habitante', 'persona', 'correo', 'email', 'activar', 'desactivar'],
    description: 'Gestión de cuentas de usuario y registro de residentes',
  },
  {
    id: 'invitaciones',
    title: 'Invitaciones de registro',
    group: 'Gestión de Residentes',
    keywords: ['invitación', 'invitar', 'enlace', 'link', 'registro', 'auto-registro', 'token', 'generar enlace', 'compartir', 'revocar', 'expirar', 'propietario', 'conserje'],
    description: 'Generación de enlaces de invitación para que usuarios se registren por su cuenta',
  },
  {
    id: 'unidades',
    title: 'Unidades y propiedades',
    group: 'Gestión de Residentes',
    keywords: ['unidad', 'propiedad', 'rancho', 'parcela', 'lote', 'casa', 'domicilio', 'dirección', 'asignar', 'propietario', 'terreno'],
    description: 'Administración de unidades, ranchos y parcelas del condominio',
  },
  {
    id: 'miembros',
    title: 'Miembros del hogar',
    group: 'Gestión de Residentes',
    keywords: ['miembro', 'familia', 'familiar', 'hogar', 'dependiente', 'hijo', 'esposa', 'esposo', 'pareja', 'agregar miembro', 'cohabitante', 'residente'],
    description: 'Registro de familiares y cohabitantes de cada unidad',
  },
  {
    id: 'vehiculos',
    title: 'Vehículos',
    group: 'Gestión de Residentes',
    keywords: ['vehículo', 'carro', 'coche', 'auto', 'camioneta', 'placa', 'matrícula', 'modelo', 'marca', 'color', 'estacionamiento', 'registrar vehículo'],
    description: 'Registro y gestión de vehículos de residentes',
  },

  // Control de Acceso
  {
    id: 'qr',
    title: 'Sistema de códigos QR',
    group: 'Control de Acceso',
    keywords: ['qr', 'código', 'generar', 'compartir', 'invitación', 'visita', 'pase', 'entrada', 'badge', 'credencial', 'identificación'],
    description: 'Generación y gestión de códigos QR para control de acceso',
  },
  {
    id: 'escaneo',
    title: 'Escaneo QR',
    group: 'Control de Acceso',
    keywords: ['escanear', 'lector', 'cámara', 'scan', 'validar', 'verificar', 'entrada', 'caseta', 'guardia', 'vigilante'],
    description: 'Proceso de escaneo y validación de códigos QR en caseta',
  },
  {
    id: 'accesos',
    title: 'Registro de accesos',
    group: 'Control de Acceso',
    keywords: ['acceso', 'registro', 'bitácora', 'historial', 'entrada', 'salida', 'log', 'quién entró', 'hora', 'fecha', 'movimiento'],
    description: 'Bitácora de entradas y salidas del condominio',
  },
  {
    id: 'pases-vehiculares',
    title: 'Pases vehiculares',
    group: 'Control de Acceso',
    keywords: ['pase', 'vehicular', 'vehículo', 'visitante', 'carro', 'auto', 'temporal', 'autorizar', 'placa', 'estacionamiento', 'proveedor'],
    description: 'Autorización temporal de vehículos de visitantes y proveedores',
  },
  {
    id: 'visitantes-frecuentes',
    title: 'Visitantes frecuentes',
    group: 'Control de Acceso',
    keywords: ['frecuente', 'recurrente', 'habitual', 'doméstica', 'empleada', 'jardinero', 'nana', 'trabajador', 'servicio', 'permanente', 'autorizado'],
    description: 'Gestión de visitantes recurrentes con acceso preautorizado',
  },

  // Seguridad
  {
    id: 'panico',
    title: 'Botón de pánico',
    group: 'Seguridad',
    keywords: ['pánico', 'emergencia', 'alerta', 'auxilio', 'ayuda', 'urgente', 'peligro', 'seguridad', 'sos', 'alarma', 'botón rojo'],
    description: 'Sistema de alerta de emergencia para residentes',
  },
  {
    id: 'incidencias',
    title: 'Incidencias',
    group: 'Seguridad',
    keywords: ['incidencia', 'reporte', 'problema', 'queja', 'denuncia', 'reclamo', 'situación', 'evento', 'novedad', 'evidencia', 'foto'],
    description: 'Reporte y seguimiento de incidencias y novedades',
  },

  // Comunicacion
  {
    id: 'chat',
    title: 'Chat comunitario',
    group: 'Comunicación',
    keywords: ['chat', 'mensaje', 'conversación', 'grupo', 'comunidad', 'comunicar', 'escribir', 'hablar', 'sala', 'canal', 'texto'],
    description: 'Mensajería en tiempo real entre residentes y administración',
  },
  {
    id: 'cartelera',
    title: 'Cartelera y anuncios',
    group: 'Comunicación',
    keywords: ['cartelera', 'anuncio', 'aviso', 'publicación', 'comunicado', 'informar', 'noticia', 'boletín', 'importante', 'evento'],
    description: 'Publicación de anuncios y avisos para la comunidad',
  },
  {
    id: 'notificaciones',
    title: 'Notificaciones push',
    group: 'Comunicación',
    keywords: ['notificación', 'push', 'alerta', 'aviso', 'campana', 'celular', 'móvil', 'configurar', 'activar', 'desactivar', 'preferencias'],
    description: 'Configuración de notificaciones push en dispositivos',
  },

  // Gobernanza
  {
    id: 'votaciones',
    title: 'Votaciones',
    group: 'Gobernanza',
    keywords: ['votación', 'voto', 'encuesta', 'decisión', 'asamblea', 'quórum', 'mayoría', 'aprobar', 'rechazar', 'propuesta', 'consulta', 'opinión'],
    description: 'Sistema de votaciones y consultas comunitarias',
  },
  {
    id: 'reuniones',
    title: 'Reuniones',
    group: 'Gobernanza',
    keywords: ['reunión', 'asamblea', 'junta', 'sesión', 'acta', 'agenda', 'orden del día', 'convocatoria', 'minuta', 'acuerdo', 'calendario'],
    description: 'Programación y gestión de asambleas y reuniones',
  },
  {
    id: 'normativas',
    title: 'Normativas',
    group: 'Gobernanza',
    keywords: ['normativa', 'reglamento', 'regla', 'política', 'norma', 'estatuto', 'lineamiento', 'convivencia', 'sanción', 'multa', 'documento'],
    description: 'Reglamentos y normativas del condominio',
  },

  // Finanzas
  {
    id: 'finanzas',
    title: 'Cargos, abonos e informes',
    group: 'Finanzas',
    keywords: ['finanza', 'cargo', 'abono', 'pago', 'cobro', 'cuota', 'mantenimiento', 'deuda', 'saldo', 'estado de cuenta', 'recibo', 'factura', 'informe', 'reporte financiero', 'ingreso', 'egreso', 'balance', 'moroso', 'adeudo'],
    description: 'Gestión de cargos, pagos, estados de cuenta e informes financieros',
  },

  // Servicios
  {
    id: 'personal',
    title: 'Personal de servicio',
    group: 'Servicios',
    keywords: ['personal', 'empleado', 'trabajador', 'staff', 'limpieza', 'mantenimiento', 'vigilante', 'guardia', 'jardinero', 'conserje', 'nómina', 'horario'],
    description: 'Gestión del personal de servicio del condominio',
  },
  {
    id: 'proveedores',
    title: 'Proveedores',
    group: 'Servicios',
    keywords: ['proveedor', 'contratista', 'empresa', 'servicio externo', 'cotización', 'contrato', 'presupuesto', 'obra', 'reparación', 'fumigación', 'alberca', 'piscina'],
    description: 'Directorio y gestión de proveedores externos',
  },

  // Configuracion
  {
    id: 'perfil',
    title: 'Mi perfil',
    group: 'Configuración',
    keywords: ['perfil', 'cuenta', 'configuración', 'ajustes', 'contraseña', 'password', 'nombre', 'teléfono', 'foto', 'avatar', 'datos personales', 'editar perfil'],
    description: 'Configuración de perfil personal y preferencias de cuenta',
  },
]

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function scoreEntry(entry: DocsSearchEntry, normalizedQuery: string): number {
  const normalizedTitle = normalize(entry.title)
  const normalizedGroup = normalize(entry.group)
  const normalizedDescription = normalize(entry.description)

  // Exact title match gets highest score
  if (normalizedTitle === normalizedQuery) return 100

  // Title starts with query
  if (normalizedTitle.startsWith(normalizedQuery)) return 90

  // Title contains query
  if (normalizedTitle.includes(normalizedQuery)) return 80

  // Keyword exact match
  const keywordExact = entry.keywords.some(k => normalize(k) === normalizedQuery)
  if (keywordExact) return 70

  // Keyword starts with query
  const keywordStarts = entry.keywords.some(k => normalize(k).startsWith(normalizedQuery))
  if (keywordStarts) return 60

  // Keyword contains query
  const keywordContains = entry.keywords.some(k => normalize(k).includes(normalizedQuery))
  if (keywordContains) return 50

  // Group match
  if (normalizedGroup.includes(normalizedQuery)) return 40

  // Description contains query
  if (normalizedDescription.includes(normalizedQuery)) return 30

  // ID contains query
  if (entry.id.includes(normalizedQuery)) return 20

  return 0
}

const _docsSearchQuery = ref('')
const _docsSearchOpen = ref(false)

export function useDocsSearch() {
  const query = _docsSearchQuery
  const isOpen = _docsSearchOpen

  // Ctrl+K keyboard shortcut
  if (import.meta.client) {
    useEventListener(document, 'keydown', (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        openSearch()
      }
    })
  }

  const results = computed(() => {
    const trimmed = query.value.trim()
    if (!trimmed) return []

    const normalizedQuery = normalize(trimmed)

    return SEARCH_INDEX
      .map(entry => ({ entry, score: scoreEntry(entry, normalizedQuery) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ entry }) => entry)
  })

  function openSearch() {
    isOpen.value = true
    query.value = ''
  }

  function closeSearch() {
    isOpen.value = false
    query.value = ''
  }

  function selectResult(id: string) {
    closeSearch()
    const { scrollTo } = useDocsNavigation()
    scrollTo(id)
  }

  return {
    query,
    results,
    isOpen,
    openSearch,
    closeSearch,
    selectResult,
  }
}

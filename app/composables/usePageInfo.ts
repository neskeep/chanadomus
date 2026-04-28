interface PageInfo {
  title: string
  description: string
}

const PAGE_MAP: Record<string, PageInfo> = {
  // Admin
  '/admin': { title: 'Panel de Administración', description: 'Resumen general del condominio' },
  '/admin/finanzas': { title: 'Finanzas', description: 'Cobros, pagos y reportes financieros' },
  '/admin/incidencias': { title: 'Incidencias', description: 'Gestión de reportes y problemas' },
  '/admin/unidades': { title: 'Unidades', description: 'Directorio de viviendas del condominio' },
  '/admin/personal': { title: 'Personal', description: 'Equipo de trabajo del condominio' },
  '/admin/proveedores': { title: 'Proveedores', description: 'Directorio de servicios contratados' },
  '/admin/cartelera': { title: 'Cartelera', description: 'Anuncios y comunicados oficiales' },
  '/admin/votaciones': { title: 'Votaciones', description: 'Consultas y decisiones comunitarias' },
  '/admin/reuniones': { title: 'Reuniones', description: 'Calendario de asambleas y juntas' },

  // Propietario
  '/propietario': { title: 'Mi Vivienda', description: 'Tu resumen personal' },
  '/propietario/estado-cuenta': { title: 'Estado de Cuenta', description: 'Tu saldo y pagos realizados' },
  '/propietario/informes': { title: 'Informes Financieros', description: 'Reportes y documentos del condominio' },
  '/propietario/mis-visitas': { title: 'Mis Visitas', description: 'Invitaciones y códigos de acceso' },
  '/propietario/nueva-visita': { title: 'Nueva Visita', description: 'Genera un código QR para tu visitante' },
  '/propietario/incidencias': { title: 'Mis Incidencias', description: 'Reportes que has enviado' },
  '/propietario/incidencias/nueva': { title: 'Reportar Incidencia', description: 'Describe el problema que observas' },

  // Mi-Chana (shared pages)
  '/mi-chana/chat': { title: 'Chat', description: 'Conversaciones de la comunidad' },
  '/mi-chana/cartelera': { title: 'Cartelera', description: 'Anuncios y comunicados' },
  '/mi-chana/votaciones': { title: 'Votaciones', description: 'Participa en las decisiones' },
  '/mi-chana/proveedores': { title: 'Proveedores', description: 'Servicios recomendados' },
  '/mi-chana/reuniones': { title: 'Reuniones', description: 'Próximas asambleas y juntas' },
  '/mi-chana/notificaciones': { title: 'Notificaciones', description: 'Tus alertas recientes' },

  // Vigilancia
  '/vigilancia': { title: 'Panel de Vigilancia', description: 'Control de accesos del día' },
  '/vigilancia/escanear': { title: 'Escanear QR', description: 'Verifica el código del visitante' },
  '/vigilancia/accesos': { title: 'Registro de Accesos', description: 'Historial de entradas y salidas' },
  '/vigilancia/residentes': { title: 'Directorio de Residentes', description: 'Consulta de propietarios' },

  // Conserje
  '/conserje': { title: 'Panel de Conserjería', description: 'Tu resumen de actividad' },
  '/conserje/nueva-entrada': { title: 'Registrar Entrada', description: 'Ingresa un nuevo visitante' },
}

const DYNAMIC_ROUTES: Array<{ prefix: string; info: PageInfo }> = [
  { prefix: '/admin/unidades/', info: { title: 'Detalle de Unidad', description: 'Miembros, vehículos e información' } },
  { prefix: '/mi-chana/chat/', info: { title: 'Chat', description: 'Conversación' } },
  { prefix: '/mi-chana/proveedores/', info: { title: 'Detalle de Proveedor', description: 'Información y reseñas' } },
  { prefix: '/vigilancia/residentes/', info: { title: 'Ficha del Residente', description: 'Datos y vehículos' } },
  { prefix: '/acceso/', info: { title: 'Acceso de Visitante', description: 'Información de tu invitación' } },
]

const DEFAULT_PAGE_INFO: PageInfo = { title: 'ChanaDomus', description: '' }

/** Reactive override set by pages via usePageInfoOverride() */
const _override = ref<Partial<PageInfo> | null>(null)

export function usePageInfo() {
  const route = useRoute()

  const title = computed(() => {
    const base = _resolveBase(route.path)
    return _override.value?.title ?? base.title
  })

  const description = computed(() => {
    const base = _resolveBase(route.path)
    return _override.value?.description ?? base.description
  })

  return reactive({ title, description })
}

function _resolveBase(path: string): PageInfo {
  if (PAGE_MAP[path]) return PAGE_MAP[path]
  for (const { prefix, info } of DYNAMIC_ROUTES) {
    if (path.startsWith(prefix)) return info
  }
  return DEFAULT_PAGE_INFO
}

/** Allow pages to override the topbar title/description dynamically */
export function usePageInfoOverride(info: Ref<Partial<PageInfo> | null>) {
  watch(info, (val) => { _override.value = val }, { immediate: true })
  onBeforeUnmount(() => { _override.value = null })
}

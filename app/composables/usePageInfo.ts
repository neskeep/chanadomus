interface PageBreadcrumb {
  label: string
  to: string
}

interface PageInfo {
  title: string
  description: string
  breadcrumbs?: PageBreadcrumb[]
}

const PAGE_MAP: Record<string, PageInfo> = {
  // Admin
  '/admin': { title: 'Panel de Administración', description: 'Resumen general del condominio' },
  '/admin/finanzas': { title: 'Finanzas', description: 'Cobros, pagos y reportes financieros' },
  '/admin/finanzas/registrar': { title: 'Registrar Movimiento', description: 'Agrega un cargo o abono a una unidad', breadcrumbs: [{ label: 'Finanzas', to: '/admin/finanzas' }] },
  '/admin/finanzas/subir-informe': { title: 'Subir Informe', description: 'Sube un informe financiero en formato PDF', breadcrumbs: [{ label: 'Finanzas', to: '/admin/finanzas' }] },
  '/admin/incidencias': { title: 'Incidencias', description: 'Gestión de reportes y problemas' },
  '/admin/unidades': { title: 'Unidades', description: 'Directorio de viviendas del condominio' },
  '/admin/personal': { title: 'Personal', description: 'Equipo de trabajo del condominio' },
  '/admin/personal/crear': { title: 'Agregar Personal', description: 'Registra un nuevo miembro del equipo', breadcrumbs: [{ label: 'Personal', to: '/admin/personal' }] },
  '/admin/proveedores': { title: 'Proveedores', description: 'Directorio de servicios contratados' },
  '/admin/proveedores/crear': { title: 'Nuevo Proveedor', description: 'Agrega un proveedor al directorio', breadcrumbs: [{ label: 'Proveedores', to: '/admin/proveedores' }] },
  '/admin/cartelera': { title: 'Cartelera', description: 'Anuncios y comunicados oficiales' },
  '/admin/cartelera/crear': { title: 'Nuevo Anuncio', description: 'Crea un nuevo anuncio para la cartelera', breadcrumbs: [{ label: 'Cartelera', to: '/admin/cartelera' }] },
  '/admin/votaciones': { title: 'Votaciones', description: 'Consultas y decisiones comunitarias' },
  '/admin/votaciones/crear': { title: 'Nueva Votación', description: 'Crea una nueva votación para la comunidad', breadcrumbs: [{ label: 'Votaciones', to: '/admin/votaciones' }] },
  '/admin/reuniones': { title: 'Reuniones', description: 'Calendario de asambleas y juntas' },
  '/admin/reuniones/crear': { title: 'Nueva Reunión', description: 'Programa una nueva reunión o asamblea', breadcrumbs: [{ label: 'Reuniones', to: '/admin/reuniones' }] },

  // Propietario
  '/propietario': { title: 'Mi Vivienda', description: 'Tu resumen personal' },
  '/propietario/estado-cuenta': { title: 'Estado de Cuenta', description: 'Tu saldo y pagos realizados' },
  '/propietario/informes': { title: 'Informes Financieros', description: 'Reportes y documentos del condominio' },
  '/propietario/mis-visitas': { title: 'Mis Visitas', description: 'Invitaciones y códigos de acceso' },
  '/propietario/nueva-visita': { title: 'Nueva Visita', description: 'Genera un código QR para tu visitante', breadcrumbs: [{ label: 'Mis Visitas', to: '/propietario/mis-visitas' }] },
  '/propietario/incidencias': { title: 'Mis Incidencias', description: 'Reportes que has enviado' },
  '/propietario/incidencias/nueva': { title: 'Reportar Incidencia', description: 'Describe el problema que observas', breadcrumbs: [{ label: 'Mis Incidencias', to: '/propietario/incidencias' }] },

  // Mi-Chana (shared pages)
  '/mi-chana/chat': { title: 'Chat', description: 'Conversaciones de la comunidad' },
  '/mi-chana/cartelera': { title: 'Cartelera', description: 'Anuncios y comunicados' },
  '/mi-chana/votaciones': { title: 'Votaciones', description: 'Participa en las decisiones' },
  '/mi-chana/proveedores': { title: 'Proveedores', description: 'Servicios recomendados' },
  '/mi-chana/proveedores/sugerir': { title: 'Sugerir Proveedor', description: 'Recomienda un proveedor de confianza', breadcrumbs: [{ label: 'Proveedores', to: '/mi-chana/proveedores' }] },
  '/mi-chana/proveedores/crear': { title: 'Nuevo Proveedor', description: 'Registra un nuevo proveedor', breadcrumbs: [{ label: 'Proveedores', to: '/mi-chana/proveedores' }] },
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
  { prefix: '/admin/incidencias/', info: { title: 'Detalle de Incidencia', description: 'Información y estado del reporte', breadcrumbs: [{ label: 'Incidencias', to: '/admin/incidencias' }] } },
  { prefix: '/admin/unidades/', info: { title: 'Detalle de Unidad', description: 'Miembros, vehículos e información', breadcrumbs: [{ label: 'Unidades', to: '/admin/unidades' }] } },
  { prefix: '/mi-chana/chat/', info: { title: 'Chat', description: 'Conversación', breadcrumbs: [{ label: 'Chat', to: '/mi-chana/chat' }] } },
  { prefix: '/mi-chana/proveedores/', info: { title: 'Detalle de Proveedor', description: 'Información y reseñas', breadcrumbs: [{ label: 'Proveedores', to: '/mi-chana/proveedores' }] } },
  { prefix: '/vigilancia/residentes/', info: { title: 'Ficha del Residente', description: 'Datos y vehículos', breadcrumbs: [{ label: 'Directorio', to: '/vigilancia/residentes' }] } },
  { prefix: '/acceso/', info: { title: 'Acceso de Visitante', description: 'Información de tu invitación' } },
]

const DEFAULT_PAGE_INFO: PageInfo = { title: 'ChanaDomus', description: '' }

/** Reactive override set by pages via usePageInfoOverride() */
const _override = ref<Partial<PageInfo> | null>(null)

export function usePageInfo() {
  const route = useRoute()

  // Clear stale override: on SSR (prevents cross-request leak) and on client route changes
  if (import.meta.server) _override.value = null
  watch(() => route.path, () => { _override.value = null })

  const title = computed(() => {
    const base = _resolveBase(route.path)
    return _override.value?.title ?? base.title
  })

  const description = computed(() => {
    const base = _resolveBase(route.path)
    return _override.value?.description ?? base.description
  })

  const breadcrumbs = computed(() => {
    const base = _resolveBase(route.path)
    return _override.value?.breadcrumbs ?? base.breadcrumbs ?? undefined
  })

  return reactive({ title, description, breadcrumbs })
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

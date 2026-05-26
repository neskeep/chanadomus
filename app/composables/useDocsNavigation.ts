interface DocsTocItem {
  id: string
  label: string
}

interface DocsTocGroup {
  label: string
  icon: string
  items: DocsTocItem[]
}

const DOCS_GROUPS: DocsTocGroup[] = [
  {
    label: 'Introducción',
    icon: 'BookOpen',
    items: [
      { id: 'introduccion', label: 'Visión general' },
      { id: 'roles', label: 'Roles y permisos' },
    ],
  },
  {
    label: 'Gestión de Residentes',
    icon: 'Users',
    items: [
      { id: 'usuarios', label: 'Usuarios' },
      { id: 'invitaciones', label: 'Invitaciones de registro' },
      { id: 'unidades', label: 'Unidades y propiedades' },
      { id: 'miembros', label: 'Miembros del hogar' },
      { id: 'vehiculos', label: 'Vehículos' },
    ],
  },
  {
    label: 'Control de Acceso',
    icon: 'ScanLine',
    items: [
      { id: 'qr', label: 'Sistema de códigos QR' },
      { id: 'escaneo', label: 'Escaneo QR' },
      { id: 'accesos', label: 'Registro de accesos' },
      { id: 'pases-vehiculares', label: 'Pases vehiculares' },
      { id: 'visitantes-frecuentes', label: 'Visitantes frecuentes' },
    ],
  },
  {
    label: 'Seguridad',
    icon: 'ShieldAlert',
    items: [
      { id: 'panico', label: 'Botón de pánico' },
      { id: 'incidencias', label: 'Incidencias' },
    ],
  },
  {
    label: 'Comunicación',
    icon: 'MessageCircle',
    items: [
      { id: 'chat', label: 'Chat comunitario' },
      { id: 'cartelera', label: 'Cartelera y anuncios' },
      { id: 'notificaciones', label: 'Notificaciones push' },
    ],
  },
  {
    label: 'Gobernanza',
    icon: 'Vote',
    items: [
      { id: 'votaciones', label: 'Votaciones' },
      { id: 'reuniones', label: 'Reuniones' },
      { id: 'normativas', label: 'Normativas' },
    ],
  },
  {
    label: 'Finanzas',
    icon: 'Wallet',
    items: [
      { id: 'finanzas', label: 'Cargos, abonos e informes' },
    ],
  },
  {
    label: 'Servicios',
    icon: 'Wrench',
    items: [
      { id: 'personal', label: 'Personal de servicio' },
      { id: 'proveedores', label: 'Proveedores y servicios' },
    ],
  },
  {
    label: 'Configuración',
    icon: 'Settings',
    items: [
      { id: 'perfil', label: 'Mi perfil' },
    ],
  },
]

export function useDocsNavigation() {
  const groups = DOCS_GROUPS
  const activeId = ref<string>('introduccion')

  let observer: IntersectionObserver | null = null

  const flatItems = computed(() =>
    groups.flatMap(group =>
      group.items.map(item => ({
        ...item,
        group: group.label,
      })),
    ),
  )

  function scrollTo(id: string) {
    const element = document.querySelector(`[data-docs-section="${id}"]`)
    if (element) {
      activeId.value = id
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  function initObserver() {
    if (typeof window === 'undefined') return

    observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find(entry => entry.isIntersecting)
        if (visible) {
          const sectionId = (visible.target as HTMLElement).dataset.docsSection
          if (sectionId) {
            activeId.value = sectionId
          }
        }
      },
      {
        rootMargin: '-80px 0px -70% 0px',
      },
    )

    const sections = document.querySelectorAll('[data-docs-section]')
    sections.forEach(section => observer!.observe(section))
  }

  function destroyObserver() {
    if (observer) {
      observer.disconnect()
      observer = null
    }
  }

  return {
    groups,
    activeId,
    flatItems,
    scrollTo,
    initObserver,
    destroyObserver,
  }
}

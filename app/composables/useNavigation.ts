import type { Component } from 'vue'
import {
  Home, Wallet, AlertTriangle, Building2, Users, Shield,
  MessageCircle, Megaphone, Vote, Wrench, Calendar,
  ScanLine, ClipboardList, QrCode, FileText, CreditCard, Car,
  UserCog, ShieldAlert, BookOpen,
} from 'lucide-vue-next'
import { ROLE_REDIRECTS } from '~~/shared/types/auth'

interface NavItem {
  label: string
  icon: Component
  to: string
}

interface NavGroup {
  label: string
  items: NavItem[]
}

export function useNavigation() {
  const { role } = useAuth()

  const roleHome = computed(() => role.value ? ROLE_REDIRECTS[role.value] : '/')

  const groups = computed<NavGroup[]>(() => {
    switch (role.value) {
      case 'admin':
        return [
          {
            label: 'Principal',
            items: [
              { label: 'Inicio', icon: Home, to: '/admin' },
              { label: 'Finanzas', icon: Wallet, to: '/admin/finanzas' },
              { label: 'Incidencias', icon: AlertTriangle, to: '/admin/incidencias' },
            ],
          },
          {
            label: 'Gestion',
            items: [
              { label: 'Unidades', icon: Building2, to: '/admin/unidades' },
              { label: 'Usuarios', icon: UserCog, to: '/admin/usuarios' },
              { label: 'Personal', icon: Users, to: '/admin/personal' },
              { label: 'Proveedores', icon: Wrench, to: '/admin/proveedores' },
              { label: 'Roles de Servicio', icon: Users, to: '/admin/roles-servicio' },
              { label: 'Pases Vehiculares', icon: Car, to: '/admin/pases-vehiculares' },
            ],
          },
          {
            label: 'Comunidad',
            items: [
              { label: 'Chat', icon: MessageCircle, to: '/mi-chana/chat' },
              { label: 'Cartelera', icon: Megaphone, to: '/admin/cartelera' },
              { label: 'Normativas', icon: BookOpen, to: '/admin/normativas' },
              { label: 'Votaciones', icon: Vote, to: '/admin/votaciones' },
              { label: 'Reuniones', icon: Calendar, to: '/admin/reuniones' },
            ],
          },
        ]

      case 'propietario':
        return [
          {
            label: 'Principal',
            items: [
              { label: 'Inicio', icon: Home, to: '/propietario' },
              { label: 'Estado de Cuenta', icon: CreditCard, to: '/propietario/estado-cuenta' },
              { label: 'Informes', icon: FileText, to: '/propietario/informes' },
            ],
          },
          {
            label: 'Gestiones',
            items: [
              { label: 'Mi Unidad', icon: Building2, to: '/propietario/mi-unidad' },
              { label: 'Mi QR', icon: ScanLine, to: '/propietario/mi-qr' },
              { label: 'Mis Visitas', icon: QrCode, to: '/propietario/mis-visitas' },
              { label: 'Frecuentes', icon: Users, to: '/propietario/visitantes-frecuentes' },
              { label: 'Incidencias', icon: AlertTriangle, to: '/propietario/incidencias' },
            ],
          },
          {
            label: 'Comunidad',
            items: [
              { label: 'Chat', icon: MessageCircle, to: '/mi-chana/chat' },
              { label: 'Cartelera', icon: Megaphone, to: '/mi-chana/cartelera' },
              { label: 'Normativas', icon: BookOpen, to: '/mi-chana/normativas' },
              { label: 'Votaciones', icon: Vote, to: '/mi-chana/votaciones' },
              { label: 'Proveedores', icon: Wrench, to: '/mi-chana/proveedores' },
              { label: 'Reuniones', icon: Calendar, to: '/mi-chana/reuniones' },
            ],
          },
        ]

      case 'vigilancia':
        return [
          {
            label: 'Principal',
            items: [
              { label: 'Inicio', icon: Home, to: '/vigilancia' },
              { label: 'Escanear', icon: ScanLine, to: '/vigilancia/escanear' },
              { label: 'Accesos', icon: ClipboardList, to: '/vigilancia/accesos' },
              { label: 'Alertas', icon: ShieldAlert, to: '/vigilancia/alertas' },
            ],
          },
          {
            label: 'Consultas',
            items: [
              { label: 'Residentes', icon: Shield, to: '/vigilancia/residentes' },
            ],
          },
          {
            label: 'Comunidad',
            items: [
              { label: 'Chat', icon: MessageCircle, to: '/mi-chana/chat' },
              { label: 'Cartelera', icon: Megaphone, to: '/mi-chana/cartelera' },
              { label: 'Proveedores', icon: Wrench, to: '/mi-chana/proveedores' },
              { label: 'Reuniones', icon: Calendar, to: '/mi-chana/reuniones' },
            ],
          },
        ]

      case 'conserje':
        return [
          {
            label: 'Principal',
            items: [
              { label: 'Inicio', icon: Home, to: '/conserje' },
              { label: 'Incidencias', icon: AlertTriangle, to: '/conserje/incidencias' },
            ],
          },
          {
            label: 'Mi Rancho',
            items: [
              { label: 'Chat', icon: MessageCircle, to: '/mi-chana/chat' },
              { label: 'Mi QR', icon: ScanLine, to: '/conserje/mi-qr' },
              { label: 'Visitas', icon: QrCode, to: '/conserje/mis-visitas' },
              { label: 'Frecuentes', icon: Users, to: '/conserje/visitantes-frecuentes' },
            ],
          },
          {
            label: 'Comunidad',
            items: [
              { label: 'Cartelera', icon: Megaphone, to: '/mi-chana/cartelera' },
              { label: 'Normativas', icon: BookOpen, to: '/mi-chana/normativas' },
              { label: 'Proveedores', icon: Wrench, to: '/mi-chana/proveedores' },
              { label: 'Reuniones', icon: Calendar, to: '/mi-chana/reuniones' },
            ],
          },
        ]

      default:
        return []
    }
  })

  const mobileItems = computed<NavItem[]>(() => {
    switch (role.value) {
      case 'admin':
        return [
          { label: 'Inicio', icon: Home, to: '/admin' },
          { label: 'Finanzas', icon: Wallet, to: '/admin/finanzas' },
          { label: 'Incidencias', icon: AlertTriangle, to: '/admin/incidencias' },
          { label: 'Chat', icon: MessageCircle, to: '/mi-chana/chat' },
        ]

      case 'propietario':
        return [
          { label: 'Inicio', icon: Home, to: '/propietario' },
          { label: 'Visitas', icon: QrCode, to: '/propietario/mis-visitas' },
          { label: 'Incidencias', icon: AlertTriangle, to: '/propietario/incidencias' },
          { label: 'Chat', icon: MessageCircle, to: '/mi-chana/chat' },
        ]

      case 'vigilancia':
        return [
          { label: 'Inicio', icon: Home, to: '/vigilancia' },
          { label: 'Escanear', icon: ScanLine, to: '/vigilancia/escanear' },
          { label: 'Accesos', icon: ClipboardList, to: '/vigilancia/accesos' },
          { label: 'Chat', icon: MessageCircle, to: '/mi-chana/chat' },
        ]

      case 'conserje':
        return [
          { label: 'Inicio', icon: Home, to: '/conserje' },
          { label: 'Incidencias', icon: AlertTriangle, to: '/conserje/incidencias' },
          { label: 'Visitas', icon: QrCode, to: '/conserje/mis-visitas' },
          { label: 'Chat', icon: MessageCircle, to: '/mi-chana/chat' },
        ]

      default:
        return []
    }
  })

  /** All nav items not in mobileItems -- for the "Mas" sheet */
  const secondaryItems = computed<NavItem[]>(() => {
    const allItems = groups.value.flatMap(g => g.items)
    const mobilePaths = new Set(mobileItems.value.map(i => i.to))
    return allItems.filter(item => !mobilePaths.has(item.to))
  })

  return {
    groups,
    mobileItems,
    secondaryItems,
    roleHome,
  }
}

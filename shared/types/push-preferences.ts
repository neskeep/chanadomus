export type PushCategory = 'acceso' | 'anuncio' | 'incidencia' | 'votacion' | 'panico' | 'finanzas' | 'chat' | 'soporte'

export interface PushPreferences {
  acceso: boolean
  anuncio: boolean
  incidencia: boolean
  votacion: boolean
  panico: boolean
  finanzas: boolean
  chat: boolean
  soporte: boolean
}

export const PUSH_CATEGORIES: { key: PushCategory; label: string; description: string }[] = [
  { key: 'acceso', label: 'Control de Acceso', description: 'Notificaciones de acceso QR y visitas' },
  { key: 'anuncio', label: 'Anuncios', description: 'Nuevos anuncios y avisos publicados' },
  { key: 'incidencia', label: 'Incidencias', description: 'Reportes y actualizaciones de incidencias' },
  { key: 'votacion', label: 'Votaciones', description: 'Nuevas votaciones y resultados' },
  { key: 'panico', label: 'Emergencias', description: 'Alertas de boton de panico' },
  { key: 'finanzas', label: 'Finanzas', description: 'Avisos de pagos y estados de cuenta' },
  { key: 'chat', label: 'Chat', description: 'Mensajes nuevos en salas de chat' },
  { key: 'soporte', label: 'Soporte', description: 'Tickets de soporte y actualizaciones' },
]

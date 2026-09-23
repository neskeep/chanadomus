// Enum legado de categorías. La categoría vigente es el rol de servicio
// (serviceRoleId); los proveedores nuevos se guardan con category 'otro'.
export const PROVIDER_CATEGORY_KEYS = [
  'plomeria',
  'electricidad',
  'jardineria',
  'cerrajeria',
  'limpieza',
  'pintura',
  'albanileria',
  'seguridad',
  'fumigacion',
  'otro',
] as const

export type ProviderCategory = typeof PROVIDER_CATEGORY_KEYS[number]

export type ProviderStatus = 'active' | 'inactive' | 'pending'

export interface Provider {
  id: string
  name: string
  phone: string | null
  photo: string | null
  schedule: string | null
  address: string | null
  services: string[] | null
  costs: string | null
  notes: string | null
  category: ProviderCategory
  serviceRoleId: string | null
  serviceRoleName?: string
  status: ProviderStatus
  createdById: string
  createdByName?: string
  tenantId: string
  createdAt: string
  updatedAt: string
  averageRating?: number
  reviewCount?: number
  reviews?: ProviderReview[]
}

export interface ProviderReview {
  id: string
  providerId: string
  rating: number
  comment: string | null
  reviewerId: string
  reviewerName?: string
  tenantId: string
  createdAt: string
}

export interface CreateProvider {
  name: string
  phone?: string
  photo?: string
  schedule?: string
  address?: string
  services?: string[]
  costs?: string
  notes?: string
  category: ProviderCategory
  serviceRoleId?: string
}

/** Sugerencia de proveedor enviada por un propietario. */
export interface SuggestProvider {
  name: string
  serviceRoleId: string
  category?: ProviderCategory
  phone?: string
  notes?: string
}

export interface UpdateProvider {
  name?: string
  phone?: string | null
  photo?: string | null
  schedule?: string | null
  address?: string | null
  services?: string[] | null
  costs?: string | null
  notes?: string | null
  category?: ProviderCategory
  serviceRoleId?: string | null
  status?: ProviderStatus
}

export interface CreateReview {
  rating: number
  comment?: string
}

export const PROVIDER_CATEGORIES: { key: ProviderCategory; label: string }[] = [
  { key: 'plomeria', label: 'Plomería' },
  { key: 'electricidad', label: 'Electricidad' },
  { key: 'jardineria', label: 'Jardinería' },
  { key: 'cerrajeria', label: 'Cerrajería' },
  { key: 'limpieza', label: 'Limpieza' },
  { key: 'pintura', label: 'Pintura' },
  { key: 'albanileria', label: 'Albañilería' },
  { key: 'seguridad', label: 'Seguridad' },
  { key: 'fumigacion', label: 'Fumigación' },
  { key: 'otro', label: 'Otro' },
]

export function isProviderCategory(value: unknown): value is ProviderCategory {
  return typeof value === 'string' && (PROVIDER_CATEGORY_KEYS as readonly string[]).includes(value)
}

/** Etiqueta visible de la categoría: el rol de servicio si existe, si no el enum legado. */
export function getProviderCategoryLabel(provider: Pick<Provider, 'category' | 'serviceRoleName'>): string {
  if (provider.serviceRoleName) return provider.serviceRoleName
  return PROVIDER_CATEGORIES.find(c => c.key === provider.category)?.label ?? 'Otro'
}

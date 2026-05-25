export type ProviderCategory =
  | 'plomeria'
  | 'electricidad'
  | 'jardineria'
  | 'cerrajeria'
  | 'limpieza'
  | 'pintura'
  | 'albanileria'
  | 'seguridad'
  | 'fumigacion'
  | 'otro'

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
  { key: 'plomeria', label: 'Plomeria' },
  { key: 'electricidad', label: 'Electricidad' },
  { key: 'jardineria', label: 'Jardineria' },
  { key: 'cerrajeria', label: 'Cerrajeria' },
  { key: 'limpieza', label: 'Limpieza' },
  { key: 'pintura', label: 'Pintura' },
  { key: 'albanileria', label: 'Albanileria' },
  { key: 'seguridad', label: 'Seguridad' },
  { key: 'fumigacion', label: 'Fumigacion' },
  { key: 'otro', label: 'Otro' },
]

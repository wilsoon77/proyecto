import 'server-only'

import type { ApiCategory, ApiProduct, PaginatedResponse, ProductFilters } from '@/lib/api/types'

const REVALIDATE_SECONDS = 60

function getApiBaseUrl() {
  return (process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '')
}

function buildProductQuery(filters: ProductFilters) {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.category) params.set('category', filters.category)
  if (filters.min !== undefined) params.set('min', String(filters.min))
  if (filters.max !== undefined) params.set('max', String(filters.max))
  if (filters.sort) params.set('sort', filters.sort)
  if (filters.branch) params.set('branch', filters.branch)
  if (filters.page !== undefined) params.set('page', String(filters.page))
  if (filters.pageSize !== undefined) params.set('pageSize', String(filters.pageSize))
  return params.toString()
}

async function publicFetch<T>(path: string, tags: string[]): Promise<T | null> {
  try {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: REVALIDATE_SECONDS, tags },
    })

    if (!response.ok) return null
    return response.json() as Promise<T>
  } catch (error) {
    // Un fallo temporal de la API no debe impedir generar una página pública.
    console.error(`[Catalog SSR] Unable to fetch ${path}:`, error)
    return null
  }
}

export async function getPublicCatalog(filters: ProductFilters): Promise<PaginatedResponse<ApiProduct>> {
  const query = buildProductQuery(filters)
  const result = await publicFetch<PaginatedResponse<ApiProduct>>(`/products${query ? `?${query}` : ''}`, ['catalog'])
  const page = filters.page ?? 1
  const pageSize = filters.pageSize ?? 12
  return result ?? {
    data: [],
    meta: { total: 0, pageCount: 0, page, pageSize },
  }
}

export async function getPublicCategories(): Promise<ApiCategory[]> {
  return (await publicFetch<ApiCategory[]>('/categories', ['catalog-categories'])) ?? []
}

export async function getPublicProduct(slug: string, branch?: string): Promise<ApiProduct | null> {
  const params = branch ? `?branch=${encodeURIComponent(branch)}` : ''
  return publicFetch<ApiProduct>(`/products/${encodeURIComponent(slug)}${params}`, ['catalog', `product:${slug}`])
}

export async function getRelatedPublicProducts(category: string, currentSlug: string): Promise<ApiProduct[]> {
  const result = await getPublicCatalog({ category, page: 1, pageSize: 5 })
  return result.data.filter((product) => product.slug !== currentSlug).slice(0, 4)
}

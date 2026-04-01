"use client"

import { useQuery } from '@tanstack/react-query'
import { productsService } from '@/lib/api'
import type { ApiProduct, PaginatedResponse, ProductFilters } from '@/lib/api/types'

// Keys para react-query (facilita invalidación y caching)
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: ProductFilters) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (slug: string) => [...productKeys.details(), slug] as const,
  featured: (limit: number) => [...productKeys.all, 'featured', limit] as const,
}

interface UseProductsReturn {
  products: ApiProduct[]
  meta: PaginatedResponse<ApiProduct>['meta'] | null
  isLoading: boolean
  isFetching: boolean
  error: Error | null
  refetch: () => void
}

export function useProducts(filters: ProductFilters = {}, options = {}): UseProductsReturn {
  const queryInfo = useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => productsService.list(filters),
    ...options,
  })

  return {
    products: queryInfo.data?.data || [],
    meta: queryInfo.data?.meta || null,
    isLoading: queryInfo.isLoading,
    isFetching: queryInfo.isFetching,
    error: queryInfo.error as Error | null,
    refetch: queryInfo.refetch,
  }
}

// Hook para producto individual
interface UseProductReturn {
  product: ApiProduct | null
  isLoading: boolean
  isFetching: boolean
  error: Error | null
  refetch: () => void
}

export function useProduct(slug: string, options = {}): UseProductReturn {
  const queryInfo = useQuery({
    queryKey: productKeys.detail(slug),
    queryFn: () => productsService.getBySlug(slug),
    enabled: !!slug, // Solo se ejecuta si hay slug
    ...options,
  })

  return {
    product: queryInfo.data || null,
    isLoading: queryInfo.isLoading,
    isFetching: queryInfo.isFetching,
    error: queryInfo.error as Error | null,
    refetch: queryInfo.refetch,
  }
}

// Hook para productos destacados
interface UseFeaturedProductsReturn {
  products: ApiProduct[]
  isLoading: boolean
  isFetching: boolean
  error: Error | null
  refetch: () => void
}

export function useFeaturedProducts(limit: number = 10, options = {}): UseFeaturedProductsReturn {
  const queryInfo = useQuery({
    queryKey: productKeys.featured(limit),
    queryFn: () => productsService.featured(limit),
    ...options,
  })

  return {
    products: queryInfo.data || [],
    isLoading: queryInfo.isLoading,
    isFetching: queryInfo.isFetching,
    error: queryInfo.error as Error | null,
    refetch: queryInfo.refetch,
  }
}

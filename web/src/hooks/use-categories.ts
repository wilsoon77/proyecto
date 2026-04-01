"use client"

import { useQuery } from '@tanstack/react-query'
import { categoriesService } from '@/lib/api'
import type { ApiCategory } from '@/lib/api/types'

export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (slug: string) => [...categoryKeys.details(), slug] as const,
}

interface UseCategoriesReturn {
  categories: ApiCategory[]
  isLoading: boolean
  isFetching: boolean
  error: Error | null
  refetch: () => void
}

export function useCategories(options = {}): UseCategoriesReturn {
  const queryInfo = useQuery({
    queryKey: categoryKeys.lists(),
    queryFn: () => categoriesService.list(),
    ...options,
  })

  return {
    categories: queryInfo.data || [],
    isLoading: queryInfo.isLoading,
    isFetching: queryInfo.isFetching,
    error: queryInfo.error as Error | null,
    refetch: queryInfo.refetch,
  }
}

// Hook para categoría individual
interface UseCategoryReturn {
  category: ApiCategory | null
  isLoading: boolean
  isFetching: boolean
  error: Error | null
  refetch: () => void
}

export function useCategory(slug: string, options = {}): UseCategoryReturn {
  const queryInfo = useQuery({
    queryKey: categoryKeys.detail(slug),
    queryFn: () => categoriesService.getBySlug(slug),
    enabled: !!slug,
    ...options,
  })

  return {
    category: queryInfo.data || null,
    isLoading: queryInfo.isLoading,
    isFetching: queryInfo.isFetching,
    error: queryInfo.error as Error | null,
    refetch: queryInfo.refetch,
  }
}

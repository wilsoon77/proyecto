"use client"

import { useState, useEffect, useCallback } from "react"
import { categoriesService } from "@/lib/api"
import type { ApiCategory } from "@/lib/api/types"

interface UseCategoriesReturn {
  categories: ApiCategory[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useCategories(): UseCategoriesReturn {
  const [categories, setCategories] = useState<ApiCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchCategories = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await categoriesService.list()
      setCategories(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error cargando categorías'))
      console.error('Error fetching categories:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  return {
    categories,
    isLoading,
    error,
    refetch: fetchCategories,
  }
}

// Hook para categoría individual
interface UseCategoryReturn {
  category: ApiCategory | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useCategory(slug: string): UseCategoryReturn {
  const [category, setCategory] = useState<ApiCategory | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchCategory = useCallback(async () => {
    if (!slug) return
    
    setIsLoading(true)
    setError(null)
    try {
      const data = await categoriesService.getBySlug(slug)
      setCategory(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error cargando categoría'))
      console.error('Error fetching category:', err)
    } finally {
      setIsLoading(false)
    }
  }, [slug])

  useEffect(() => {
    fetchCategory()
  }, [fetchCategory])

  return {
    category,
    isLoading,
    error,
    refetch: fetchCategory,
  }
}

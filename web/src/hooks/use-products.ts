"use client"

import { useState, useEffect, useCallback } from "react"
import { productsService } from "@/lib/api"
import type { ApiProduct, PaginatedResponse, ProductFilters } from "@/lib/api/types"

interface UseProductsOptions {
  initialFilters?: ProductFilters
  autoFetch?: boolean
}

interface UseProductsReturn {
  products: ApiProduct[]
  meta: PaginatedResponse<ApiProduct>['meta'] | null
  isLoading: boolean
  error: Error | null
  filters: ProductFilters
  setFilters: (filters: ProductFilters) => void
  refetch: () => Promise<void>
}

export function useProducts(options: UseProductsOptions = {}): UseProductsReturn {
  const { initialFilters = {}, autoFetch = true } = options

  const [products, setProducts] = useState<ApiProduct[]>([])
  const [meta, setMeta] = useState<PaginatedResponse<ApiProduct>['meta'] | null>(null)
  const [isLoading, setIsLoading] = useState(autoFetch)
  const [error, setError] = useState<Error | null>(null)
  const [filters, setFilters] = useState<ProductFilters>(initialFilters)

  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await productsService.list(filters)
      setProducts(response.data)
      setMeta(response.meta)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error cargando productos'))
      console.error('Error fetching products:', err)
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    if (autoFetch) {
      fetchProducts()
    }
  }, [fetchProducts, autoFetch])

  return {
    products,
    meta,
    isLoading,
    error,
    filters,
    setFilters,
    refetch: fetchProducts,
  }
}

// Hook para producto individual
interface UseProductReturn {
  product: ApiProduct | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useProduct(slug: string): UseProductReturn {
  const [product, setProduct] = useState<ApiProduct | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchProduct = useCallback(async () => {
    if (!slug) return
    
    setIsLoading(true)
    setError(null)
    try {
      const data = await productsService.getBySlug(slug)
      setProduct(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error cargando producto'))
      console.error('Error fetching product:', err)
    } finally {
      setIsLoading(false)
    }
  }, [slug])

  useEffect(() => {
    fetchProduct()
  }, [fetchProduct])

  return {
    product,
    isLoading,
    error,
    refetch: fetchProduct,
  }
}

// Hook para productos destacados
interface UseFeaturedProductsReturn {
  products: ApiProduct[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useFeaturedProducts(limit: number = 10): UseFeaturedProductsReturn {
  const [products, setProducts] = useState<ApiProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchFeatured = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await productsService.featured(limit)
      setProducts(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error cargando productos destacados'))
      console.error('Error fetching featured products:', err)
    } finally {
      setIsLoading(false)
    }
  }, [limit])

  useEffect(() => {
    fetchFeatured()
  }, [fetchFeatured])

  return {
    products,
    isLoading,
    error,
    refetch: fetchFeatured,
  }
}

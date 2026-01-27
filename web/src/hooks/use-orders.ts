"use client"

import { useState, useEffect, useCallback } from "react"
import { ordersService } from "@/lib/api"
import type { ApiOrder, PaginatedResponse, OrderFilters } from "@/lib/api/types"

// Hook para mis órdenes (usuario autenticado)
interface UseMyOrdersReturn {
  orders: ApiOrder[]
  meta: PaginatedResponse<ApiOrder>['meta'] | null
  isLoading: boolean
  error: Error | null
  filters: Omit<OrderFilters, 'branchSlug'>
  setFilters: (filters: Omit<OrderFilters, 'branchSlug'>) => void
  refetch: () => Promise<void>
}

export function useMyOrders(initialFilters: Omit<OrderFilters, 'branchSlug'> = {}): UseMyOrdersReturn {
  const [orders, setOrders] = useState<ApiOrder[]>([])
  const [meta, setMeta] = useState<PaginatedResponse<ApiOrder>['meta'] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [filters, setFilters] = useState(initialFilters)

  const fetchOrders = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await ordersService.myOrders(filters)
      setOrders(response.data)
      setMeta(response.meta)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error cargando órdenes'))
      console.error('Error fetching my orders:', err)
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  return {
    orders,
    meta,
    isLoading,
    error,
    filters,
    setFilters,
    refetch: fetchOrders,
  }
}

// Hook para orden individual
interface UseOrderReturn {
  order: ApiOrder | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
  cancel: () => Promise<void>
}

export function useOrder(id: number): UseOrderReturn {
  const [order, setOrder] = useState<ApiOrder | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchOrder = useCallback(async () => {
    if (!id) return
    
    setIsLoading(true)
    setError(null)
    try {
      const data = await ordersService.getById(id)
      setOrder(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error cargando orden'))
      console.error('Error fetching order:', err)
    } finally {
      setIsLoading(false)
    }
  }, [id])

  const cancel = useCallback(async () => {
    if (!id) return
    try {
      const updated = await ordersService.cancel(id)
      setOrder(updated)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error cancelando orden'))
      throw err
    }
  }, [id])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  return {
    order,
    isLoading,
    error,
    refetch: fetchOrder,
    cancel,
  }
}

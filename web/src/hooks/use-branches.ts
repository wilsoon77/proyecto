"use client"

import { useQuery } from '@tanstack/react-query'
import { branchesService } from '@/lib/api'
import type { ApiBranch } from '@/lib/api/types'

export const branchKeys = {
  all: ['branches'] as const,
  lists: () => [...branchKeys.all, 'list'] as const,
  details: () => [...branchKeys.all, 'detail'] as const,
  detail: (id: number) => [...branchKeys.details(), id] as const,
}

interface UseBranchesReturn {
  branches: ApiBranch[]
  isLoading: boolean
  isFetching: boolean
  error: Error | null
  refetch: () => void
}

export function useBranches(options = {}): UseBranchesReturn {
  const queryInfo = useQuery({
    queryKey: branchKeys.lists(),
    queryFn: () => branchesService.list(),
    ...options,
  })

  return {
    branches: queryInfo.data || [],
    isLoading: queryInfo.isLoading,
    isFetching: queryInfo.isFetching,
    error: queryInfo.error as Error | null,
    refetch: queryInfo.refetch,
  }
}

// Hook para sucursal individual
interface UseBranchReturn {
  branch: ApiBranch | null
  isLoading: boolean
  isFetching: boolean
  error: Error | null
  refetch: () => void
}

export function useBranch(id: number, options = {}): UseBranchReturn {
  const queryInfo = useQuery({
    queryKey: branchKeys.detail(id),
    queryFn: () => branchesService.getById(id),
    enabled: !!id,
    ...options,
  })

  return {
    branch: queryInfo.data || null,
    isLoading: queryInfo.isLoading,
    isFetching: queryInfo.isFetching,
    error: queryInfo.error as Error | null,
    refetch: queryInfo.refetch,
  }
}
